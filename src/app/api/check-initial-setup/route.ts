import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.id) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verificar se o usuário já tem um perfil de igreja
    const churchProfile = await db.church.findUnique({
      where: {
        userId: session.user.id
      }
    });
    
    // Verificar se o usuário já tem configurações
    const userConfig = await db.systemConfig.findFirst({
      where: {
        userId: session.user.id
      }
    });
    
    // Se não tiver perfil de igreja ou configurações, é o primeiro login
    if (!churchProfile || !userConfig) {
      // Redirecionar para a página de onboarding de 3 passos
      return NextResponse.redirect(new URL('/register/onboarding', request.url));
    }
    
    // Se já tiver configuração inicial, redirecionar para o dashboard
    const url = new URL('/dashboard', request.url);
    return NextResponse.redirect(url);
    
  } catch (error) {
    console.error('Erro ao verificar configuração inicial:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 