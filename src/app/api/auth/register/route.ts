import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    console.log('Received registration request:', { name, email });

    if (!name || !email || !password) {
      console.error('Missing fields:', { name: !!name, email: !!email, password: !!password });
      return NextResponse.json({ message: 'Campos obrigatórios faltando' }, { status: 400 });
    }

    // Verificar se o email já existe
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      console.error('Email already exists:', email);
      return NextResponse.json({ message: 'Email já cadastrado' }, { status: 409 });
    }

    const hashedPassword = await hash(password, 10);

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    console.log('User created successfully:', { id: user.id, email: user.email });
    
    // Retornar o usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      message: 'Usuário criado com sucesso', 
      user: userWithoutPassword 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error during user creation:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
} 