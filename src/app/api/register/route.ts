import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { generateToken } from '@/lib/token';

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
    
    // Gerar token de verificação
    const verificationToken = generateToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token válido por 24 horas
    
    // Armazenar o token na tabela VerificationToken
    await db.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires
      }
    });

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    console.log('User created successfully:', { id: user.id, email: user.email });
    
    // Enviar email de verificação
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verifique seu email - Ecclesia Food',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Olá, ${name}!</h1>
          <p>Obrigado por se cadastrar no Ecclesia Food.</p>
          <p>Para verificar seu email e ativar sua conta, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verificar meu email
            </a>
          </div>
          <p>Ou copie e cole o link abaixo no seu navegador:</p>
          <p>${verificationUrl}</p>
          <p>Este link é válido por 24 horas.</p>
          <p>Se você não criou esta conta, por favor ignore este email.</p>
          <p>Atenciosamente,<br>Equipe Ecclesia Food</p>
        </div>
      `,
    });
    
    // Retornar o usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({ 
      message: 'Usuário criado com sucesso. Verifique seu email para ativar sua conta.', 
      user: userWithoutPassword 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error during user creation:', error);
    return NextResponse.json({ message: 'Erro interno do servidor' }, { status: 500 });
  }
} 