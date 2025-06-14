import React from 'react';
import Link from 'next/link';

export default function ContaDesativadaPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Conta Desativada</h1>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-8 w-8 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <p className="text-gray-700 mb-6">
            Sua conta foi desativada pelo administrador do sistema. 
            Se você acredita que isso seja um erro, entre em contato com o administrador.
          </p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Se você é o administrador e está vendo esta página por engano, 
              certifique-se de configurar corretamente as permissões de usuário.
            </p>
            <Link 
              href="/auth/login"
              className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 