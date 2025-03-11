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

// Mapeamento de estado para cidades (simplificado para alguns estados)
const CIDADES_POR_ESTADO: Record<string, string[]> = {
  'SP': ['São Paulo', 'Campinas', 'Ribeirão Preto', 'Santos', 'São José dos Campos', 'Sorocaba', 'Guarulhos', 'Osasco', 'Santo André', 'São Bernardo do Campo'],
  'RJ': ['Rio de Janeiro', 'Niterói', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Petrópolis', 'Volta Redonda', 'Campos dos Goytacazes', 'Macaé', 'Angra dos Reis'],
  'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga'],
  'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro', 'Ilhéus', 'Lauro de Freitas', 'Jequié', 'Porto Seguro'],
  'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande'],
  'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá'],
  // Adicionar mais estados conforme necessário
};

// Adicionando outras cidades para estados que não estão na lista acima
ESTADOS_BRASILEIROS.forEach(estado => {
  if (!CIDADES_POR_ESTADO[estado]) {
    CIDADES_POR_ESTADO[estado] = ['Outra cidade'];
  }
});

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

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Obter cidades do estado selecionado
  const getCitiesForState = (state: string): string[] => {
    return CIDADES_POR_ESTADO[state] || ['Outra cidade'];
  };

  // Verificar se há necessidade de limpar a cidade quando mudar o estado
  useEffect(() => {
    if (currentStep === 2) {
      // Se estivermos na etapa de cidade, obtemos as cidades do estado selecionado
      const cities = getCitiesForState(churchData.state);
      
      // Se a cidade atual não está na lista de cidades para o estado selecionado,
      // resetamos a seleção de cidade
      if (churchData.city && !cities.includes(churchData.city)) {
        setChurchData(prev => ({
          ...prev,
          city: ''
        }));
      }
    }
  }, [churchData.state, currentStep, churchData.city]);

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
      // Para o caso da cidade, opções dinâmicas baseadas no estado
      if (currentStepData.field === 'city') {
        return getCitiesForState(churchData.state);
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

            <button
              onClick={handleNext}
              disabled={!canAdvance || isLoading}
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