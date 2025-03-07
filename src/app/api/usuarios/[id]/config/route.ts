import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET: Obter configuração específica de um usuário
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');
    const userId = params.id;

    console.log(`GET /api/usuarios/${userId}/config - key: ${key}`);

    if (!key) {
      return NextResponse.json(
        { error: 'Parâmetro key é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar a configuração específica
    const config = await db.systemConfig.findFirst({
      where: {
        userId: userId,
        key: key
      }
    });

    // Se a configuração for perfilIgreja, também buscar do modelo Church
    if (key === 'perfilIgreja') {
      try {
        // Buscar o perfil da igreja do modelo Church
        const churchProfile = await db.church.findUnique({
          where: { userId }
        });

        console.log(`Perfil da igreja para usuário ${userId}:`, churchProfile);
        
        if (churchProfile) {
          // Se tiver ambos (config e churchProfile), mesclar os dados
          if (config) {
            try {
              const perfilConfig = JSON.parse(config.value);
              // Priorizar dados do modelo Church se existirem
              const perfilCompleto = {
                ...perfilConfig,
                nome: churchProfile.name || perfilConfig.nome || '',
                endereco: churchProfile.address || perfilConfig.endereco || '',
                cidade: churchProfile.city || perfilConfig.cidade || '',
                estado: churchProfile.state || perfilConfig.estado || '', 
                telefone: churchProfile.phone || perfilConfig.telefone || ''
              };
              
              return NextResponse.json({ 
                value: JSON.stringify(perfilCompleto)
              });
            } catch (e) {
              console.error(`Erro ao parsear configuração:`, e);
            }
          } 
          
          // Se não tiver config, usar apenas os dados do modelo Church
          return NextResponse.json({
            value: JSON.stringify({
              nome: churchProfile.name || '',
              endereco: churchProfile.address || '',
              cidade: churchProfile.city || '',
              estado: churchProfile.state || '',
              telefone: churchProfile.phone || ''
            })
          });
        }
      } catch (e) {
        console.error(`Erro ao buscar perfil da igreja:`, e);
      }
    }

    // Se não encontrou ou não é perfilIgreja, retorna o valor original
    if (config) {
      return NextResponse.json({ value: config.value });
    }

    return NextResponse.json({ value: null });
  } catch (error) {
    console.error('Erro ao buscar configuração:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configuração' },
      { status: 500 }
    );
  }
} 