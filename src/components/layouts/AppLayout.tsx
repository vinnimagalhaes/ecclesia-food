'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, CreditCard, Shield } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 border-b">
            <span className="text-xl font-bold text-primary-600">Ecclesia Food</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <Link 
              href="/dashboard" 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span>Dashboard</span>
            </Link>
            <Link 
              href="/eventos" 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span>Eventos</span>
            </Link>
            <Link 
              href="/vendas" 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span>Vendas</span>
            </Link>
            <Link 
              href="/rifas" 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span>Rifas & Sorteios</span>
            </Link>
            <Link 
              href="/relatorios" 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span>Relatórios Rifas & Sorteios</span>
            </Link>
            <Link 
              href="/configuracoes" 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span>Configurações</span>
            </Link>
            
            {/* Link para diagnóstico Pagar.me - apenas para SUPER_ADMIN */}
            {session?.user?.role === 'SUPER_ADMIN' && (
              <Link 
                href="/admin/pagarme-diagnostico" 
                className="flex items-center gap-2 px-4 py-2.5 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg mt-2"
              >
                <CreditCard size={16} />
                <span>Diagnóstico Pagar.me</span>
              </Link>
            )}
            
            {/* Link para painel master - apenas para SUPER_ADMIN */}
            {session?.user?.role === 'SUPER_ADMIN' && (
              <Link 
                href="/master" 
                className="flex items-center gap-2 px-4 py-2.5 text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg mt-2"
              >
                <Shield size={16} />
                <span>Painel Master</span>
              </Link>
            )}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              {session?.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'Avatar'} 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
              )}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {session?.user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {session?.user?.email || 'Sem email'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 flex-shrink-0 cursor-pointer"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-8">
        {children}
      </main>
    </div>
  );
} 