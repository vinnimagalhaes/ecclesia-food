'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import UserActivationToggle from './UserActivationToggle';
import DeleteUserDialog from './DeleteUserDialog';
import { toast } from 'sonner';

export default function UsuariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verificar se o usuário é SUPER_ADMIN
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Carregar usuários
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const response = await fetch('/api/master/usuarios');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar usuários');
        }
        
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.error('Erro ao carregar lista de usuários');
      } finally {
        setLoading(false);
      }
    }
    
    if (session?.user.role === 'SUPER_ADMIN') {
      fetchUsers();
    }
  }, [session, refreshKey]);

  const handleUserDeleted = () => {
    // Incrementar a chave para forçar o recarregamento dos dados
    setRefreshKey(prev => prev + 1);
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center">
          <div className="animate-pulse text-gray-500">Carregando usuários...</div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return null; // Redirecionando no useEffect
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <Link 
          href="/master" 
          className="text-blue-600 hover:text-blue-800"
        >
          Voltar para o painel master
        </Link>
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Igreja
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Função
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Criação
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || 'Sem nome'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {user.church?.name || 'Sem igreja'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'SUPER_ADMIN' 
                        ? 'bg-purple-100 text-purple-800' 
                        : user.role === 'ADMIN' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'SUPER_ADMIN' 
                        ? 'Super Admin' 
                        : user.role === 'ADMIN' 
                          ? 'Administrador' 
                          : 'Membro'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role === 'SUPER_ADMIN' ? (
                      <div className="text-sm font-medium text-gray-900">Sempre ativo</div>
                    ) : (
                      <UserActivationToggle 
                        userId={user.id} 
                        isActive={user.isActive} 
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.role !== 'SUPER_ADMIN' && (
                      <div className="flex items-center space-x-3">
                        <DeleteUserDialog 
                          userId={user.id} 
                          userName={user.name || ''} 
                          userEmail={user.email}
                          onUserDeleted={handleUserDeleted}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 