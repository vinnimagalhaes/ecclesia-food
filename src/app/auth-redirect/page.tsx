'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthRedirectPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<string | null>(null);
  
  useEffect(() => {
    console.log('Página de redirecionamento manual carregada');
    
    const checkAuthAndRedirect = async () => {
      try {
        // Tentar obter token do cookie via uma API própria
        const response = await fetch('/api/auth/check-token');
        const data = await response.json();
        
        if (data.authenticated) {
          // Token JWT foi verificado com sucesso pelo servidor
          console.log('Token autenticado com sucesso');
          
          if (data.user) {
            setUserInfo(`Autenticado como ${data.user.email || 'usuário admin'}`);
          }
          
          // Redirecionar para dashboard
          setTimeout(() => {
            router.push('/admin/dashboard');
          }, 1000);
          return;
        }
        
        // Verificar localStorage como fallback
        const userData = localStorage.getItem('userData');
        if (userData) {
          // Ativar acesso de emergência
          localStorage.setItem('emergencyAccess', 'true');
          console.log('Acesso de emergência ativado via localStorage');
          setUserInfo('Usando credenciais de emergência via localStorage');
          
          // Redirecionando para dashboard com parâmetro de emergência
          setTimeout(() => {
            router.push('/admin/dashboard?emergency_access=true');
          }, 1000);
          return;
        }
        
        // Se não há autenticação disponível, mostrar erro
        setError('Nenhuma informação de autenticação encontrada');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (e) {
        console.error('Erro ao configurar redirecionamento:', e);
        setError('Erro ao processar autenticação. Redirecionando para login...');
        
        // Fallback para redirecionamento direto em caso de erro
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
      }
    };
    
    checkAuthAndRedirect();
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <div className="flex justify-center">
            <h1 className="text-3xl font-bold text-primary-600">Ecclesia Food</h1>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-primary-600">Redirecionando...</h2>
          
          {error ? (
            <div className="mt-4 text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <p className="mt-4 text-lg text-gray-600">
                {userInfo || 'Verificando autenticação...'}
              </p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            </>
          )}
          
          <p className="mt-4 text-sm text-gray-500">
            Se o redirecionamento não ocorrer automaticamente, 
            <button 
              onClick={() => window.location.href = '/admin/dashboard?emergency_access=true'} 
              className="ml-1 text-primary-600 hover:underline focus:outline-none"
            >
              clique aqui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 