import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const logs: string[] = [`GET /api/igrejas/${params.userId} - Iniciando`];
  
  try {
    // Buscar igreja pelo userId
    const igreja = await db.church.findUnique({
      where: {
        userId: params.userId
      }
    });
    
    logs.push(`Igreja encontrada: ${igreja ? 'Sim' : 'Não'}`);
    
    if (!igreja) {
      return NextResponse.json({ error: 'Igreja não encontrada', logs }, { status: 404 });
    }
    
    // Transformar o resultado no formato esperado
    const igrejaPerfil = {
      id: igreja.userId,
      nome: igreja.name,
      cidade: igreja.city,
      estado: igreja.state,
      endereco: igreja.address,
      telefone: igreja.phone || '',
      descricao: igreja.description || ''
    };
    
    return NextResponse.json({ logs, igreja: igrejaPerfil });
  } catch (error) {
    logs.push(`Erro ao buscar igreja: ${error}`);
    return NextResponse.json({ error: 'Erro ao buscar igreja', logs }, { status: 500 });
  }
} 