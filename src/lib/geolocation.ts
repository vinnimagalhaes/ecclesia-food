/**
 * Serviço de geolocalização para obter a localização do usuário
 * e converter coordenadas em informações de localidade
 */

// API Key do Mapbox - no ambiente real, deve estar em variáveis de ambiente
const MAPBOX_API_KEY = process.env.NEXT_PUBLIC_MAPBOX_API_KEY || '';

// Log para verificar se a chave está definida (apenas para debug)
if (typeof window !== 'undefined') {
  console.log('Mapbox API Key definida:', MAPBOX_API_KEY ? 'Sim' : 'Não');
}

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
      reject(new Error('Geolocalização não é suportada pelo seu navegador'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => resolve(position),
      error => reject(error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

/**
 * Converte coordenadas em informações de localidade usando a API do Mapbox
 * @param latitude Latitude da posição
 * @param longitude Longitude da posição
 * @returns Promise com os dados de localização (cidade, estado, país)
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<LocationData> {
  try {
    // Verificar se a chave da API está definida
    if (!MAPBOX_API_KEY) {
      throw new Error('Chave da API Mapbox não está configurada');
    }
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_API_KEY}&language=pt-BR&types=place,region,country`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro na API de geocoding: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Processa os dados retornados para extrair cidade, estado e país
    let cidade = '';
    let estado = '';
    let pais = '';
    
    // Mapbox retorna features em ordem de relevância
    for (const feature of data.features) {
      const placeType = feature.place_type[0];
      
      if (placeType === 'place' && !cidade) {
        cidade = feature.text;
      } else if (placeType === 'region' && !estado) {
        estado = feature.text;
      } else if (placeType === 'country' && !pais) {
        pais = feature.text;
      }
    }
    
    return {
      cidade,
      estado,
      pais,
      coordenadas: {
        latitude,
        longitude
      }
    };
  } catch (error) {
    console.error('Erro ao obter localização:', error);
    throw error;
  }
}

/**
 * Função completa que obtém a posição do usuário e converte em dados de localidade
 * @returns Promise com os dados de localização
 */
export async function getUserLocation(): Promise<LocationData> {
  try {
    const position = await getCurrentPosition();
    const { latitude, longitude } = position.coords;
    
    return await reverseGeocode(latitude, longitude);
  } catch (error) {
    console.error('Erro ao obter localização do usuário:', error);
    throw error;
  }
} 