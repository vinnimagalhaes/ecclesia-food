'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

// Componente para reenviar o email de verificação
function ResendVerificationEmail({ email }: { email: string }) {
  const [isSending, setIsSending] = useState(false);
  
  const handleResend = async () => {
    setIsSending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      toast.success(data.message || 'Email de verificação reenviado com sucesso');
    } catch (error) {
      console.error('Erro ao reenviar email:', error);
      toast.error('Erro ao reenviar email de verificação');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <button
      onClick={handleResend}
      disabled={isSending}
      className="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline"
    >
      {isSending ? 'Enviando...' : 'Reenviar email de verificação'}
    </button>
  );
}

// Componente que usa o searchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!result?.error) {
        router.push(callbackUrl);
        toast.success('Login realizado com sucesso!');
      } else {
        // Verificar se o erro é de email não verificado
        if (result.error.includes('Email não verificado')) {
          setEmailNotVerified(true);
          setUnverifiedEmail(email);
          toast.error('Email não verificado. Por favor, verifique sua caixa de entrada ou solicite um novo email.');
        } else {
          toast.error('Credenciais inválidas');
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Ocorreu um erro durante o login');
      setIsLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            placeholder="Email"
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Senha</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
            placeholder="Senha"
          />
        </div>
      </div>

      {emailNotVerified && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Email não verificado</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  Você precisa verificar seu email antes de fazer login.
                  <br />
                  <ResendVerificationEmail email={unverifiedEmail} />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end">
        <div className="text-sm">
          <Link href="/auth/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
            Esqueceu sua senha?
          </Link>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </form>
  );
}

// Componente de fallback para o Suspense
function LoginFormFallback() {
  return (
    <div className="mt-8 space-y-6">
      <div className="animate-pulse bg-gray-200 h-10 rounded-t-md"></div>
      <div className="animate-pulse bg-gray-200 h-10 rounded-b-md"></div>
      <div className="animate-pulse bg-gray-200 h-10 rounded-md mt-6"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-600">Ecclesia Food</h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Acesse sua conta</h2>
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Ainda não tem uma conta?{' '}
            <Link 
              href="/register" 
              className="font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
            >
              Crie agora
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 