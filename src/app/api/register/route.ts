import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return new NextResponse('Usuário já existe', { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('[REGISTER_POST]', error);
    return new NextResponse('Erro interno', { status: 500 });
  }
} 