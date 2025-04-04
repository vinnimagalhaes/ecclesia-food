import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PAGARME_API_KEY } from '@/config/env';
import crypto from 'crypto';

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

// Verificar autenticação HTTP Basic
function verifyBasicAuth(authHeader: string | null): boolean {
  try {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      console.error('Header de autenticação inválido');
      return false;
    }

    // Extrair as credenciais (formato: "Basic base64(username:password)")
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    // Obter as credenciais configuradas
    const configUsername = process.env.PAGARME_WEBHOOK_USERNAME;
    const configPassword = process.env.PAGARME_WEBHOOK_PASSWORD;

    if (!configUsername || !configPassword) {
      console.error('Credenciais de webhook não configuradas');
      return false;
    }

    // Verificar se as credenciais batem
    const isValid = username === configUsername && password === configPassword;
    
    if (!isValid) {
      console.error('Credenciais de webhook inválidas');
    }
    
    return isValid;
  } catch (error) {
    console.error('Erro ao verificar autenticação básica:', error);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    console.log('Webhook da Pagar.me recebido');

    // Verificar autenticação básica
    const authHeader = req.headers.get('authorization');
    
    // Temporariamente desabilitando verificação de auth para debug
    console.log('Pulando verificação de autenticação para debug');
    
    /*
    // Em produção, verificar a autenticação básica
    if (PAGARME_API_KEY?.startsWith('sk_live_')) {
      if (!verifyBasicAuth(authHeader)) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
      }
    } else {
      console.log('Pulando verificação de autenticação em ambiente de teste');
    }
    */

    // Obter a assinatura do header (se existir)
    const signature = req.headers.get('x-hub-signature') || '';
    
    // Obter o payload como texto
    const payload = await req.text();
    console.log('Payload do webhook:', payload);

    // Temporariamente desabilitando verificação de assinatura para debug
    console.log('Pulando verificação de assinatura para debug');
    
    /*
    // Verificar a assinatura do webhook (se estiver em produção e se a assinatura for fornecida)
    if (PAGARME_API_KEY?.startsWith('sk_live_') && signature) {
      const webhookSecret = process.env.PAGARME_WEBHOOK_SECRET;
      
      if (webhookSecret) {
        const isValidSignature = verifyWebhookSignature(signature, payload, webhookSecret);
        
        if (!isValidSignature) {
          console.error('Assinatura do webhook inválida');
          return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
        }
      } else {
        console.log('PAGARME_WEBHOOK_SECRET não definido, pulando verificação de assinatura');
      }
    } else {
      console.log('Pulando verificação de assinatura em ambiente de teste ou assinatura não fornecida');
    }
    */

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
    try {
      console.log('Iniciando publicação de evento de pagamento');
      
      // Usar URL absoluta para o fetch interno
      const baseUrl = process.env.NEXTAUTH_URL || 'https://ecclesia-food.vercel.app';
      console.log('URL base para chamada de API interna:', baseUrl);
      
      const internalApiKey = process.env.INTERNAL_API_KEY || 'default-internal-key';
      console.log('Usando chave API interna (primeiros 4 caracteres):', internalApiKey.substring(0, 4) + '...');
      
      const eventsEndpoint = `${baseUrl}/api/payment-events`;
      console.log('Endpoint para envio do evento:', eventsEndpoint);
      
      const eventPayload = {
        transactionId: chargeId,
        orderId: sale.id,
        status: paymentStatus,
      };
      console.log('Payload do evento a ser enviado:', eventPayload);
      
      const response = await fetch(eventsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-key': internalApiKey,
        },
        body: JSON.stringify(eventPayload),
      });

      const responseText = await response.text();
      console.log('Resposta da publicação do evento:', response.status, responseText);

      if (!response.ok) {
        console.error('Erro ao publicar evento:', responseText);
      } else {
        console.log('Evento de pagamento publicado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao publicar evento de pagamento:', error);
      // Continuar o processamento mesmo se falhar a publicação de evento
    }

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