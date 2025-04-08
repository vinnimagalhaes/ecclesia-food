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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const callbackUrl = searchParams.get('callbackUrl') || '/catalogo';
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

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      const callbackUrl = searchParams.get('callbackUrl') || '/catalogo';
      await signIn('google', { callbackUrl });
    } catch (error) {
      console.error('Erro no login com Google:', error);
      toast.error('Ocorreu um erro durante o login com Google');
      setIsGoogleLoading(false);
    }
  };

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

      <div className="mt-4 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Ou continue com</span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {isGoogleLoading ? (
            'Processando...'
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24">
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                  <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                  <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                  <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                </g>
              </svg>
              Google
            </>
          )}
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