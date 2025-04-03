import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PAGARME_API_KEY } from '@/config/env';
import crypto from 'crypto';
import { publishPaymentEvent } from '@/app/api/payment-events/route';

// Verificar a assinatura do webhook da Pagar.me
function verifyWebhookSignature(signature: string, payload: string, secret: string): boolean {
  try {
    if (!signature || !payload) {
      console.error('Assinatura ou payload vazios');
      return false;
    }

    const hmac = crypto.createHmac('sha256', secret);
    const calculatedSignature = hmac.update(payload).digest('hex');

    // Comparar a assinatura calculada com a fornecida
    console.log('Assinatura recebida:', signature);
    console.log('Assinatura calculada:', calculatedSignature);

    return crypto.timingSafeEqual(
      Buffer.from(calculatedSignature),
      Buffer.from(signature)
    );
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    console.log('Webhook da Pagar.me recebido');

    // Obter a assinatura do header
    const signature = req.headers.get('x-hub-signature') || '';
    
    // Obter o payload como texto
    const payload = await req.text();
    console.log('Payload do webhook:', payload);

    // Verificar a assinatura do webhook (se estiver em produção)
    if (PAGARME_API_KEY?.startsWith('sk_live_')) {
      const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;
      
      if (!webhookSecret) {
        console.error('PAGARME_WEBHOOK_SECRET não está definido nas variáveis de ambiente');
        return NextResponse.json({ error: 'Configuração de webhook inválida' }, { status: 500 });
      }

      const isValidSignature = verifyWebhookSignature(signature, payload, webhookSecret);
      
      if (!isValidSignature) {
        console.error('Assinatura do webhook inválida');
        return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
      }
    } else {
      console.log('Pulando verificação de assinatura em ambiente de teste');
    }

    // Fazer o parse do payload
    const data = JSON.parse(payload);
    console.log('Evento recebido:', data.type);
    
    // Processar apenas eventos de pagamento
    if (!data.type || !data.type.startsWith('charge.')) {
      console.log('Tipo de evento ignorado:', data.type);
      return NextResponse.json({ received: true, processed: false });
    }

    // Extrair os dados relevantes
    const chargeId = data.data?.id;
    const status = data.data?.status;
    const orderId = data.data?.code;

    console.log('Dados do evento:', { chargeId, status, orderId });

    if (!chargeId || !status) {
      console.error('Dados incompletos no webhook');
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Buscar o pedido pelo ID ou pelo chargeId nos metadados
    let sale;
    
    if (orderId) {
      sale = await prisma.sale.findFirst({
        where: { id: orderId }
      });
    }
    
    if (!sale && chargeId) {
      sale = await prisma.sale.findFirst({
        where: {
          metadata: {
            path: ['paymentId'],
            equals: chargeId
          }
        }
      });
    }

    if (!sale) {
      console.error('Pedido não encontrado para o ID:', orderId || chargeId);
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    console.log('Pedido encontrado:', sale.id);

    // Mapear o status da Pagar.me para o status do pedido
    let paymentStatus: string;
    
    switch (status) {
      case 'paid':
        paymentStatus = 'PAID';
        break;
      case 'pending':
        paymentStatus = 'PENDING';
        break;
      case 'canceled':
      case 'failed':
        paymentStatus = 'FAILED';
        break;
      default:
        paymentStatus = 'PENDING';
    }

    // Atualizar o pedido no banco de dados
    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        metadata: {
          ...sale.metadata as any,
          paymentStatus,
          updatedAt: new Date().toISOString(),
          webhookReceived: true,
          lastWebhookType: data.type,
        }
      }
    });

    console.log('Pedido atualizado com sucesso:', { id: sale.id, status: paymentStatus });

    // Publicar evento de pagamento para notificar clientes em tempo real
    await publishPaymentEvent(chargeId, sale.id, paymentStatus);
    console.log('Evento de pagamento publicado');

    // Retornar sucesso
    return NextResponse.json({ 
      received: true, 
      processed: true,
      orderId: sale.id,
      status: paymentStatus
    });
  } catch (error) {
    console.error('Erro ao processar webhook da Pagar.me:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 