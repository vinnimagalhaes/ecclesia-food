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
    // Verificar autenticação (opcional, apenas para log)
    const session = await getServerSession(authOptions);
    console.log('Status da sessão para eventos de pagamento:', session ? 'Autenticado' : 'Não autenticado');
    
    // Não exigir autenticação para permitir pagamentos anônimos
    // Removida a verificação obrigatória de sessão

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
    console.log('POST /api/payment-events recebido');
    
    // Verificar autenticação (apenas admin ou requisição interna)
    const session = await getServerSession(authOptions);
    const internalApiKey = request.headers.get('x-internal-api-key');
    console.log('Verificando autenticação. Header x-internal-api-key presente:', !!internalApiKey);
    
    // Configurado no Vercel Environment Variables
    const expectedApiKey = process.env.INTERNAL_API_KEY || 'default-internal-key';
    console.log('Validando chave API (primeiros 4 caracteres esperados):', expectedApiKey.substring(0, 4) + '...');
    
    const isInternalRequest = internalApiKey === expectedApiKey;
    console.log('É uma requisição interna?', isInternalRequest);
    console.log('Usuário autenticado?', !!session?.user);
    console.log('É admin?', session?.user?.role === 'ADMIN');
    
    // Temporariamente desabilitar verificação de autenticação para debug
    // Remova ou comente estas linhas em produção
    console.log('Desabilitando verificação de auth para debug');
    
    /*
    if (!isInternalRequest && (!session?.user || session.user.role !== 'ADMIN')) {
      console.log('Não autorizado: nem usuário admin nem requisição interna');
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }
    */
    
    const body = await request.json();
    console.log('Dados recebidos:', body);
    
    const { transactionId, orderId, status } = body;

    if ((!transactionId && !orderId) || !status) {
      console.log('Dados incompletos:', { transactionId, orderId, status });
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    console.log('Publicando evento para:', { transactionId, orderId, status });
    await publishPaymentEvent(transactionId || '', orderId || '', status);
    console.log('Evento publicado com sucesso');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao publicar evento de pagamento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}