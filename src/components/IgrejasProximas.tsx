import { useState, useEffect } from 'react';
import { Church, MapPin, AlertTriangle } from 'lucide-react';
import { getUserLocation, LocationData } from '@/lib/geolocation';
import { Button } from '@/components/ui/Button';

interface PerfilIgreja {
  id: string;
  nome: string;
  cidade: string;
  estado?: string;
}

interface IgrejasProximasProps {
  igrejas: PerfilIgreja[];
  onLocationChange: (location: LocationData | null) => void;
}

export function IgrejasProximas({ igrejas, onLocationChange }: IgrejasProximasProps) {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [igrejasProximas, setIgrejasProximas] = useState<PerfilIgreja[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Função para obter a localização do usuário
  const detectarLocalizacao = async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    
    try {
      console.log('Iniciando detecção de localização...');
      const location = await getUserLocation();
      console.log('Localização obtida:', location);
      setUserLocation(location);
      onLocationChange(location);
      
      // Filtrar igrejas na mesma cidade
      const proximas = igrejas.filter(igreja => 
        igreja.cidade.toLowerCase() === location.cidade.toLowerCase()
      );
      
      setIgrejasProximas(proximas);
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      
      // Verificar se o erro é de permissão negada
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('permission denied') || errorMessage.includes('permissão negada')) {
          setPermissionDenied(true);
          setError('Permissão de localização negada');
        } else if (errorMessage.includes('gps')) {
          setError('GPS desativado. Por favor, ative o GPS do seu celular.');
        } else if (errorMessage.includes('tempo limite')) {
          setError('Tempo limite excedido. Verifique sua conexão e tente novamente.');
        } else {
          setError(error.message);
        }
      } else {
        setError('Erro desconhecido ao obter localização');
      }
      
      onLocationChange(null);
    } finally {
      setLoading(false);
    }
  };

  // Resetar a localização
  const resetarLocalizacao = () => {
    setUserLocation(null);
    setIgrejasProximas([]);
    setError(null);
    setPermissionDenied(false);
    onLocationChange(null);
  };

  // Verificar se há igrejas próximas após o carregamento da localização
  useEffect(() => {
    if (userLocation && userLocation.cidade) {
      const proximas = igrejas.filter(igreja => 
        igreja.cidade.toLowerCase() === userLocation.cidade.toLowerCase()
      );
      setIgrejasProximas(proximas);
    }
  }, [userLocation, igrejas]);

  // Se não houver localização ainda
  if (!userLocation) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <MapPin className="text-primary-500 h-5 w-5" />
          <h3 className="font-medium text-gray-900">Mostrar igrejas na sua cidade</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Permita acesso à sua localização para encontrar igrejas próximas de você.
        </p>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
            
            {permissionDenied && (
              <p className="text-xs text-red-600 mt-2">
                Você precisará habilitar a permissão de localização nas configurações do seu navegador.
              </p>
            )}
          </div>
        )}
        
        <Button
          onClick={detectarLocalizacao}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
              <span>Detectando...</span>
            </>
          ) : (
            <>
              <MapPin className="h-4 w-4" />
              <span>Usar minha localização</span>
            </>
          )}
        </Button>
      </div>
    );
  }

  // Se houver localização, exibir resultados
  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="text-primary-500 h-5 w-5" />
          <h3 className="font-medium text-gray-900">Igrejas perto de você</h3>
        </div>
        <button 
          onClick={resetarLocalizacao}
          className="text-xs text-gray-500 hover:text-red-500 transition"
        >
          Remover filtro
        </button>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Mostrando igrejas em <span className="font-medium">{userLocation.cidade}</span>
          {userLocation.estado ? `, ${userLocation.estado}` : ''}
        </p>
        
        <p className="text-sm text-gray-500 mt-1">
          {igrejasProximas.length} {igrejasProximas.length === 1 ? 'igreja encontrada' : 'igrejas encontradas'} na sua cidade
        </p>
      </div>
      
      {igrejasProximas.length === 0 && (
        <div className="bg-white rounded-lg p-4 text-center">
          <Church className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-gray-600">
            Não encontramos igrejas em {userLocation.cidade} ainda.
          </p>
        </div>
      )}
    </div>
  );
} 