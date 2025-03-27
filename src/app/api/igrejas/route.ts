import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const prisma = new PrismaClient();

interface IgrejaPerfil {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
}

export async function GET() {
  const logs: string[] = ['GET /api/igrejas - Iniciando'];
  
  try {
    console.log('Buscando todas as igrejas...');
    
    const igrejas = await prisma.church.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        state: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log('Igrejas encontradas:', igrejas);
    
    // Mapear os campos para o formato esperado pelo frontend
    const igrejasProcessadas = igrejas.map(igreja => ({
      id: igreja.id,
      nome: igreja.name,
      cidade: igreja.city,
      estado: igreja.state
    }));
    
    logs.push(`\nTotal de igrejas após processamento: ${igrejasProcessadas.length}`);
    
    // Adicionar cabeçalhos para evitar cache em todas as camadas
    const headers = new Headers();
    headers.append('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    headers.append('Pragma', 'no-cache');
    headers.append('Expires', '0');
    
    // Retornar os logs junto com os dados para debug
    return NextResponse.json(
      {
        logs,
        igrejas: igrejasProcessadas,
        debug: {
          igrejasEncontradas: igrejas.length,
          igrejasProcessadas: igrejasProcessadas.length,
          timestamp: new Date().toISOString()
        }
      },
      { headers }
    );
  } catch (error) {
    console.error('Erro ao buscar igrejas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar igrejas' },
      { status: 500 }
    );
  }
} 