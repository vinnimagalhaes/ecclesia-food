/**
 * Serviço de geolocalização para obter a localização do usuário
 * e converter coordenadas em informações de localidade
 */

// Banco de dados simplificado de coordenadas de cidades principais do Brasil
// Formato: [latitude, longitude, cidade, estado]
const CITIES_DATABASE: [number, number, string, string][] = [
  [-22.0193, -47.9167, "São Carlos", "SP"],
  [-23.5505, -46.6333, "São Paulo", "SP"],
  [-22.9068, -43.1729, "Rio de Janeiro", "RJ"],
  [-19.9167, -43.9345, "Belo Horizonte", "MG"],
  [-15.7801, -47.9292, "Brasília", "DF"],
  [-12.9714, -38.5014, "Salvador", "BA"],
  [-3.7172, -38.5433, "Fortaleza", "CE"],
  [-8.0539, -34.8809, "Recife", "PE"],
  [-3.1190, -60.0217, "Manaus", "AM"],
  [-30.0346, -51.2177, "Porto Alegre", "RS"],
  [-25.4284, -49.2733, "Curitiba", "PR"],
  [-20.4428, -54.6464, "Campo Grande", "MS"],
  [-27.5969, -48.5495, "Florianópolis", "SC"],
  [-16.6799, -49.2550, "Goiânia", "GO"],
  [-2.5307, -44.3068, "São Luís", "MA"],
  [-9.9747, -67.8087, "Rio Branco", "AC"],
  [-8.7611, -63.9008, "Porto Velho", "RO"],
  [-20.3222, -40.3381, "Vitória", "ES"],
  [-5.7945, -35.2120, "Natal", "RN"],
  [-7.1219, -34.8829, "João Pessoa", "PB"]
];

/**
 * Interface para os dados de localização obtidos
 */
export interface LocationData {
  cidade: string;
  estado: string;
  pais: string;
  coordenadas: {
    latitude: number;
    longitude: number;
  }
}

/**
 * Obtém a localização atual do usuário usando a API de Geolocalização do navegador
 * @returns Promise com as coordenadas (latitude e longitude)
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      console.error('Geolocalização não é suportada pelo navegador');
      reject(new Error('Geolocalização não é suportada pelo seu navegador'));
      return;
    }

    console.log('Solicitando permissão de localização...');

    navigator.geolocation.getCurrentPosition(
      position => {
        console.log('Localização obtida com sucesso:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
        resolve(position);
      },
      error => {
        console.error('Erro ao obter localização:', {
          code: error.code,
          message: error.message
        });
        
        let errorMessage = 'Erro ao obter localização';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada. Por favor, habilite a localização nas configurações do seu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informações de localização indisponíveis. Verifique se o GPS está ativado.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tempo limite excedido ao obter localização. Tente novamente.';
            break;
          default:
            errorMessage = 'Erro desconhecido ao obter localização.';
        }
        
        reject(new Error(errorMessage));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 60000 
      }
    );
  });
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em quilômetros
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Encontra a cidade mais próxima baseada nas coordenadas
 * @param latitude Latitude da posição
 * @param longitude Longitude da posição
 * @returns Dados da localização estimada
 */
export function findNearestCity(latitude: number, longitude: number): LocationData {
  let nearestCity: [number, number, string, string] | null = null;
  let minDistance = Number.MAX_VALUE;

  // Encontra a cidade mais próxima das coordenadas
  for (const city of CITIES_DATABASE) {
    const [cityLat, cityLon, _cityName, _stateName] = city;
    const distance = getDistance(latitude, longitude, cityLat, cityLon);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestCity = city;
    }
  }

  // Se não encontrar nenhuma cidade (não deve acontecer), retorna dados genéricos
  if (!nearestCity) {
    return {
      cidade: "Cidade desconhecida",
      estado: "",
      pais: "Brasil",
      coordenadas: { latitude, longitude }
    };
  }

  // Retorna os dados da cidade mais próxima
  return {
    cidade: nearestCity[2],
    estado: nearestCity[3],
    pais: "Brasil",
    coordenadas: { latitude, longitude }
  };
}

/**
 * Função completa que obtém a posição do usuário e estima a cidade
 * @returns Promise com os dados de localização
 */
export async function getUserLocation(): Promise<LocationData> {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    // Log para debug
    console.log(`Coordenadas obtidas: ${latitude}, ${longitude}`);
    
    // Encontrar a cidade mais próxima
    return findNearestCity(latitude, longitude);
  } catch (error) {
    console.error('Erro ao obter localização do usuário:', error);
    throw error;
  }
} 