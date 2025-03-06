'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { UserProvider } from '@/contexts/UserContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Adicionar listener para depuração em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Verificar se há token no localStorage (usado pelo NextAuth)
      const hasSession = typeof window !== 'undefined' && 
        window.localStorage && 
        Object.keys(window.localStorage).some(key => key.startsWith('nextauth.'));
      
      console.log('[AuthProvider] Sessão detectada no localStorage:', hasSession);
      
      // Listener para erros de rede
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        try {
          const response = await originalFetch(...args);
          
          // Verificar erros de autenticação em chamadas de API
          if (args[0] && typeof args[0] === 'string' && args[0].includes('/api/') && !response.ok) {
            if (response.status === 401) {
              console.warn('[AuthProvider] Erro de autenticação detectado:', args[0]);
            } else if (response.status >= 500) {
              console.error('[AuthProvider] Erro de servidor detectado:', args[0], response.status);
            }
          }
          
          return response;
        } catch (error) {
          console.error('[AuthProvider] Erro na requisição fetch:', error);
          throw error;
        }
      };
      
      return () => {
        // Restaurar fetch original ao desmontar
        window.fetch = originalFetch;
      };
    }
  }, []);

  return (
    <SessionProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </SessionProvider>
  );
} 