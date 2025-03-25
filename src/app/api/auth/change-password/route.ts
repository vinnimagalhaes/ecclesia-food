import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Senha atual e nova senha são obrigatórias' },
        { status: 400 }
      );
    }
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!user || !user.password) {
      return NextResponse.json(
        { message: 'Usuário não encontrado ou senha não definida' },
        { status: 404 }
      );
    }
    
    // Verificar se a senha atual está correta
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Senha atual incorreta' },
        { status: 400 }
      );
    }
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar senha
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    return NextResponse.json(
      { message: 'Senha alterada com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { message: 'Erro ao alterar senha' },
      { status: 500 }
    );
  }
} 