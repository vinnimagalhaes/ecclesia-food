import { NextResponse } from 'next/server';
import { createPixPayment, getTransactionStatus } from '@/lib/pagarme';

export async function POST(request: Request) {
  try {
    console.log('API Payments/PIX: Iniciando processamento POST');
    
    const body = await request.json();
    const { amount, customer, orderId } = body;

    console.log('Recebendo requisição de pagamento PIX:', {
      amount,
      customer,
      orderId,
    });

    if (!amount || !customer || !orderId) {
      console.log('API Payments/PIX: Erro - Dados incompletos');
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      );
    }

    console.log('API Payments/PIX: Chamando createPixPayment...');
    const payment = await createPixPayment({
      amount,
      customer,
      orderId,
    });
    console.log('API Payments/PIX: Resposta do createPixPayment recebida');

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao processar pagamento PIX:', error);
    
    // Formatar erro para log mais detalhado
    const errorDetail = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : { error };
    
    console.log('API Payments/PIX: Detalhes completos do erro:', JSON.stringify(errorDetail));
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    console.log('API Payments/PIX: Iniciando processamento GET');
    
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    console.log('API Payments/PIX: Verificando status da transação:', transactionId);

    if (!transactionId) {
      console.log('API Payments/PIX: Erro - ID da transação não fornecido');
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      );
    }

    console.log('API Payments/PIX: Chamando getTransactionStatus...');
    const status = await getTransactionStatus(transactionId);
    console.log('API Payments/PIX: Resposta do getTransactionStatus recebida');

    return NextResponse.json(status);
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    
    // Formatar erro para log mais detalhado
    const errorDetail = error instanceof Error 
      ? { message: error.message, stack: error.stack } 
      : { error };
    
    console.log('API Payments/PIX: Detalhes completos do erro:', JSON.stringify(errorDetail));
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao verificar status do pagamento' },
      { status: 500 }
    );
  }
} 