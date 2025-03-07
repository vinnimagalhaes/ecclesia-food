import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface IgrejaPerfil {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

export async function GET() {
  const logs: string[] = ['GET /api/igrejas - Iniciando'];
  
  try {
    // Buscar diretamente do modelo Church em vez de SystemConfig
    const igrejas = await db.church.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
        userId: true,
        user: {
          select: {
            id: true,
            emailVerified: true
          }
        }
      }
    });
    
    logs.push(`Igrejas encontradas: ${igrejas.length}`);
    
    // Processar e filtrar os perfis
    const igrejasProcessadas = igrejas
      .filter((igreja) => {
        const isVerified = igreja.user?.emailVerified;
        if (!isVerified) {
          logs.push(`Igreja ${igreja.id} foi filtrada por não estar verificada`);
        }
        return isVerified;
      })
      .map((igreja): IgrejaPerfil => {
        return {
          id: igreja.userId,
          nome: igreja.name,
          cidade: igreja.city,
          estado: igreja.state
        };
      })
      .filter((igreja): igreja is IgrejaPerfil => {
        const isValid = Boolean(igreja.nome && igreja.cidade);
        if (!isValid) {
          logs.push(`Igreja removida por dados inválidos: ${JSON.stringify(igreja)}`);
        }
        return isValid;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
    
    logs.push(`\nTotal de igrejas após processamento: ${igrejasProcessadas.length}`);
    
    // Retornar os logs junto com os dados para debug
    return NextResponse.json({
      logs,
      igrejas: igrejasProcessadas,
      debug: {
        igrejasEncontradas: igrejas.length,
        igrejasProcessadas: igrejasProcessadas.length
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