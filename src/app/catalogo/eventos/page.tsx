'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CatalogoEventosRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar para a página de igrejas
    router.replace('/catalogo/igrejas');
  }, [router]);

  return (
    <div className="flex justify-center py-12">
      <div className="animate-pulse text-gray-500">Redirecionando...</div>
    </div>
  );
} 