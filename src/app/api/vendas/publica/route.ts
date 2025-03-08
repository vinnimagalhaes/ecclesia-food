import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

// POST: Criar uma nova venda (rota pública)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar dados básicos
    if (!body.cliente || !body.telefone || !body.formaPagamento || !body.itens || !body.eventId) {
      return NextResponse.json(
        { error: 'Dados incompletos. Verifique os campos obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Verificar se o evento existe
    const evento = await db.event.findUnique({
      where: { id: body.eventId }
    });
    
    if (!evento) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }
    
    // Associar a venda ao criador do evento
    const userId = evento.creatorId;
    
    // Preparar dados da venda
    const dadosVenda: any = {
      cliente: body.cliente,
      email: body.email || '',
      telefone: body.telefone,
      tipo: body.tipo || 'evento',
      total: body.total,
      status: body.status || 'PENDENTE',
      formaPagamento: body.formaPagamento,
      origem: body.origem || 'usuario_final',
      eventId: body.eventId,
      userId: userId, // Usar o ID do criador do evento
      items: {
        create: body.itens.map((item: { nome: string; quantidade: number; precoUnitario: number; productId?: string }) => ({
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
          total: item.quantidade * item.precoUnitario,
          productId: item.productId
        }))
      }
    };
    
    // Adicionar observações se fornecidas
    if (body.observacoes) {
      // Armazenar observações em metadados
      dadosVenda.metadata = {
        observacoes: body.observacoes
      };
    }
    
    // Criar a venda
    const venda = await db.sale.create({
      data: dadosVenda,
      include: {
        items: true
      }
    });
    
    return NextResponse.json(venda, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar venda pública:', error);
    
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
} 