import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { withUserAuth } from '@/utils/api-helpers';

// GET: Obter vendas do usuário atual
export async function GET(request: Request) {
  return withUserAuth(request, async (userId) => {
    try {
      // Buscar vendas associadas a eventos do usuário atual
      const vendas = await db.sale.findMany({
        where: {
          event: {
            creatorId: userId
          }
        },
        include: {
          event: {
            select: {
              id: true,
              nome: true
            }
          },
          items: {
            select: {
              id: true,
              nome: true,
              quantidade: true,
              precoUnitario: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return NextResponse.json(vendas);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar vendas' },
        { status: 500 }
      );
    }
  });
}

// POST: Criar uma nova venda
export async function POST(request: Request) {
  return withUserAuth(request, async (userId, req) => {
    try {
      const body = await req.json();
      
      // Verificar se o evento pertence ao usuário atual
      if (body.eventId) {
        const evento = await db.event.findFirst({
          where: {
            id: body.eventId,
            creatorId: userId
          }
        });
        
        if (!evento) {
          return NextResponse.json(
            { error: 'Evento não encontrado ou não pertence a este usuário' },
            { status: 404 }
          );
        }
      }
      
      // Criar a venda associada ao usuário atual
      const venda = await db.sale.create({
        data: {
          cliente: body.cliente,
          email: body.email,
          telefone: body.telefone,
          tipo: body.tipo,
          total: body.total,
          status: body.status || 'PENDENTE',
          formaPagamento: body.formaPagamento,
          origem: body.origem,
          eventId: body.eventId,
          userId: userId,
          items: {
            create: body.itens.map((item: { nome: string; quantidade: number; precoUnitario: number; productId?: string }) => ({
              nome: item.nome,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              total: item.quantidade * item.precoUnitario,
              productId: item.productId
            }))
          }
        },
        include: {
          items: true
        }
      });
      
      return NextResponse.json(venda, { status: 201 });
    } catch (error) {
      console.error('Erro ao criar venda:', error);
      
      // Log mais detalhado para debugging
      if (error instanceof Error) {
        console.error('Detalhes do erro:', error.message);
        console.error('Stack trace:', error.stack);
      }
      
      // Se for um erro do Prisma, mostrar mais detalhes
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('Erro do Prisma:', {
          code: error.code,
          meta: error.meta,
          message: error.message
        });
      }
      
      return NextResponse.json(
        { error: 'Erro ao criar venda', detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
        { status: 500 }
      );
    }
  });
} 