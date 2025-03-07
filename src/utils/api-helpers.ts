import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

/**
 * Um assistente para obter a sessão do usuário e aplicar multitenancy
 * nas rotas de API do servidor
 */
export async function withUserAuth(request: Request, handler: (userId: string, req: Request) => Promise<Response>) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Não autorizado', message: 'Você precisa estar logado para acessar este recurso' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id as string;
    
    // Passar o ID do usuário para o manipulador para aplicar filtros de multitenancy
    return handler(userId, request);
  } catch (error) {
    console.error('[API Helper] Erro de autenticação:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Helpers para filtrar queries por usuário
 */
export const multitenancy = {
  /**
   * Cria uma condição de filtro para incluir apenas recursos pertencentes ao usuário atual
   */
  forUser: (userId: string) => {
    return {
      creatorId: userId
    };
  },
  
  /**
   * Aplica filtro de multitenancy em uma query de evento
   */
  events: {
    findMany: (userId: string, options: any = {}) => {
      return db.event.findMany({
        ...options,
        where: {
          ...(options.where || {}),
          creatorId: userId
        }
      });
    },
    
    findUnique: (userId: string, eventId: string, options: any = {}) => {
      return db.event.findFirst({
        ...options,
        where: {
          id: eventId,
          creatorId: userId
        }
      });
    }
  },
  
  /**
   * Aplica filtro de multitenancy em uma query de produto
   */
  products: {
    findMany: (userId: string, options: any = {}) => {
      return db.product.findMany({
        ...options,
        where: {
          ...(options.where || {}),
          creatorId: userId
        }
      });
    },
    
    findUnique: (userId: string, productId: string, options: any = {}) => {
      return db.product.findFirst({
        ...options,
        where: {
          id: productId,
          creatorId: userId
        }
      });
    }
  },
  
  /**
   * Aplica filtro de multitenancy em uma query de venda
   */
  sales: {
    findMany: (userId: string, options: any = {}) => {
      return db.sale.findMany({
        ...options,
        where: {
          ...(options.where || {}),
          event: {
            creatorId: userId
          }
        }
      });
    }
  }
}; 