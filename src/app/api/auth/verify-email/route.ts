import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { message: 'Token não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar o token de verificação
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token
      }
    });
    
    if (!verificationToken) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }
    
    // Verificar se o token não expirou
    if (new Date() > verificationToken.expires) {
      return NextResponse.json(
        { message: 'Token expirado. Solicite um novo email de verificação.' },
        { status: 400 }
      );
    }
    
    // Atualizar o usuário como verificado
    const user = await prisma.user.findUnique({
      where: {
        email: verificationToken.identifier
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Definir a data de verificação do email
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        emailVerified: new Date()
      }
    });
    
    // Remover o token usado
    await prisma.verificationToken.delete({
      where: {
        token
      }
    });
    
    return NextResponse.json(
      { message: 'Email verificado com sucesso! Agora você pode fazer login.' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro ao verificar email:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 