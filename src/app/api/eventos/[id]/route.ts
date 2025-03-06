import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

// Função para obter os detalhes de um evento específico
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/eventos/${params.id} - Iniciando`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    const evento = await db.event.findUnique({
      where: {
        id: params.id
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!evento) {
      console.log('Evento não encontrado');
      return NextResponse.json(
        { message: 'Evento não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Evento encontrado:', evento.id);
    return NextResponse.json(evento);
  } catch (error) {
    console.error('Erro ao obter evento:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Função para atualizar um evento
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/eventos/${params.id} - Iniciando`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar se o evento existe e pertence ao usuário
    const evento = await db.event.findFirst({
      where: {
        id: params.id,
        creatorId: session.user.id
      }
    });
    
    if (!evento) {
      console.log('Evento não encontrado ou não pertence ao usuário');
      return NextResponse.json(
        { message: 'Evento não encontrado ou você não tem permissão' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    console.log('Dados recebidos:', body);
    
    // Atualizar o evento
    const eventoAtualizado = await db.event.update({
      where: {
        id: params.id
      },
      data: {
        nome: body.nome,
        local: body.local,
        data: body.data ? new Date(body.data) : undefined,
        hora: body.hora,
        capacidade: body.capacidade ? parseInt(body.capacidade) : undefined,
        descricao: body.descricao,
        status: body.status
      }
    });
    
    console.log('Evento atualizado:', eventoAtualizado.id);
    return NextResponse.json(eventoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Função para excluir um evento
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/eventos/${params.id} - Iniciando`);
    
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar se o evento existe e pertence ao usuário
    const evento = await db.event.findFirst({
      where: {
        id: params.id,
        creatorId: session.user.id
      }
    });
    
    if (!evento) {
      console.log('Evento não encontrado ou não pertence ao usuário');
      return NextResponse.json(
        { message: 'Evento não encontrado ou você não tem permissão' },
        { status: 403 }
      );
    }
    
    // Excluir o evento
    await db.event.delete({
      where: {
        id: params.id
      }
    });
    
    console.log('Evento excluído:', params.id);
    return NextResponse.json({ message: 'Evento excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 