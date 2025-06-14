import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';
// Removendo a importação do db, pois não funciona no Edge Runtime
// import { db } from '@/lib/db';

export async function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl.pathname;
    console.log(`[Middleware] Iniciando verificação para: ${pathname}`);
    
    // Verificar se estamos na rota raiz
    if (pathname === '/') {
      console.log('[Middleware] Rota raiz - acesso público permitido');
      return NextResponse.next();
    }
    
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log(`[Middleware] Token:`, {
      hasToken: !!token,
      tokenRole: token?.role,
      tokenIsActive: token?.isActive,
      tokenEmailVerified: token?.emailVerified,
      pathname
    });

    // Lista de rotas protegidas (administrativas)
    const protectedPaths = [
      '/eventos/novo',
      '/eventos/editar',
      '/rifas/novo',
      '/vendas/novo',
      '/relatorios',
      '/configuracoes',
      '/dashboard'
    ];

    // Lista de rotas protegidas apenas para SUPER_ADMIN
    const superAdminPaths = [
      '/master',
      '/master/usuarios'
    ];

    // Lista de rotas públicas (para usuários finais)
    const publicPaths = [
      '/',
      '/catalogo',
      '/catalogo/eventos',
      '/catalogo/produtos',
      '/catalogo/rifas',
      '/catalogo/igrejas',
      '/carrinho',
      '/checkout',
      '/checkout/sucesso'
    ];

    // Lista de APIs públicas
    const publicApiPaths = [
      '/api/auth',
      '/api/catalogo',
      '/api/igrejas',
      '/api/register',
      '/api/church',
      '/api/vendas/publica',
      '/api/configuracoes',
      '/api/pix',
      '/api/webhooks',
      '/api/payment-events',
      '/api/payments',
      '/api/pedidos/buscar',
      '/api/pedidos/imprimir'
    ];

    // Lista de rotas que não precisam de verificação de perfil de igreja
    const bypassChurchCheck = [
      '/onboarding',
      '/register/onboarding',
      '/login',
      '/register',
      '/api/auth',
      '/api/church',
      '/api/register',
      '/api/check-church-profile',
      '/api/master'
    ];

    // Verifica se a rota atual está na lista de rotas protegidas
    const isProtectedPath = protectedPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    // Verifica se é uma rota protegida para SUPER_ADMIN
    const isSuperAdminPath = superAdminPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    // Verifica se é uma rota pública
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    // Verifica se é uma API pública
    const isPublicApi = publicApiPaths.some(path =>
      pathname.startsWith(path)
    );

    // Verifica se é uma rota que não precisa de verificação de perfil
    const isBypassPath = bypassChurchCheck.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    );

    // Se for uma rota pública ou API pública, permite o acesso
    if (isPublicPath || isPublicApi) {
      console.log('[Middleware] Rota pública - acesso permitido');
      return NextResponse.next();
    }

    // Verifica se é uma rota de API protegida (todas as APIs que não são públicas)
    const isProtectedApi = pathname.startsWith('/api/') && !isPublicApi;
      
    console.log(`[Middleware] Análise da rota:`, {
      pathname,
      isProtectedPath,
      isSuperAdminPath,
      isPublicPath,
      isPublicApi,
      isBypassPath,
      isProtectedApi,
      hasToken: !!token
    });

    // Verifica se é uma rota protegida ou API protegida e não tiver token, bloqueia o acesso
    if ((isProtectedPath || isProtectedApi || isSuperAdminPath) && !token) {
      console.log('[Middleware] Acesso negado - redirecionando para login');
      
      if (isProtectedApi) {
        return new NextResponse(
          JSON.stringify({ error: 'Não autorizado', message: 'Você precisa estar logado para acessar este recurso' }),
          { 
            status: 401,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Verificar se o usuário é CLIENT e tenta acessar rotas administrativas
    if (token?.role === 'USER' as UserRole && (isProtectedPath || isSuperAdminPath)) {
      console.log('[Middleware] Usuário comum tentando acessar área administrativa - redirecionando');
      return NextResponse.redirect(new URL('/catalogo', request.url));
    }

    // Verificar se o usuário tem acesso à rota SUPER_ADMIN
    if (isSuperAdminPath && token?.role !== 'SUPER_ADMIN') {
      console.log('[Middleware] Acesso negado - usuário não é SUPER_ADMIN');
      
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Não autorizado', message: 'Você não tem permissão para acessar este recurso' }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Verificar se o usuário está ativo
    if (token && token.isActive === false) {
      console.log('[Middleware] Acesso negado - usuário inativo');
      
      // Se for uma rota de API, retorna erro 403
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ error: 'Conta desativada', message: 'Sua conta foi desativada pelo administrador' }),
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
      }

      // Limpar sessão e redirecionar para página de conta desativada
      const response = NextResponse.redirect(new URL('/conta-desativada', request.url));
      response.cookies.delete('next-auth.session-token');
      return response;
    }

    // Se o usuário está autenticado e NÃO está em uma rota bypass
    if (token?.sub && !isBypassPath) {
      console.log('[Middleware] Verificando perfil da igreja para o usuário:', token.sub);
      
      // Apenas verificar o perfil da igreja se o usuário for administrador
      if (token.role === 'ADMIN' || token.role === 'SUPER_ADMIN') {
        const hasChurchProfile = request.cookies.get('has_church_profile')?.value === 'true';
        
        if (!hasChurchProfile) {
          console.log('[Middleware] Status do perfil da igreja desconhecido - verificando');
          
          if (pathname === '/onboarding') {
            return NextResponse.next();
          }
          
          const url = new URL('/api/check-church-profile', request.url);
          url.searchParams.set('callbackUrl', pathname);
          return NextResponse.redirect(url);
        }
      }
    }

    console.log('[Middleware] Acesso permitido');
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Erro:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/',
    '/eventos/:path*',
    '/rifas/:path*',
    '/vendas/:path*',
    '/relatorios/:path*',
    '/configuracoes/:path*',
    '/dashboard/:path*',
    '/catalogo/:path*',
    '/carrinho/:path*',
    '/checkout/:path*',
    '/api/:path*',
    '/onboarding',
    '/register/onboarding',
    '/master/:path*',
    '/conta-desativada'
  ]
}; 