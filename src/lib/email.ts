import { Resend } from 'resend';

// Usar uma chave de API falsa durante o build
const apiKey = process.env.RESEND_API_KEY || 're_dummy_key_for_build';

const resend = new Resend(apiKey);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    // Se estiver usando a chave de API falsa, apenas logar e retornar
    if (apiKey === 're_dummy_key_for_build') {
      console.log('Email não enviado - usando chave de API falsa para build');
      return;
    }

    await resend.emails.send({
      from: 'Ecclesia Food <noreply@ecclesiafood.com.br>',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error('Erro ao enviar email');
  }
} 