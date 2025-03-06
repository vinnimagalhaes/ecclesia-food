import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      <main className="container-app py-12">
        <div className="py-12 sm:py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              <span className="block">Bem-vindo ao</span>
              <span className="block text-primary-500">Ecclesia Food</span>
            </h1>
            <p className="mt-3 mx-auto text-sm text-gray-500 sm:text-base max-w-2xl">
              Sistema de gestão de eventos para igrejas
            </p>
            
            <div className="mt-10 flex flex-col items-center">
              <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full">
                <h2 className="text-xl font-semibold mb-6 text-gray-800">Como deseja acessar?</h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <h3 className="font-medium text-lg mb-2">Buscar Eventos</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Encontre eventos das igrejas participantes.
                    </p>
                    <Link href="/catalogo/igrejas">
                      <Button 
                        variant="primary" 
                        size="lg" 
                        className="w-full inline-flex items-center justify-center gap-2"
                      >
                        <Search size={20} />
                        Pesquisar Igreja
                      </Button>
                    </Link>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <h3 className="font-medium text-lg mb-2">Área Administrativa</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Acesse para gerenciar eventos e relatórios da sua igreja.
                    </p>
                    <Link href="/login">
                      <Button variant="secondary" size="lg" className="w-full">
                        Entrar como Administrador
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 