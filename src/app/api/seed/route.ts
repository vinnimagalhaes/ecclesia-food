import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('123', 10);

    const user = await prisma.user.upsert({
      where: {
        email: 'vinicius@gmail.com',
      },
      update: {
        password: hashedPassword,
      },
      create: {
        email: 'vinicius@gmail.com',
        name: 'Vinicius',
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    return NextResponse.json({ 
      message: 'Usuário inicial criado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao criar usuário inicial' },
      { status: 500 }
    );
  }
} 