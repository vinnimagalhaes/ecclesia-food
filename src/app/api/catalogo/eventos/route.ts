import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SystemConfig {
  userId: string | null;
  value: string;
  user: {
    id: string;
    name: string | null;
    emailVerified: Date | null;
  } | null;
}

interface Evento {
  id: string;
  nome: string;
  local: string;
  data: Date;
  hora: string | null;
  capacidade: number | null;
  descricao: string | null;
  status: string;
  creator: {
    name: string | null;
    image: string | null;
    id: string;
  };
}

// Função para normalizar texto para comparação
function normalizeText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-\s]+/g, ' ')
    .trim();
}

// Função para obter o início do dia atual
function getStartOfDay() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export async function GET(request: Request) {
  const logs: string[] = ['GET /api/catalogo/eventos - Iniciando'];
  
  try {
    const url = new URL(request.url);
    const cidade = url.searchParams.get('cidade');
    const nomeIgreja = url.searchParams.get('igreja');
    
    logs.push(`Parâmetros de busca: cidade=${cidade}, igreja=${nomeIgreja}`);
    
    if (!cidade || !nomeIgreja) {
      logs.push('Cidade ou nome da igreja não fornecidos');
      return NextResponse.json({ logs, eventos: [] });
    }
    
    const cidadeNormalizada = normalizeText(cidade);
    const nomeIgrejaNormalizado = normalizeText(nomeIgreja);
    
    logs.push(`Parâmetros normalizados: cidade="${cidadeNormalizada}", igreja="${nomeIgrejaNormalizado}"`);
    
    // Construir a consulta base
    const startOfToday = getStartOfDay();
    logs.push(`Buscando eventos a partir de: ${startOfToday.toISOString()}`);

    const whereClause: any = {
      status: 'ATIVO',
      data: {
        gte: startOfToday // Inclui eventos de hoje
      },
      creator: {
        emailVerified: {
          not: null // Apenas eventos de usuários verificados
        }
      }
    };
    
    logs.push(`Buscando eventos com status ATIVO e data >= hoje`);
    
    // Buscar todas as configurações de igreja
    const configs = await db.systemConfig.findMany({
      where: {
        key: 'perfilIgreja'
      },
      select: {
        userId: true,
        value: true,
        user: {
          select: {
            id: true,
            name: true,
            emailVerified: true
          }
        }
      }
    });
    
    logs.push(`Total de configurações encontradas: ${configs.length}`);
    
    // Filtrar configurações que correspondam à cidade e igreja
    const usuariosIds = configs
      .filter((config: SystemConfig) => {
        try {
          const perfil = JSON.parse(config.value);
          const perfilCidade = normalizeText(perfil.cidade || '');
          const perfilNome = normalizeText(perfil.nome || '');
          
          logs.push(`Comparando: "${perfilCidade}" com "${cidadeNormalizada}"`);
          logs.push(`Comparando: "${perfilNome}" com "${nomeIgrejaNormalizado}"`);
          
          const cidadeMatch = perfilCidade === cidadeNormalizada;
          const nomeMatch = perfilNome === nomeIgrejaNormalizado;
          
          if (cidadeMatch && nomeMatch) {
            logs.push(`Encontrada correspondência para usuário ${config.userId}`);
          }
          
          return cidadeMatch && nomeMatch && config.user?.emailVerified;
        } catch (e) {
          logs.push(`Erro ao parsear perfil: ${e}`);
          return false;
        }
      })
      .map((config: SystemConfig) => config.userId);
    
    logs.push(`Usuários correspondentes encontrados: ${usuariosIds.join(', ')}`);
    
    if (usuariosIds.length === 0) {
      logs.push('Nenhum usuário correspondente encontrado, retornando array vazio');
      return NextResponse.json({ logs, eventos: [] });
    }
    
    whereClause.creatorId = {
      in: usuariosIds
    };
    
    // Buscar eventos com os filtros aplicados
    const eventos = await db.event.findMany({
      where: whereClause,
      select: {
        id: true,
        nome: true,
        local: true,
        data: true,
        hora: true,
        capacidade: true,
        descricao: true,
        status: true,
        creator: {
          select: {
            name: true,
            image: true,
            id: true
          }
        }
      },
      orderBy: {
        data: 'asc'
      }
    });
    
    logs.push(`${eventos.length} eventos encontrados`);
    if (eventos.length > 0) {
      logs.push('Eventos encontrados:');
      eventos.forEach((evento: Evento) => {
        logs.push(`- ${evento.nome} (${evento.data.toISOString()}, ${evento.status})`);
      });
    }
    
    return NextResponse.json({ logs, eventos });
  } catch (error) {
    logs.push(`Erro ao buscar eventos: ${error}`);
    return NextResponse.json(
      { error: 'Erro ao buscar eventos', logs },
      { status: 500 }
    );
  }
} 