import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default function Home() {
  // Verificar o hostname para decidir se deve redirecionar
  const headersList = headers();
  const host = headersList.get('host') || '';
  
  // Redirecionar apenas se NÃO for o subdomínio admin
  if (!host.startsWith('admin.')) {
    // Redirecionamento automático para o catálogo de igrejas no site principal
    redirect('/catalogo/igrejas');
  }
  
  // Se for o subdomínio admin, continua renderizando a página normalmente
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
                    <h3 className="font-medium text-lg mb-2">Área Administrativa</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Acesse para gerenciar eventos e relatórios da sua igreja.
                    </p>
                    <a href="/admin" className="inline-block w-full">
                      <button 
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg text-center transition-colors"
                      >
                        Entrar como Administrador
                      </button>
                    </a>
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