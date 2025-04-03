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
    if (!body.customer) {
      console.error('Dados do cliente não fornecidos');
      return NextResponse.json(
        { error: 'Dados do cliente não fornecidos' },
        { status: 400 }
      );
    }

    console.log('Dados do cliente recebidos:', JSON.stringify(body.customer, null, 2));

    // Validar campos obrigatórios
    const requiredFields = ['name', 'email', 'phone'];
    const missingFields = requiredFields.filter(field => !body.customer[field]);
    
    if (missingFields.length > 0) {
      console.error('Campos obrigatórios faltando:', missingFields);
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validar documento (aceita tanto 'document' quanto 'documento')
    const document = body.customer.document || body.customer.documento;
    console.log('Documento recebido:', document);

    if (!document) {
      console.error('Documento não fornecido');
      return NextResponse.json(
        { error: 'Documento do cliente não fornecido' },
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
    const formattedDocument = document.replace(/\D/g, '');
    if (formattedDocument.length !== 11) {
      console.error('Documento inválido:', formattedDocument);
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
        document_number: formattedDocument,
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
        document_number: formattedDocument,
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
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID da transação não fornecido' },
        { status: 400 }
      );
    }

    const status = await getTransactionStatus(transactionId);
    return NextResponse.json(status);
  } catch (error) {
    console.error('Erro ao verificar status do pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status do pagamento' },
      { status: 500 }
    );
  }
} 