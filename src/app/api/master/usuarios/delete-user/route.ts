import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';
import { compare } from 'bcrypt';

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
          message: "Apenas Super Administradores podem excluir usuários" 
        },
        { status: 403 }
      );
    }

    // Obter dados do corpo da requisição
    const body = await request.json();
    const { userId, adminPassword } = body;

    if (!userId || !adminPassword) {
      return NextResponse.json(
        { error: "ID do usuário e senha do administrador são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar a senha do SUPER_ADMIN
    const adminUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { password: true }
    });

    if (!adminUser || !adminUser.password) {
      return NextResponse.json(
        { error: "Administrador não encontrado ou sem senha definida" },
        { status: 401 }
      );
    }

    // Validar a senha
    const isPasswordValid = await compare(adminPassword, adminUser.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Buscar o usuário a ser excluído para verificar se não é um SUPER_ADMIN
    const userToDelete = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, email: true }
    });

    if (!userToDelete) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Impedir a exclusão de contas SUPER_ADMIN
    if (userToDelete.role === 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Não é possível excluir um Super Administrador" },
        { status: 403 }
      );
    }

    // Excluir o usuário
    await db.user.delete({
      where: { id: userId }
    });

    // Adicionar log de atividade
    console.log(`[MASTER] Usuário ${session.user.email} excluiu a conta do usuário ${userToDelete.email}`);

    return NextResponse.json({
      message: `Usuário excluído com sucesso`,
    });
  } catch (error) {
    console.error('[MASTER API ERROR]', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
} 