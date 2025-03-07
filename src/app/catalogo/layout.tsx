'use client';

import Link from 'next/link';

export default function CatalogoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header para área de catálogo */}
      <header className="bg-white shadow-sm">
        <div className="container-app py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-primary-500">Ecclesia Food</span>
            </Link>
          </div>
        </div>
      </header>

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