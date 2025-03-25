import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Força esta rota a ser sempre dinâmica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário com token válido
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Atualizar senha e limpar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return NextResponse.json(
      { message: 'Senha redefinida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { message: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
} 