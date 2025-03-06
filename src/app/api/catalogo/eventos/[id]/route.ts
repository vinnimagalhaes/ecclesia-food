import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log(`GET /api/catalogo/eventos/${params.id} - Iniciando busca`);
  
  try {
    // Primeiro, buscar o evento sem restrições para debug
    const eventoDebug = await db.event.findUnique({
      where: {
        id: params.id
      },
      include: {
        creator: {
          select: {
            name: true,
            image: true,
            id: true
          }
        }
      }
    });

    console.log('Resultado debug:', {
      encontrado: !!eventoDebug,
      id: eventoDebug?.id,
      nome: eventoDebug?.nome,
      status: eventoDebug?.status
    });

    // Agora buscar com as restrições normais
    const evento = await db.event.findUnique({
      where: {
        id: params.id,
        status: 'ATIVO'
      },
      include: {
        creator: {
          select: {
            name: true,
            image: true,
            id: true
          }
        }
      }
    });
    
    console.log('Evento com restrições:', {
      encontrado: !!evento,
      id: evento?.id,
      nome: evento?.nome,
      status: evento?.status
    });
    
    if (!evento) {
      const motivo = !eventoDebug ? 'Evento não existe' : 'Evento não está ativo';
      console.log(`Evento não disponível: ${motivo}`);
      return NextResponse.json(
        { error: motivo },
        { status: 404 }
      );
    }
    
    // Formatar a resposta para incluir apenas os campos necessários
    const eventoFormatado = {
      id: evento.id,
      nome: evento.nome,
      local: evento.local,
      data: evento.data,
      hora: evento.hora || new Date(evento.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      capacidade: evento.capacidade || 0,
      descricao: evento.descricao || '',
      status: evento.status,
      creator: {
        name: evento.creator.name || '',
        image: evento.creator.image || null,
        id: evento.creator.id
      }
    };
    
    console.log('Evento formatado e disponível:', eventoFormatado);
    
    return NextResponse.json(eventoFormatado);
  } catch (error) {
    console.error('Erro detalhado ao buscar evento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar evento', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 