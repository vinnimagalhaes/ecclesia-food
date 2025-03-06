import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`GET /api/catalogo/eventos/${params.id}/produtos - Iniciando`);
  
  try {
    // Verificar se o evento existe e está ativo
    const evento = await db.event.findUnique({
      where: {
        id: params.id,
        status: 'ATIVO'
      }
    });
    
    if (!evento) {
      console.log(`Evento não encontrado ou não está ativo: ${params.id}`);
      return NextResponse.json(
        { error: 'Evento não encontrado ou não está disponível' },
        { status: 404 }
      );
    }
    
    // Buscar produtos do evento
    const produtos = await db.product.findMany({
      where: {
        eventId: params.id,
        disponivel: true,
        event: {
          status: 'ATIVO'
        }
      },
      select: {
        id: true,
        nome: true,
        preco: true,
        descricao: true,
        categoria: true,
        disponivel: true,
        images: {
          select: {
            url: true,
            alt: true,
            principal: true
          }
        }
      }
    });
    
    console.log(`${produtos.length} produtos encontrados para o evento ${params.id}`);
    
    return NextResponse.json(produtos);
  } catch (error) {
    console.error(`Erro ao buscar produtos do evento ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erro ao buscar produtos' },
      { status: 500 }
    );
  }
} 