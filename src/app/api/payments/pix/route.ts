import { NextResponse } from 'next/server';
import { createPixPayment, getTransactionStatus } from '@/lib/pagarme';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Dados recebidos:', body);

    // Validar dados
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Valor do pagamento inválido' },
        { status: 400 }
      );
    }

    if (!body.customer?.name || !body.customer?.email || !body.customer?.document_number) {
      return NextResponse.json(
        { error: 'Dados do cliente incompletos' },
        { status: 400 }
      );
    }

    if (!body.orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    // Criar pagamento na Pagar.me
    const paymentData = await createPixPayment({
      amount: body.amount,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        document_number: body.customer.document_number,
        phone: body.customer.phone,
      },
      orderId: body.orderId,
      items: body.items || [{
        name: 'Pedido',
        amount: body.amount,
        quantity: 1,
      }],
    });

    console.log('Resposta da Pagar.me:', paymentData);

    // Verificar se temos o QR code
    if (!paymentData.qr_code) {
      console.error('QR code não encontrado na resposta:', paymentData);
      return NextResponse.json(
        { 
          error: 'QR code não encontrado na resposta',
          details: paymentData
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: paymentData.id,
      qr_code: paymentData.qr_code,
      qr_code_url: paymentData.qr_code_url,
      expires_at: paymentData.expires_at,
      status: paymentData.status,
      charge_id: paymentData.charges?.[0]?.id,
      transaction_id: paymentData.charges?.[0]?.last_transaction?.id,
    });
  } catch (error) {
    console.error('Erro ao processar pagamento:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao processar pagamento',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      );
    }

    console.log('Verificando status da transação:', transactionId);
    const status = await getTransactionStatus(transactionId);
    console.log('Status da transação:', status);

    return NextResponse.json({
      status: status.status,
      paid: status.status === 'paid',
    });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar status' },
      { status: 500 }
    );
  }
} 