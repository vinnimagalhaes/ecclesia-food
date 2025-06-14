'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Header para área de catálogo - fixo no topo */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50 w-full">
        <div className="container-app py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-500">Ecclesia Food</span>
            </Link>

            {/* Indicador de usuário logado */}
            {session?.user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {session.user.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || 'Avatar'} 
                      className="w-8 h-8 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mr-2">
                      <User size={18} />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {session.user.name || 'Usuário'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                href="/auth/login" 
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Adicionar espaço para compensar o header fixo */}
      <div className="pt-20"></div>

      {/* Conteúdo principal */}
      <main className="w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container-app py-6">
          <div className="text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Ecclesia Food. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 