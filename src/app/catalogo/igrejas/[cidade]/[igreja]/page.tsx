'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, Users, RefreshCw, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppIconLocation } from '@/components/ui/AppIconLocation';

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Carregando eventos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header com informações da igreja */}
      <AppHeader
        title={nomeIgreja}
        subtitle={`Eventos em ${formatarCidade(cidade)}`}
        showBackButton={true}
        backUrl="/catalogo/igrejas"
        sticky={true}
      />

      {/* Conteúdo principal */}
      <div className="flex-1 p-4 -mt-2">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 font-medium">
            {eventos.length} {eventos.length === 1 ? 'evento disponível' : 'eventos disponíveis'}
          </p>
          <Button
            onClick={() => fetchEventos(false)}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span className="text-xs">{isRefreshing ? 'Atualizando' : 'Atualizar'}</span>
          </Button>
        </div>

        {/* Exibe erro se houver */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-4">
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
              onClick={() => fetchEventos()}
              variant="primary"
              className="mt-4 w-full"
            >
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Lista de eventos */}
        {eventos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-4">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento disponível no momento</h3>
            <p className="text-gray-600">Fique de olho! Novos eventos serão adicionados em breve.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {eventos.map((evento) => (
              <div 
                key={evento.id} 
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100"
              >
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{evento.nome}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar size={16} className="flex-shrink-0 text-primary-500" />
                      <span>{formatarData(evento.data.toString())}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={16} className="flex-shrink-0 text-primary-500" />
                      <span>{evento.hora}</span>
                    </div>
                    
                    <AppIconLocation 
                      location={evento.local}
                      iconSize={16}
                      className="text-gray-600"
                    />
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users size={16} className="flex-shrink-0 text-primary-500" />
                      <span>Capacidade: {evento.capacidade} pessoas</span>
                    </div>
                  </div>
                  
                  {evento.descricao && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{evento.descricao}</p>
                  )}
                  
                  <Link 
                    href={`/catalogo/igrejas/${params.cidade}/${params.igreja}/eventos/${evento.id}`}
                    className="flex items-center justify-between w-full p-3 mt-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-medium text-primary-600">Ver Produtos</span>
                    <ArrowRight size={18} className="text-primary-500" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 