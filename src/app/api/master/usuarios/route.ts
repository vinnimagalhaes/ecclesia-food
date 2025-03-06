import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

export async function GET(_request: NextRequest) {
  try {
    // Validar a sessão do usuário
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Não autorizado", message: "Você precisa estar logado" },
        { status: 401 }
      );
    }

    // Verificar se o usuário é SUPER_ADMIN
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { 
          error: "Permissão negada", 
          message: "Apenas Super Administradores podem acessar esta lista" 
        },
        { status: 403 }
      );
    }

    // Buscar todos os usuários
    const users = await db.user.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('[MASTER API ERROR]', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 