'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

// Componente que usa useSearchParams
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu email...');
  
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificação não fornecido');
      return;
    }
    
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verificado com sucesso!');
          toast.success('Email verificado com sucesso!');
          
          // Redirecionar para página de login com callback para o onboarding de 3 passos
          setTimeout(() => {
            router.push('/login?callbackUrl=/register/onboarding');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Erro ao verificar email');
          toast.error(data.message || 'Erro ao verificar email');
        }
      } catch (error) {
        console.error('Erro na verificação de email:', error);
        setStatus('error');
        setMessage('Ocorreu um erro durante a verificação');
        toast.error('Ocorreu um erro durante a verificação');
      }
    };
    
    verifyEmail();
  }, [token, router]);
  
  return (
    <div>
      {status === 'loading' && (
        <div className="mt-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{message}</p>
        </div>
      )}
      
      {status === 'success' && (
        <div className="mt-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mt-4 text-lg text-gray-600">{message}</p>
          <p className="mt-2 text-sm text-gray-500">Você será redirecionado para a página de login em alguns segundos. Após o login, você concluirá a configuração da sua conta.</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="mt-6">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="mt-4 text-lg text-gray-600">{message}</p>
          <div className="mt-6">
            <Link 
              href="/auth/login" 
              className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
            >
              Voltar para login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// Loading fallback para o Suspense
function LoadingFallback() {
  return (
    <div className="mt-6">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
      <p className="mt-4 text-lg text-gray-600">Carregando...</p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md text-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-600">Ecclesia Food</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Verificação de Email</h2>
        </div>
        
        <Suspense fallback={<LoadingFallback />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
} 