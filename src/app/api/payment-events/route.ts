import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { EventPaymentData, EventQueue } from '@/lib/events';

// Fila de eventos para cada transação
export const eventQueues: Record<string, EventQueue> = {};

// Limpar filas antigas a cada 30 minutos
setInterval(() => {
  const now = Date.now();
  Object.keys(eventQueues).forEach(key => {
    const queue = eventQueues[key];
    // Remove filas inativas por mais de 1 hora
    if (now - queue.lastUsed > 60 * 60 * 1000) {
      delete eventQueues[key];
    }
  });
}, 30 * 60 * 1000);

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Obter o ID da transação
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const orderId = searchParams.get('orderId');

    if (!transactionId && !orderId) {
      return NextResponse.json(
        { error: 'ID da transação ou pedido não fornecido' },
        { status: 400 }
      );
    }

    // Configurar Headers para SSE
    const responseHeaders = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    };

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Enviar mensagem de conexão estabelecida
    const initialMessage = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
    writer.write(encoder.encode(initialMessage));

    // Criar ou obter a fila de eventos para este transactionId/orderId
    const queueId = transactionId || orderId;
    if (!queueId) {
      return NextResponse.json(
        { error: 'ID da fila não disponível' },
        { status: 400 }
      );
    }

    if (!eventQueues[queueId]) {
      eventQueues[queueId] = {
        listeners: [],
        events: [],
        lastUsed: Date.now()
      };
    }

    const queue = eventQueues[queueId];
    queue.lastUsed = Date.now();

    // Adicionar o writer à lista de listeners
    const listener = { 
      id: crypto.randomUUID(),
      writer, 
      encoder,
      lastSent: Date.now(),
    };
    queue.listeners.push(listener);

    // Buscar o status atual do pagamento
    let paymentStatus = 'PENDING';
    let sale;

    if (orderId) {
      sale = await prisma.sale.findUnique({
        where: { id: orderId },
      });
      
      if (sale?.metadata && typeof sale.metadata === 'object') {
        paymentStatus = (sale.metadata as any).paymentStatus || 'PENDING';
      }
    } else if (transactionId) {
      sale = await prisma.sale.findFirst({
        where: {
          metadata: {
            path: ['paymentId'],
            equals: transactionId
          }
        }
      });
      
      if (sale?.metadata && typeof sale.metadata === 'object') {
        paymentStatus = (sale.metadata as any).paymentStatus || 'PENDING';
      }
    }

    // Enviar status atual do pagamento
    const statusMessage = `data: ${JSON.stringify({
      type: 'status',
      data: { status: paymentStatus, timestamp: new Date().toISOString() }
    })}\n\n`;
    
    writer.write(encoder.encode(statusMessage));

    // Enviar eventos pendentes
    for (const event of queue.events) {
      const eventMessage = `data: ${JSON.stringify(event)}\n\n`;
      writer.write(encoder.encode(eventMessage));
    }

    // Configurar ping a cada 30 segundos para manter a conexão ativa
    const pingInterval = setInterval(() => {
      try {
        const pingMessage = `data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`;
        writer.write(encoder.encode(pingMessage));
        listener.lastSent = Date.now();
      } catch (error) {
        console.error('Erro ao enviar ping:', error);
        clearInterval(pingInterval);
        
        // Remover o listener da lista
        const index = queue.listeners.findIndex(l => l.id === listener.id);
        if (index !== -1) {
          queue.listeners.splice(index, 1);
        }
      }
    }, 30000);

    // Configurar cleanup quando o cliente desconectar
    request.signal.addEventListener('abort', () => {
      clearInterval(pingInterval);
      try {
        writer.close();
      } catch (error) {
        console.error('Erro ao fechar writer:', error);
      }
      
      // Remover o listener da lista
      const index = queue.listeners.findIndex(l => l.id === listener.id);
      if (index !== -1) {
        queue.listeners.splice(index, 1);
      }
    });

    return new Response(stream.readable, { headers: responseHeaders });
  } catch (error) {
    console.error('Erro ao processar eventos de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para publicar um evento de pagamento
export async function publishPaymentEvent(transactionId: string, orderId: string, status: string) {
  const queueId = transactionId || orderId;
  if (!queueId) return;

  const queue = eventQueues[queueId] || {
    listeners: [],
    events: [],
    lastUsed: Date.now()
  };
  
  // Atualizar a hora de último uso
  queue.lastUsed = Date.now();
  
  // Criar o evento
  const event: EventPaymentData = {
    type: 'payment_update',
    data: {
      transactionId,
      orderId,
      status,
      timestamp: new Date().toISOString()
    }
  };
  
  // Adicionar à fila de eventos
  queue.events.push(event);
  
  // Manter apenas os 10 eventos mais recentes
  if (queue.events.length > 10) {
    queue.events.shift();
  }
  
  // Armazenar a fila se não existir
  if (!eventQueues[queueId]) {
    eventQueues[queueId] = queue;
  }
  
  // Enviar para todos os listeners
  for (const listener of queue.listeners) {
    try {
      const message = `data: ${JSON.stringify(event)}\n\n`;
      listener.writer.write(listener.encoder.encode(message));
      listener.lastSent = Date.now();
    } catch (error) {
      console.error('Erro ao enviar evento para listener:', error);
    }
  }
  
  // Remover listeners inativos
  const now = Date.now();
  queue.listeners = queue.listeners.filter(listener => {
    // Manter apenas listeners que receberam dados nos últimos 2 minutos
    return now - listener.lastSent < 2 * 60 * 1000;
  });
}

// Endpoint para teste de publicação de evento
export async function POST(request: Request) {
  try {
    // Verificar autenticação (apenas admin)
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { transactionId, orderId, status } = body;

    if ((!transactionId && !orderId) || !status) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    await publishPaymentEvent(transactionId || '', orderId || '', status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao publicar evento de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 