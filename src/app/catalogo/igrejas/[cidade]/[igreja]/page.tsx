'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, Church, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Tipo para os eventos
type Evento = {
  id: string;
  nome: string;
  local: string;
  data: Date;
  hora: string;
  capacidade: number;
  descricao?: string;
  status: string;
  creator: {
    name: string;
    image?: string;
    id: string;
  };
};

export default function CatalogoEventosIgrejaPage({
  params,
}: {
  params: { cidade: string; igreja: string };
}) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nomeIgreja, setNomeIgreja] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Decodificar parâmetros da URL
  const cidade = decodeURIComponent(params.cidade);
  const igreja = decodeURIComponent(params.igreja);

  // Função para carregar os eventos
  const fetchEventos = async (showLoadingState = true) => {
    try {
      console.log('Iniciando busca de eventos...');
      
      if (showLoadingState) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      setError('');
      
      // Adicionar timestamp para evitar cache
      const timestamp = new Date().getTime();
      // Buscar eventos da API com filtros de cidade e igreja
      const response = await fetch(`/api/catalogo/eventos?cidade=${encodeURIComponent(cidade)}&igreja=${encodeURIComponent(igreja)}&_t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      console.log('Status da resposta:', response.status);
      
      const data = await response.json();
      console.log('Resposta completa:', data);
      
      if (data.logs) {
        console.log('Logs da API:', data.logs.join('\n'));
      }
      
      if (!response.ok) {
        throw new Error(`Falha ao carregar eventos: ${response.status} ${response.statusText}`);
      }
      
      // Verificar se eventos é um array
      if (!Array.isArray(data.eventos)) {
        console.error('Resposta inválida:', data);
        throw new Error('Formato de resposta inválido');
      }
      
      // Filtrar apenas eventos ativos
      const eventosAtivos = data.eventos.filter((evento: Evento) => evento.status === 'ATIVO');
      setEventos(eventosAtivos);
      
      // Formatar o nome da igreja a partir do parâmetro da URL se não houver eventos
      if (eventosAtivos.length === 0) {
        setNomeIgreja(igreja.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '));
        return;
      }
      
      // Buscar perfil da igreja se tiver eventos
      if (eventosAtivos.length > 0 && eventosAtivos[0].creator?.id) {
        try {
          // Buscar perfil da igreja com o userId do criador do primeiro evento
          const churchResponse = await fetch(`/api/igrejas/${eventosAtivos[0].creator.id}`);
          const churchData = await churchResponse.json();
          
          if (churchResponse.ok && churchData.igreja) {
            // Usar o nome da igreja do perfil
            setNomeIgreja(churchData.igreja.nome);
          } else {
            // Fallback para o nome do criador se não encontrar a igreja
            setNomeIgreja(eventosAtivos[0].creator.name);
          }
        } catch (configError) {
          console.error('Erro ao carregar perfil da igreja:', configError);
          // Fallback para o nome do criador se ocorrer erro
          setNomeIgreja(eventosAtivos[0].creator.name);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
      setError('Não foi possível carregar os eventos. Tente novamente.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  // Efeito para carregar os eventos na inicialização
  useEffect(() => {
    fetchEventos();
  }, [cidade, igreja]);

  // Função para formatar data
  function formatarData(dataString: string) {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }

  // Função para formatar cidade
  function formatarCidade(cidadeStr: string) {
    return cidadeStr.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  return (
    <div className="px-2 sm:container-app py-3 sm:py-8 space-y-3 sm:space-y-6">
      <div className="px-2 sm:px-0 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-primary-500 mb-1 sm:mb-2">
            <Church size={20} />
            <h2 className="text-base sm:text-lg font-medium">{nomeIgreja}</h2>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Eventos em {formatarCidade(cidade)}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Confira os próximos eventos e faça suas compras</p>
        </div>
        <Button
          onClick={() => fetchEventos(false)}
          variant="secondary"
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{isRefreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </Button>
      </div>

      {/* Exibe erro se houver */}
      {error && (
        <div className="mx-2 sm:mx-0 bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-md text-sm sm:text-base">
          {error}
          <Button
            onClick={() => fetchEventos()}
            variant="secondary"
            className="mt-2 sm:mt-3"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Lista de eventos */}
      {loading ? (
        <div className="flex justify-center py-6 sm:py-12">
          <div className="animate-pulse text-gray-500 text-sm sm:text-base">Carregando eventos...</div>
        </div>
      ) : eventos.length === 0 ? (
        <div className="mx-2 sm:mx-0 bg-white rounded-xl shadow-sm p-6 sm:p-8 text-center">
          <Calendar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum evento disponível no momento</h3>
          <p className="text-sm sm:text-base text-gray-600">Fique de olho! Novos eventos serão adicionados em breve.</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {eventos.map((evento) => (
            <Link 
              key={evento.id} 
              href={`/catalogo/igrejas/${params.cidade}/${params.igreja}/eventos/${evento.id}`}
              className="block bg-white rounded-xl shadow-sm overflow-hidden active:shadow-inner transition-all"
            >
              <div className="p-4 sm:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{evento.nome}</h3>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm sm:text-base">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="flex-shrink-0" />
                    <span>{formatarData(evento.data.toString())}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="flex-shrink-0" />
                    <span>{evento.hora}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <MapPin size={16} className="flex-shrink-0" />
                    <span className="truncate">{evento.local}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600 col-span-2">
                    <Users size={16} className="flex-shrink-0" />
                    <span>Capacidade: {evento.capacidade} pessoas</span>
                  </div>
                </div>
                
                {evento.descricao && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{evento.descricao}</p>
                )}
                
                <div className="flex justify-end">
                  <Button variant="primary" className="w-full sm:w-auto">
                    Ver Produtos
                  </Button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
} 