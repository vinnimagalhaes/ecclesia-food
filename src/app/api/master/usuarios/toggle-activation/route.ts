import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
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
          message: "Apenas Super Administradores podem alterar o status de usuários" 
        },
        { status: 403 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório" },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: "Status deve ser um valor booleano" },
        { status: 400 }
      );
    }

    // Buscar o usuário para verificar se não é um SUPER_ADMIN
    const targetUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Impedir a desativação de contas SUPER_ADMIN
    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Não é possível alterar o status de um Super Administrador" },
        { status: 403 }
      );
    }

    // Atualizar o status do usuário
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, email: true, isActive: true }
    });

    // Adicionar log de atividade
    console.log(`[MASTER] Usuário ${session.user.email} ${isActive ? 'ativou' : 'desativou'} a conta do usuário ${updatedUser.email}`);

    return NextResponse.json({
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
      user: updatedUser
    });
  } catch (error) {
    console.error('[MASTER API ERROR]', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 