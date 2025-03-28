import { NextResponse } from 'next/server';
import { createPixPayment, getTransactionStatus } from '@/lib/pagarme';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Dados recebidos para pagamento PIX:', JSON.stringify(body, null, 2));

    // Validar dados
    if (!body.amount || body.amount <= 0) {
      console.error('Valor do pagamento inválido:', body.amount);
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

    // Validar telefone antes de enviar
    if (!body.customer?.phone) {
      console.error('Telefone do cliente não fornecido');
      return NextResponse.json(
        { error: 'Telefone do cliente não fornecido. Este campo é obrigatório para criar um pagamento PIX.' },
        { status: 400 }
      );
    }

    // Garantir que o telefone esteja no formato correto
    const telefone = body.customer.phone.replace(/\D/g, '');
    if (telefone.length < 10) {
      console.error('Telefone do cliente inválido:', telefone);
      return NextResponse.json(
        { error: 'Telefone do cliente inválido. O número deve ter pelo menos 10 dígitos.' },
        { status: 400 }
      );
    }

    // Garantir que document_number contém apenas números
    const documento = body.customer.document_number.replace(/\D/g, '');
    if (documento.length !== 11 && documento.length !== 14) {
      console.error('Documento do cliente inválido:', documento);
      return NextResponse.json(
        { error: 'Documento do cliente inválido. CPF deve ter 11 dígitos e CNPJ 14 dígitos.' },
        { status: 400 }
      );
    }

    // Verificar se items existe, se não, criar um item padrão
    const items = body.items || [{
      name: 'Pedido',
      amount: body.amount,
      quantity: 1,
    }];

    console.log('Dados validados com sucesso, enviando para Pagar.me');

    try {
      // Criar pagamento na Pagar.me
      const paymentData = await createPixPayment({
        amount: body.amount,
        customer: {
          name: body.customer.name,
          email: body.customer.email,
          document_number: documento,
          phone: telefone,
        },
        orderId: body.orderId,
        items: items,
        expiresIn: body.expiresIn || 3600, // 1 hora por padrão
      });

      console.log('Resposta da Pagar.me obtida com sucesso:', paymentData);

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
    } catch (paymentError) {
      // Tratamento específico para erros da Pagar.me
      console.error('Erro específico ao criar pagamento na Pagar.me:', paymentError);
      
      // Verificar se é um erro da API com detalhes
      const errorMessage = paymentError instanceof Error ? paymentError.message : 'Erro desconhecido ao processar pagamento';
      
      // Extrair detalhes do erro se disponíveis
      let errorDetails = {};
      try {
        if (errorMessage.includes('{')) {
          const errorJson = errorMessage.substring(errorMessage.indexOf('{'));
          errorDetails = JSON.parse(errorJson);
        }
      } catch (e) {
        // Ignorar erro de parse
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails
        },
        { status: 422 }
      );
    }
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