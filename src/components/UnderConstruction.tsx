'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function UnderConstruction() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Página em Reconstrução 🚧</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        Estamos migrando nosso sistema para uma nova arquitetura mais rápida e segura.
        Esta página estará disponível em breve.
      </p>
      
      {user ? (
        <Link href="/dashboard" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
          Voltar para Dashboard
        </Link>
      ) : (
        <Link href="/auth/login" className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">
          Fazer Login
        </Link>
      )}
    </div>
  );
}
