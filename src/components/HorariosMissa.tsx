import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Constantes para os dias da semana
const DIAS_SEMANA = {
  DOMINGO: 'Domingo',
  SEGUNDA: 'Segunda-feira',
  TERCA: 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SABADO: 'Sábado',
  FERIADO: 'Feriados'
};

// Ordem dos dias da semana para exibição
const ORDEM_DIAS = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'FERIADO'];

// Interface para horário de missa
interface HorarioMissa {
  id: string;
  dayOfWeek: keyof typeof DIAS_SEMANA;
  time: string;
  notes?: string | null;
  igrejaInfo?: {
    nome: string;
    cidade: string;
  };
}

// Interface para igreja
interface Igreja {
  id: string;
  nome: string;
  cidade: string;
  estado?: string;
}

// Interface para filtros
interface Filtros {
  cidade?: string;
  dia?: string;
  horario?: string;
}

interface HorariosMissaProps {
  igreja: Igreja | null;
  filtros?: Filtros;
}

export function HorariosMissa({ igreja, filtros }: HorariosMissaProps) {
  const [horarios, setHorarios] = useState<HorarioMissa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para buscar horários de missa
  const fetchHorarios = async () => {
    if (!igreja && !filtros?.cidade) {
      console.log('Nenhuma igreja ou cidade selecionada');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      let apiUrl = '/api/igrejas/mass-schedules';
      let params = new URLSearchParams();
      
      if (igreja) {
        params.append('churchId', igreja.id);
        console.log('Buscando horários para igreja específica:', igreja.id);
      } else if (filtros?.cidade) {
        params.append('cidade', filtros.cidade);
        params.append('tipoBusca', 'cidade');
        console.log('Buscando horários por cidade:', filtros.cidade);
      }
      
      if (filtros?.dia) {
        params.append('dia', filtros.dia);
      }
      
      if (filtros?.horario) {
        params.append('horario', filtros.horario);
      }
      
      const url = `${apiUrl}?${params.toString()}`;
      console.log('URL completa da busca:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erro na resposta da API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`Erro ao carregar horários: ${response.status} - ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Dados recebidos:', data);
      
      if (!data.massSchedules) {
        console.warn('Nenhum horário encontrado');
        setHorarios([]);
      } else {
        setHorarios(data.massSchedules);
      }
    } catch (err) {
      console.error('Erro ao carregar horários de missa:', err);
      setError(err instanceof Error ? err.message : 'Não foi possível carregar os horários de missa');
    } finally {
      setLoading(false);
    }
  };

  // Buscar horários quando a igreja ou os filtros mudarem
  useEffect(() => {
    if (igreja || filtros?.cidade) {
      console.log('Igreja ou filtros mudaram:', { igreja, filtros });
      fetchHorarios();
    } else {
      setHorarios([]);
    }
  }, [igreja, filtros]);

  // Se não houver igreja ou cidade selecionada
  if (!igreja && !filtros?.cidade) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 text-center">
        <div className="flex justify-center">
          <div className="w-10 h-10 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Aguardando localização...</p>
        </div>
      </div>
    );
  }

  // Se estiver carregando
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-10 h-10 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Carregando horários...</p>
        </div>
      </div>
    );
  }

  // Se houver erro
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center text-red-600 mb-4">
          <AlertTriangle size={20} className="mr-2" />
          <p>{error}</p>
        </div>
        <Button 
          onClick={fetchHorarios}
          variant="outline"
          className="w-full"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Agrupar horários por dia da semana
  const horariosPorDia: Record<string, HorarioMissa[]> = {};
  
  ORDEM_DIAS.forEach(dia => {
    horariosPorDia[dia] = horarios.filter(h => h.dayOfWeek === dia);
  });

  // Verificar se não há horários
  const semHorarios = horarios.length === 0;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {igreja 
            ? `Horários de Missa - ${igreja.nome}`
            : `Horários de Missa em ${filtros?.cidade}`}
        </h3>
      </div>
      
      {semHorarios ? (
        <div className="text-center py-8">
          <Clock className="mx-auto h-10 w-10 text-gray-400 mb-3" />
          <p className="text-gray-600">
            Não há horários de missa disponíveis 
            {igreja ? ` para esta igreja` : ` nesta cidade${filtros?.dia ? ` no dia selecionado` : ''}`}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {ORDEM_DIAS.map(dia => {
            const diaHorarios = horariosPorDia[dia];
            if (diaHorarios.length === 0) return null;
            
            return (
              <div key={dia} className="border-t pt-4 first:border-t-0 first:pt-0">
                <h4 className="font-medium text-gray-700 mb-2">
                  {DIAS_SEMANA[dia as keyof typeof DIAS_SEMANA]}
                </h4>
                <ul className="space-y-2">
                  {diaHorarios.map(horario => (
                    <li key={horario.id} className="flex items-start">
                      <Clock size={16} className="text-primary-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-gray-900">{horario.time}</p>
                        {horario.igrejaInfo && !igreja && (
                          <p className="text-sm text-primary-600 font-medium mt-0.5">
                            {horario.igrejaInfo.nome}
                          </p>
                        )}
                        {horario.notes && (
                          <p className="text-sm text-gray-500 mt-0.5">{horario.notes}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 