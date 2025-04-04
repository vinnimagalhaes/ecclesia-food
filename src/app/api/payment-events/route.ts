import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { eventQueues, publishPaymentEvent } from '@/lib/event-service';

// Definições de tipo in-line para evitar problemas de importação
interface EventListener {
  id: string;
  writer: WritableStreamDefaultWriter<any>;
  encoder: TextEncoder;
  lastSent: number;
}

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
    const listener: EventListener = { 
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
        const index = queue.listeners.findIndex((l: EventListener) => l.id === listener.id);
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
      const index = queue.listeners.findIndex((l: EventListener) => l.id === listener.id);
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

// Endpoint para teste de publicação de evento
export async function POST(request: Request) {
  try {
    // Verificar autenticação (apenas admin ou requisição interna)
    const session = await getServerSession(authOptions);
    const internalApiKey = request.headers.get('x-internal-api-key');
    const isInternalRequest = internalApiKey === (process.env.INTERNAL_API_KEY || 'default-internal-key');
    
    if (!isInternalRequest && (!session?.user || session.user.role !== 'ADMIN')) {
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