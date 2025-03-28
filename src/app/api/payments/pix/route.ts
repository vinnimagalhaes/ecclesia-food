import { NextResponse } from 'next/server';
import { createPixPayment, getTransactionStatus } from '@/lib/pagarme';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    console.log('Iniciando processamento de pagamento PIX...');
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));

    // Validar dados do pedido
    if (!body.orderId) {
      console.error('ID do pedido não fornecido');
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    // Buscar pedido no banco
    const order = await prisma.sale.findUnique({
      where: { id: body.orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      console.error('Pedido não encontrado:', body.orderId);
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    console.log('Pedido encontrado:', JSON.stringify(order, null, 2));

    // Validar dados do cliente
    if (!body.customer?.name || !body.customer?.email || !body.customer?.document || !body.customer?.phone) {
      console.error('Dados do cliente incompletos:', body.customer);
      return NextResponse.json(
        { error: 'Dados do cliente incompletos' },
        { status: 400 }
      );
    }

    // Validar telefone
    const phone = body.customer.phone.replace(/\D/g, '');
    if (phone.length < 10) {
      console.error('Telefone inválido:', phone);
      return NextResponse.json(
        { error: 'Telefone do cliente inválido' },
        { status: 400 }
      );
    }

    // Validar documento
    const document = body.customer.document.replace(/\D/g, '');
    if (document.length !== 11) {
      console.error('Documento inválido:', document);
      return NextResponse.json(
        { error: 'Documento do cliente inválido' },
        { status: 400 }
      );
    }

    // Validar valor
    if (!order.total || order.total <= 0) {
      console.error('Valor do pedido inválido:', order.total);
      return NextResponse.json(
        { error: 'Valor do pedido inválido' },
        { status: 400 }
      );
    }

    // Validar itens
    if (!order.items || order.items.length === 0) {
      console.error('Pedido sem itens');
      return NextResponse.json(
        { error: 'Pedido sem itens' },
        { status: 400 }
      );
    }

    // Criar pagamento PIX
    console.log('Iniciando criação de pagamento PIX com os dados:', {
      amount: order.total,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        document_number: document,
        phone: phone,
      },
      orderId: order.id,
      items: order.items.map(item => ({
        name: item.nome,
        amount: item.precoUnitario,
        quantity: item.quantidade,
      })),
    });

    const payment = await createPixPayment({
      amount: order.total,
      customer: {
        name: body.customer.name,
        email: body.customer.email,
        document_number: document,
        phone: phone,
      },
      orderId: order.id,
      items: order.items.map(item => ({
        name: item.nome,
        amount: item.precoUnitario,
        quantity: item.quantidade,
      })),
    });

    console.log('Pagamento PIX criado com sucesso:', JSON.stringify(payment, null, 2));

    // Atualizar pedido com o ID do pagamento
    await prisma.sale.update({
      where: { id: order.id },
      data: {
        metadata: {
          paymentId: payment.id,
          paymentStatus: 'PENDING',
          paymentMethod: 'PIX',
          paymentDetails: {
            qrCode: payment.qr_code,
            qrCodeUrl: payment.qr_code_url,
            expiresAt: payment.expires_at,
          },
        },
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Erro ao processar pagamento PIX:', error);
    
    // Extrair mensagem de erro mais específica
    let errorMessage = 'Erro ao processar pagamento PIX';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
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