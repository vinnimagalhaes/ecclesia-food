import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter o token da sessão atual
    const currentSession = await prisma.session.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        expires: 'desc',
      },
    });
    
    if (!currentSession) {
      return NextResponse.json(
        { message: 'Sessão atual não encontrada' },
        { status: 404 }
      );
    }
    
    // Excluir todas as outras sessões do usuário
    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        AND: {
          NOT: {
            id: currentSession.id,
          },
        },
      },
    });
    
    return NextResponse.json(
      { message: 'Todas as outras sessões foram encerradas' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao encerrar sessões:', error);
    return NextResponse.json(
      { message: 'Erro ao encerrar sessões' },
      { status: 500 }
    );
  }
} 