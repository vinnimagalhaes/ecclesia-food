'use client';

import { useState, useEffect } from 'react';
import { Search, Church, Heart, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppListItem } from '@/components/ui/AppListItem';
import { IgrejasProximas } from '@/components/IgrejasProximas';
import { LocationData } from '@/lib/geolocation';
import { HorariosMissa } from '@/components/HorariosMissa';

// Tipos de abas disponíveis
type TabType = 'todas' | 'favoritas' | 'horarios';

interface PerfilIgreja {
  id: string;
  nome: string;
  cidade: string;
  estado?: string;
  favorita?: boolean;
}

export default function CatalogoIgrejasPage() {
  const [igrejas, setIgrejas] = useState<PerfilIgreja[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIgrejas, setFilteredIgrejas] = useState<PerfilIgreja[]>([]);
  const [, setUserLocation] = useState<LocationData | null>(null);
  // Nova variável de estado para controle das abas
  const [activeTab, setActiveTab] = useState<TabType>('todas');
  // Estado para igrejas favoritas
  const [igrejasFavoritas, setIgrejasFavoritas] = useState<PerfilIgreja[]>([]);
  // Estado para a igreja selecionada na aba de horários
  const [selectedIgreja, setSelectedIgreja] = useState<PerfilIgreja | null>(null);

  // Função para buscar igrejas
  const fetchIgrejas = async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
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
      
      // Carregar favoritos do localStorage
      const favoritos = loadFavoritos();
      
      // Marcar igrejas favoritas
      const igrejasComFavoritos = data.igrejas.map((igreja: PerfilIgreja) => ({
        ...igreja,
        favorita: favoritos.includes(igreja.id)
      }));
      
      setIgrejas(igrejasComFavoritos);
      setFilteredIgrejas(igrejasComFavoritos);
      
      // Atualizar lista de favoritos
      updateFavoritasList(igrejasComFavoritos);
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
  };

  // Função para carregar favoritos do localStorage
  const loadFavoritos = (): string[] => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('igrejasFavoritas');
    return saved ? JSON.parse(saved) : [];
  };

  // Função para salvar favoritos no localStorage
  const saveFavoritos = (favoritos: string[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('igrejasFavoritas', JSON.stringify(favoritos));
  };

  // Função para atualizar a lista de igrejas favoritas
  const updateFavoritasList = (igrejasLista: PerfilIgreja[]) => {
    const favoritas = igrejasLista.filter(igreja => igreja.favorita);
    setIgrejasFavoritas(favoritas);
  };

  // Função para alternar o status de favorita de uma igreja
  const toggleFavorita = (id: string) => {
    // Atualizar lista de igrejas
    const updatedIgrejas = igrejas.map(igreja => 
      igreja.id === id ? { ...igreja, favorita: !igreja.favorita } : igreja
    );
    
    setIgrejas(updatedIgrejas);
    
    // Atualizar lista filtrada se necessário
    if (activeTab === 'todas' || (activeTab === 'favoritas' && searchTerm)) {
      const updatedFiltered = filteredIgrejas.map(igreja => 
        igreja.id === id ? { ...igreja, favorita: !igreja.favorita } : igreja
      );
      setFilteredIgrejas(updatedFiltered);
    }
    
    // Atualizar localStorage
    const favoritos = updatedIgrejas
      .filter(igreja => igreja.favorita)
      .map(igreja => igreja.id);
    
    saveFavoritos(favoritos);
    
    // Atualizar lista de favoritas
    updateFavoritasList(updatedIgrejas);
  };

  // Carregar dados iniciais
  useEffect(() => {
    fetchIgrejas();
  }, []);

  // Efeito para atualizar a lista filtrada quando a aba ativa muda
  useEffect(() => {
    if (activeTab === 'todas') {
      // Na aba "Todas", aplica apenas o filtro de busca
      if (!searchTerm.trim()) {
        setFilteredIgrejas(igrejas);
      } else {
        const searchTermLower = searchTerm.toLowerCase();
        const filtered = igrejas.filter(igreja => 
          igreja.nome.toLowerCase().includes(searchTermLower) ||
          igreja.cidade.toLowerCase().includes(searchTermLower)
        );
        setFilteredIgrejas(filtered);
      }
    } else if (activeTab === 'favoritas') {
      // Na aba "Favoritas", mostra apenas as favoritas, com filtro de busca se aplicável
      if (!searchTerm.trim()) {
        setFilteredIgrejas(igrejasFavoritas);
      } else {
        const searchTermLower = searchTerm.toLowerCase();
        const filtered = igrejasFavoritas.filter(igreja => 
          igreja.nome.toLowerCase().includes(searchTermLower) ||
          igreja.cidade.toLowerCase().includes(searchTermLower)
        );
        setFilteredIgrejas(filtered);
      }
    } else if (activeTab === 'horarios') {
      // Na aba "Horários", mostra todas as igrejas com horários (por enquanto, todas)
      if (!searchTerm.trim()) {
        setFilteredIgrejas(igrejas);
      } else {
        const searchTermLower = searchTerm.toLowerCase();
        const filtered = igrejas.filter(igreja => 
          igreja.nome.toLowerCase().includes(searchTermLower) ||
          igreja.cidade.toLowerCase().includes(searchTermLower)
        );
        setFilteredIgrejas(filtered);
      }
    }
  }, [activeTab, igrejas, igrejasFavoritas, searchTerm]);

  // Função para formatar URL
  const formatarParaURL = (texto: string) => {
    return texto.toLowerCase().replace(/\s+/g, '-');
  };

  // Função para lidar com a mudança da localização do usuário
  const handleLocationChange = (location: LocationData | null) => {
    setUserLocation(location);
    
    if (location && location.cidade) {
      // Se a localização for detectada, filtra por cidade e atualiza a busca
      setSearchTerm(location.cidade);
    } else {
      // Se a localização for resetada, limpa o termo de busca
      setSearchTerm('');
    }
  };

  // Conteúdo da aba de horários
  const renderHorariosTab = () => {
    return (
      <div>
        {/* Seletor de igreja */}
        <div className="mb-4">
          <label htmlFor="igreja-select" className="block text-sm font-medium text-gray-700 mb-1">
            Selecione uma igreja para ver os horários de missa
          </label>
          <select
            id="igreja-select"
            value={selectedIgreja?.id || ''}
            onChange={(e) => {
              const selectedId = e.target.value;
              const igreja = igrejas.find(i => i.id === selectedId) || null;
              setSelectedIgreja(igreja);
            }}
            className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Selecione uma igreja</option>
            {igrejas.map((igreja) => (
              <option key={igreja.id} value={igreja.id}>
                {igreja.nome} ({igreja.cidade})
              </option>
            ))}
          </select>
        </div>

        {/* Componente de horários */}
        <HorariosMissa igreja={selectedIgreja} />
      </div>
    );
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
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden m-0 p-0 max-w-full">
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
      <div className="flex-1 p-4">
        {/* Componente de igrejas próximas */}
        <IgrejasProximas 
          igrejas={igrejas}
          onLocationChange={handleLocationChange}
        />
        
        {/* Navegação por abas */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            <button 
              className={`px-4 py-2 flex items-center gap-1.5 ${activeTab === 'todas' 
                ? 'text-primary-500 border-b-2 border-primary-500 font-medium' 
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('todas')}
            >
              <Church size={18} />
              <span>Todas as Igrejas</span>
            </button>
            <button 
              className={`px-4 py-2 flex items-center gap-1.5 ${activeTab === 'favoritas' 
                ? 'text-primary-500 border-b-2 border-primary-500 font-medium' 
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('favoritas')}
            >
              <Heart size={18} />
              <span>Favoritas</span>
              {igrejasFavoritas.length > 0 && (
                <span className="ml-1 bg-primary-100 text-primary-700 rounded-full text-xs px-2 py-0.5">
                  {igrejasFavoritas.length}
                </span>
              )}
            </button>
            <button 
              className={`px-4 py-2 flex items-center gap-1.5 ${activeTab === 'horarios' 
                ? 'text-primary-500 border-b-2 border-primary-500 font-medium' 
                : 'text-gray-500'}`}
              onClick={() => setActiveTab('horarios')}
            >
              <Clock size={18} />
              <span>Horários de Missa</span>
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 font-medium">
            {filteredIgrejas.length} {filteredIgrejas.length === 1 ? 'igreja encontrada' : 'igrejas encontradas'}
          </p>
        </div>

        {/* Conteúdo de acordo com a aba ativa */}
        {activeTab === 'horarios' ? (
          renderHorariosTab()
        ) : (
          // Lista de igrejas (mesma para 'todas' e 'favoritas', com filtros diferentes)
          filteredIgrejas.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-4">
              <Church className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'favoritas' 
                  ? (searchTerm ? 'Nenhuma igreja favorita encontrada' : 'Nenhuma igreja favorita')
                  : (searchTerm ? 'Nenhuma igreja encontrada' : 'Nenhuma igreja cadastrada')}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'favoritas' && !searchTerm
                  ? 'Adicione igrejas aos favoritos para facilitar o acesso'
                  : (searchTerm 
                    ? 'Tente buscar com outros termos'
                    : 'Em breve novas igrejas serão adicionadas.')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredIgrejas.map((igreja) => (
                <div key={igreja.id} className="relative">
                  <button 
                    onClick={() => toggleFavorita(igreja.id)}
                    className="absolute right-4 top-4 z-10 text-gray-400 hover:text-primary-500 p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors"
                    aria-label={igreja.favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                  >
                    <Heart 
                      size={18} 
                      className={igreja.favorita ? "fill-primary-500 text-primary-500" : ""} 
                    />
                  </button>
                  <AppListItem
                    href={`/catalogo/igrejas/${formatarParaURL(igreja.cidade)}/${formatarParaURL(igreja.nome)}`}
                    title={igreja.nome}
                    location={`${igreja.cidade}${igreja.estado ? ` - ${igreja.estado}` : ''}`}
                    icon={<Church size={24} className="text-primary-500" />}
                    showArrow={false}
                  />
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
} 