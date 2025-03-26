import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * GET - Busca o perfil da igreja do usuário logado
 */
export async function GET(req: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar perfil da igreja para o usuário
    const church = await prisma.church.findUnique({
      where: { userId: session.user.id },
    });

    if (!church) {
      return NextResponse.json(
        { error: 'Perfil de igreja não encontrado para este usuário' },
        { status: 404 }
      );
    }

    return NextResponse.json({ church });
  } catch (error) {
    console.error('Erro ao buscar perfil da igreja:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil da igreja' },
      { status: 500 }
    );
  }
} 