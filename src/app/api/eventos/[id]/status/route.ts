import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { status } = await request.json();
    
    if (!['ATIVO', 'INATIVO'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      );
    }

    // Verificar se o evento pertence ao usuário
    const evento = await db.event.findFirst({
      where: {
        id: params.id,
        creatorId: session.user.id
      }
    });

    if (!evento) {
      return NextResponse.json(
        { error: 'Evento não encontrado ou não autorizado' },
        { status: 404 }
      );
    }

    // Atualizar o status do evento
    const eventoAtualizado = await db.event.update({
      where: {
        id: params.id
      },
      data: {
        status
      }
    });

    return NextResponse.json(eventoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar status do evento:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do evento' },
      { status: 500 }
    );
  }
} 