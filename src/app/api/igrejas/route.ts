import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SystemConfig {
  key: string;
  value: string;
  userId: string | null;
  user: {
    id: string;
    name: string | null;
    emailVerified: Date | null;
  } | null;
}

interface IgrejaPerfil {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

export async function GET() {
  const logs: string[] = ['GET /api/igrejas - Iniciando'];
  
  try {
    // Buscar especificamente as configurações de perfil de igreja
    const configs = await db.systemConfig.findMany({
      where: {
        key: 'perfilIgreja'
      },
      select: {
        userId: true,
        key: true,
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
    
    logs.push(`Configurações de igreja encontradas: ${configs.length}`);
    
    // Log detalhado de cada configuração
    configs.forEach((config: SystemConfig, index: number) => {
      logs.push(`\n--- Detalhes da Configuração ${index + 1} ---`);
      logs.push(`UserId: ${config.userId}`);
      logs.push(`Email verificado: ${config.user?.emailVerified}`);
      logs.push(`Nome do usuário: ${config.user?.name}`);
      logs.push(`Valor da configuração: ${config.value}`);
      try {
        const parsedValue = JSON.parse(config.value);
        logs.push(`Valor parseado: ${JSON.stringify(parsedValue, null, 2)}`);
      } catch (e) {
        logs.push(`Erro ao parsear valor: ${e}`);
      }
      logs.push('-----------------------------------');
    });
    
    // Processar e filtrar os perfis
    const igrejas = configs
      .filter((config: SystemConfig) => {
        const isVerified = config.user?.emailVerified;
        if (!isVerified) {
          logs.push(`Usuário ${config.userId} foi filtrado por não estar verificado`);
        }
        return isVerified;
      })
      .map((config: SystemConfig) => {
        try {
          const perfil = JSON.parse(config.value);
          
          const igreja = {
            id: config.userId,
            nome: perfil.nome || config.user?.name || '',
            cidade: perfil.cidade || '',
            estado: perfil.estado || ''
          };
          
          logs.push(`Igreja processada com sucesso: ${JSON.stringify(igreja)}`);
          return igreja;
        } catch (e) {
          logs.push(`Erro ao processar perfil do usuário ${config.userId}: ${e}`);
          return null;
        }
      })
      .filter((igreja): igreja is IgrejaPerfil => {
        if (!igreja) {
          return false;
        }
        const isValid = Boolean(igreja.nome && igreja.cidade);
        if (!isValid) {
          logs.push(`Igreja removida por dados inválidos: ${JSON.stringify(igreja)}`);
        }
        return isValid;
      })
      .sort((a: IgrejaPerfil, b: IgrejaPerfil) => a.nome.localeCompare(b.nome));
    
    logs.push(`\nTotal de igrejas após processamento: ${igrejas.length}`);
    
    // Retornar os logs junto com os dados para debug
    return NextResponse.json({
      logs,
      igrejas,
      debug: {
        configsEncontradas: configs.length,
        igrejasProcessadas: igrejas.length
      }
    });
  } catch (error) {
    logs.push(`Erro ao buscar igrejas: ${error}`);
    return NextResponse.json(
      { error: 'Erro ao buscar igrejas', logs },
      { status: 500 }
    );
  }
} 