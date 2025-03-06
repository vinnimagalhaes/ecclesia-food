'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Church } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PerfilIgreja {
  id: string;
  nome: string;
  cidade: string;
  estado?: string;
}

export default function CatalogoIgrejasPage() {
  const [igrejas, setIgrejas] = useState<PerfilIgreja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIgrejas, setFilteredIgrejas] = useState<PerfilIgreja[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchIgrejas() {
      try {
        console.log('Iniciando busca de igrejas...');
        setLoading(true);
        setError('');

        // Usar URL completa
        const apiUrl = `${window.location.origin}/api/igrejas`;
        console.log('Chamando API:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });
        
        console.log('Status da resposta:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Erro da API:', errorData);
          if (errorData.logs) {
            console.log('Logs da API:', errorData.logs.join('\n'));
          }
          throw new Error(`Falha ao carregar igrejas: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Resposta completa:', data);
        
        if (data.logs) {
          console.log('Logs da API:', data.logs.join('\n'));
        }
        
        if (!Array.isArray(data.igrejas)) {
          console.error('Resposta inválida:', data);
          throw new Error('Formato de resposta inválido');
        }
        
        setIgrejas(data.igrejas);
        setFilteredIgrejas(data.igrejas);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar a lista de igrejas.';
        console.error('Erro detalhado:', {
          message: errorMessage,
          error: err,
          stack: err instanceof Error ? err.stack : undefined
        });
        setError(errorMessage);
        setIgrejas([]);
        setFilteredIgrejas([]);
      } finally {
        setLoading(false);
      }
    }

    // Adicionar um pequeno delay para garantir que a página está totalmente carregada
    setTimeout(fetchIgrejas, 100);
  }, []);

  // Função para filtrar igrejas
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredIgrejas(igrejas);
      return;
    }

    const searchTermLower = searchTerm.toLowerCase();
    const filtered = igrejas.filter(igreja => 
      igreja.nome.toLowerCase().includes(searchTermLower) ||
      igreja.cidade.toLowerCase().includes(searchTermLower)
    );

    setFilteredIgrejas(filtered);
  }, [searchTerm, igrejas]);

  // Função para formatar URL
  const formatarParaURL = (texto: string) => {
    return texto.toLowerCase().replace(/\s+/g, '-');
  };

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="flex justify-center">
          <div className="animate-pulse text-gray-500">Carregando igrejas...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-app py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-app py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Catálogo de Igrejas</h1>
        <p className="text-gray-600">Encontre eventos e produtos das igrejas participantes</p>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome da igreja ou cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Lista de igrejas */}
      {filteredIgrejas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Church className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhuma igreja encontrada' : 'Nenhuma igreja cadastrada'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente buscar com outros termos'
              : 'Em breve novas igrejas serão adicionadas.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIgrejas.map((igreja) => (
            <Link 
              key={igreja.id}
              href={`/catalogo/igrejas/${formatarParaURL(igreja.cidade)}/${formatarParaURL(igreja.nome)}`}
              className="block bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 text-primary-500 mb-2">
                  <Church size={20} />
                  <h2 className="text-lg font-medium">{igreja.nome}</h2>
                </div>
                
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin size={16} className="mt-1 flex-shrink-0" />
                  <span>{igreja.cidade}{igreja.estado ? ` - ${igreja.estado}` : ''}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 