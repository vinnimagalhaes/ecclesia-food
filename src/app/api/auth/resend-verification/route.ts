import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { sendEmail } from '@/lib/email';
import { generateToken } from '@/lib/token';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });
    
    if (!user) {
      // Não revelar que o usuário não existe por questões de segurança
      return NextResponse.json(
        { message: 'Se o email existir, enviamos um link de verificação.' },
        { status: 200 }
      );
    }
    
    // Se o email já foi verificado
    if (user.emailVerified) {
      return NextResponse.json(
        { message: 'Este email já foi verificado. Você pode fazer login normalmente.' },
        { status: 200 }
      );
    }
    
    // Remover tokens antigos
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email
      }
    });
    
    // Gerar novo token
    const verificationToken = generateToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token válido por 24 horas
    
    // Armazenar o token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires
      }
    });
    
    // Enviar email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
    
    await sendEmail({
      to: email,
      subject: 'Verifique seu email - Ecclesia Food',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4f46e5;">Olá, ${user.name || 'Usuário'}!</h1>
          <p>Você solicitou um novo link para verificar seu email no Ecclesia Food.</p>
          <p>Para verificar seu email e ativar sua conta, clique no botão abaixo:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Verificar meu email
            </a>
          </div>
          <p>Ou copie e cole o link abaixo no seu navegador:</p>
          <p>${verificationUrl}</p>
          <p>Este link é válido por 24 horas.</p>
          <p>Se você não solicitou este email, por favor ignore-o.</p>
          <p>Atenciosamente,<br>Equipe Ecclesia Food</p>
        </div>
      `,
    });
    
    return NextResponse.json(
      { message: 'Se o email existir, enviamos um link de verificação.' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erro ao reenviar email de verificação:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 