'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { toast } from 'sonner';

// Lista de estados brasileiros
const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

type Step = {
  question: string;
  field: keyof ChurchData;
  type: 'text' | 'select';
  options?: string[] | (() => string[]);
};

type ChurchData = {
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  description: string;
};

const steps: Step[] = [
  {
    question: 'Nome da Igreja',
    field: 'name',
    type: 'text'
  },
  {
    question: 'Estado da Igreja',
    field: 'state',
    type: 'select',
    options: ESTADOS_BRASILEIROS
  },
  {
    question: 'Cidade da Igreja',
    field: 'city',
    type: 'select',
    // Opções dinâmicas baseadas no estado selecionado
    options: function() {
      // Esta função será chamada dinamicamente quando a etapa for renderizada
      return [];
    }
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<number[]>([0]); // Rastreando etapas visitadas
  const [churchData, setChurchData] = useState<ChurchData>({
    name: '',
    city: '',
    state: '',
    address: '',
    phone: '',
    description: ''
  });
  const [citiesList, setCitiesList] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Carregar cidades quando o estado mudar
  useEffect(() => {
    if (churchData.state) {
      fetchCitiesForState(churchData.state);
    }
  }, [churchData.state]);

  // Função para buscar cidades de um estado usando API pública
  const fetchCitiesForState = async (state: string) => {
    try {
      setLoadingCities(true);
      
      // Usar API do IBGE para buscar municípios
      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar cidades');
      }
      
      const data = await response.json();
      const cities = data.map((city: any) => city.nome).sort();
      
      setCitiesList(cities);
      
      // Limpar cidade selecionada se não estiver na nova lista
      if (churchData.city && !cities.includes(churchData.city)) {
        setChurchData(prev => ({
          ...prev,
          city: ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar cidades:', error);
      toast.error('Não foi possível carregar a lista de cidades. Por favor, tente novamente.');
      setCitiesList(['Erro ao carregar cidades']);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      // Último passo, salvar dados
      setIsLoading(true);
      try {
        const response = await fetch('/api/church', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(churchData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || 'Falha ao criar perfil da igreja');
        }

        toast.success('Perfil da igreja criado com sucesso!');
        
        // Fazer login novamente para atualizar a sessão
        await signIn('credentials', {
          redirect: false,
          email: session?.user?.email,
        });

        router.push('/dashboard');
      } catch (error) {
        console.error('Erro ao criar perfil da igreja:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao criar perfil da igreja. Por favor, tente novamente.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Próxima pergunta
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      
      // Adicionar à lista de etapas visitadas
      if (!visitedSteps.includes(nextStep)) {
        setVisitedSteps(prev => [...prev, nextStep]);
      }
    }
  };

  // Navegar para uma etapa específica (usado nas bolinhas clicáveis)
  const goToStep = (stepIndex: number) => {
    // Só permite navegar para etapas já visitadas ou a próxima etapa
    if (visitedSteps.includes(stepIndex) || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
    }
  };

  // Se ainda está carregando a sessão ou não está autenticado, mostra loading
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  const handleInputChange = (value: string) => {
    setChurchData(prev => ({
      ...prev,
      [currentStepData.field]: value
    }));
  };

  const canAdvance = churchData[currentStepData.field] !== '';

  // Obter opções para o passo atual
  const getOptionsForCurrentStep = () => {
    if (typeof currentStepData.options === 'function') {
      // Para o caso da cidade, retornamos a lista de cidades carregada
      if (currentStepData.field === 'city') {
        return citiesList;
      }
      return [];
    }
    return currentStepData.options || [];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        {/* Logo ou ícone */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            Ecclesia Food
          </h1>
          <p className="text-gray-600">
            Vamos configurar o perfil da sua igreja
          </p>
        </div>

        {/* Indicador de progresso com bolinhas clicáveis */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((_, index) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => goToStep(index)}
                  disabled={!visitedSteps.includes(index) && index !== currentStep + 1}
                  className={`
                    rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium transition-colors
                    ${index <= currentStep ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}
                    ${visitedSteps.includes(index) || index === currentStep + 1 ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed'}
                  `}
                  aria-label={`Ir para etapa ${index + 1}`}
                >
                  {index + 1}
                </button>
                {index < steps.length - 1 && (
                  <div className={`
                    h-1 w-12 mx-2 transition-colors
                    ${index < currentStep ? 'bg-primary-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            {currentStepData.question}
          </h2>

          <div className="space-y-6">
            {currentStepData.type === 'text' ? (
              <input
                type="text"
                value={churchData[currentStepData.field]}
                onChange={(e) => handleInputChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-lg shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                placeholder="Digite sua resposta"
                autoFocus
              />
            ) : (
              <div>
                {currentStepData.field === 'city' && loadingCities ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-8 h-8 border-t-2 border-primary-500 border-solid rounded-full animate-spin mr-3"></div>
                    <p>Carregando cidades...</p>
                  </div>
                ) : (
                  <select
                    value={churchData[currentStepData.field]}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-3 text-lg shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                    autoFocus
                  >
                    <option value="">
                      {currentStepData.field === 'state' ? 'Selecione o estado' : 'Selecione a cidade'}
                    </option>
                    {getOptionsForCurrentStep().map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            <button
              onClick={handleNext}
              disabled={!canAdvance || isLoading || (currentStepData.field === 'city' && loadingCities)}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Salvando...' : currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 