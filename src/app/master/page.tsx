import React from 'react';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { redirect } from 'next/navigation';

export default async function MasterPage() {
  // Verificar se o usuário é SUPER_ADMIN
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Painel Master de Administração</h1>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Atenção:</strong> Este painel dá acesso a funções administrativas avançadas.
              Use com responsabilidade.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/master/usuarios" 
          className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50"
        >
          <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Gerenciar Usuários</h5>
          <p className="font-normal text-gray-700">
            Visualize, ative e desative contas de usuários do sistema.
          </p>
        </Link>

        <Link 
          href="/admin/pagarme-diagnostico" 
          className="block p-6 bg-white border border-gray-200 rounded-lg shadow hover:bg-gray-50"
        >
          <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Diagnóstico Pagar.me</h5>
          <p className="font-normal text-gray-700">
            Verifique e solucione problemas com a integração de pagamentos Pagar.me.
          </p>
        </Link>

        <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow opacity-50 cursor-not-allowed">
          <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Configurações do Sistema</h5>
          <p className="font-normal text-gray-700">
            Configure parâmetros globais do sistema (em breve).
          </p>
        </div>

        <div className="block p-6 bg-white border border-gray-200 rounded-lg shadow opacity-50 cursor-not-allowed">
          <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900">Logs do Sistema</h5>
          <p className="font-normal text-gray-700">
            Visualize logs e eventos do sistema (em breve).
          </p>
        </div>
      </div>
    </div>
  );
} 