import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

// Força esta rota a ser sempre dinâmica
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email, role: 'ADMIN' }
    });

    if (!user) {
      // Por segurança, não informamos se o email existe ou não
      return NextResponse.json(
        { message: 'Se o email existir, você receberá um link de recuperação' },
        { status: 200 }
      );
    }

    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Salvar token no banco
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Gerar URL de reset
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

    // Enviar email
    await sendEmail({
      to: email,
      subject: 'Recuperação de senha',
      html: `
        <h1>Recuperação de senha</h1>
        <p>Você solicitou a recuperação de senha. Clique no link abaixo para definir uma nova senha:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>Este link expira em 1 hora.</p>
        <p>Se você não solicitou esta recuperação, ignore este email.</p>
      `,
    });

    return NextResponse.json(
      { message: 'Se o email existir, você receberá um link de recuperação' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar recuperação de senha:', error);
    return NextResponse.json(
      { message: 'Erro ao processar recuperação de senha' },
      { status: 500 }
    );
  }
} 