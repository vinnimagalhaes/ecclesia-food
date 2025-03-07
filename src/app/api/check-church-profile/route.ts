import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Obter URL de retorno
    const url = new URL(request.url);
    const callbackUrl = url.searchParams.get('callbackUrl') || '/';
    
    console.log(`[check-church-profile] Verificando perfil da igreja, callback: ${callbackUrl}`);
    
    // Obter sessão do usuário
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('[check-church-profile] Usuário não autenticado');
      // Redirecionar para login
      const loginUrl = new URL('/login', url.origin);
      loginUrl.searchParams.set('callbackUrl', callbackUrl);
      return NextResponse.redirect(loginUrl);
    }
    
    const userId = session.user.id;
    console.log(`[check-church-profile] Verificando perfil para usuário: ${userId}`);
    
    // Verificar se o usuário tem um perfil de igreja
    const church = await db.church.findUnique({
      where: { userId }
    });
    
    console.log('[check-church-profile] Resultado da verificação:', !!church);
    
    // Criar resposta
    const response = NextResponse.redirect(
      church ? new URL(callbackUrl, url.origin) : new URL('/onboarding', url.origin)
    );
    
    // Definir cookie com estado do perfil
    // Tempo de expiração: 1 hora
    response.cookies.set({
      name: 'has_church_profile',
      value: church ? 'true' : 'false',
      maxAge: 60 * 60, // 1 hora
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return response;
  } catch (error) {
    console.error('[check-church-profile] Erro ao verificar perfil:', error);
    
    // Em caso de erro, redirecionar para a página principal
    return NextResponse.redirect(new URL('/', new URL(request.url).origin));
  }
} 