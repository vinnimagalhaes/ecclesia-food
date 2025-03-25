import { NextResponse } from 'next/server';
import { createPixPayment, getTransactionStatus } from '@/lib/pagarme';

export async function POST(request: Request) {
  try {
    console.log('Recebida requisição de pagamento PIX');
    
    const body = await request.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));

    // Validar dados
    if (!body.amount || body.amount <= 0) {
      console.error('Valor inválido:', body.amount);
      return NextResponse.json(
        { error: 'Valor do pagamento inválido' },
        { status: 400 }
      );
    }

    if (!body.customer?.name || !body.customer?.email || !body.customer?.document_number) {
      console.error('Dados do cliente incompletos:', body.customer);
      return NextResponse.json(
        { error: 'Dados do cliente incompletos' },
        { status: 400 }
      );
    }

    if (!body.orderId) {
      console.error('ID do pedido não fornecido');
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    console.log('Dados validados, criando pagamento...');
    
    const payment = await createPixPayment({
      amount: body.amount,
      customer: body.customer,
      orderId: body.orderId,
    });

    console.log('Pagamento criado com sucesso:', JSON.stringify(payment, null, 2));

    return NextResponse.json({ data: payment });
  } catch (error) {
    console.error('Erro detalhado na criação do pagamento:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao criar pagamento' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    console.log('Verificando status do pagamento:', transactionId);

    if (!transactionId) {
      console.error('ID da transação não fornecido');
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      );
    }

    const status = await getTransactionStatus(transactionId);
    console.log('Status do pagamento:', JSON.stringify(status, null, 2));

    return NextResponse.json({ data: status });
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar status' },
      { status: 500 }
    );
  }
} 