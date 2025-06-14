import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigo = searchParams.get('codigo');

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código do pedido é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar venda pelo ID
    const sale = await db.sale.findUnique({
      where: {
        id: codigo
      },
      include: {
        items: {
          select: {
            id: true,
            nome: true,
            quantidade: true,
            precoUnitario: true,
            total: true,
          }
        },
        event: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Formatar dados para retorno
    const pedido = {
      id: sale.id,
      cliente: sale.cliente,
      email: sale.email,
      telefone: sale.telefone,
      total: sale.total,
      status: sale.status,
      formaPagamento: sale.formaPagamento,
      createdAt: sale.createdAt.toISOString(),
      items: sale.items.map(item => ({
        id: item.id,
        nome: item.nome,
        quantidade: item.quantidade,
        precoUnitario: item.precoUnitario,
        total: item.total || (item.quantidade * item.precoUnitario),
      })),
      event: sale.event,
    };

    return NextResponse.json(pedido);
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 