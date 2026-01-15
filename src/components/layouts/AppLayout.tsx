'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, CreditCard, Shield } from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth();

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
              <span>Relatórios</span>
            </Link>
            <Link 
              href="/configuracoes" 
              className="flex items-center px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <span>Configurações</span>
            </Link>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t">
            <div className="flex items-center">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'Avatar'} 
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
                  <User size={24} />
                </div>
              )}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {user?.displayName || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'Sem email'}
                </p>
              </div>
              <button
                onClick={signOut}
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
