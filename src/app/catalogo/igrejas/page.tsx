'use client';

import { useState, useEffect } from 'react';
import { Search, Church, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppListItem } from '@/components/ui/AppListItem';

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
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Função para buscar igrejas
  const fetchIgrejas = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError('');

      // Usar URL completa com timestamp para evitar cache
      const timestamp = new Date().getTime();
      const apiUrl = `${window.location.origin}/api/igrejas?_t=${timestamp}`;
      console.log('Chamando API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro da API:', errorData);
        if (errorData.logs) {
          console.log('Logs da API:', errorData.logs.join('\n'));
        }
        throw new Error(`Falha ao carregar igrejas: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
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
      setIsRefreshing(false);
    }
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchIgrejas();
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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Carregando igrejas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <Button
            onClick={() => fetchIgrejas()}
            variant="primary"
            className="mt-4 w-full"
          >
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header com barra de pesquisa */}
      <AppHeader 
        title="Catálogo de Igrejas"
        subtitle="Encontre eventos e produtos das igrejas participantes"
        showHomeButton
        sticky={true}
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome da igreja ou cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 bg-white border-0 rounded-xl shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
      </AppHeader>

      {/* Conteúdo principal */}
      <div className="flex-1 p-4 -mt-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 font-medium">
            {filteredIgrejas.length} {filteredIgrejas.length === 1 ? 'igreja encontrada' : 'igrejas encontradas'}
          </p>
          <Button
            onClick={() => fetchIgrejas(false)}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-xs">{isRefreshing ? 'Atualizando' : 'Atualizar'}</span>
          </Button>
        </div>

        {/* Lista de igrejas */}
        {filteredIgrejas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-4">
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
          <div className="grid grid-cols-1 gap-3">
            {filteredIgrejas.map((igreja) => (
              <AppListItem
                key={igreja.id}
                href={`/catalogo/igrejas/${formatarParaURL(igreja.cidade)}/${formatarParaURL(igreja.nome)}`}
                title={igreja.nome}
                location={`${igreja.cidade}${igreja.estado ? ` - ${igreja.estado}` : ''}`}
                icon={<Church size={24} className="text-primary-500" />}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 