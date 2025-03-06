import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';
import { withUserAuth, multitenancy } from '@/utils/api-helpers';

// Função simplificada para criar evento
export async function POST(request: Request) {
  return withUserAuth(request, async (userId, req) => {
    try {
      console.log('POST /api/eventos - Iniciando');
      
      // Verificar autenticação
      const session = await getServerSession(authOptions);
      console.log('Session:', JSON.stringify(session, null, 2));
      
      if (!session?.user?.id) {
        console.log('Usuário não autenticado');
        return NextResponse.json(
          { message: 'Usuário não autenticado' },
          { status: 401 }
        );
      }
      
      console.log('Usuário autenticado:', session.user.id);

      // Obter dados do corpo da requisição
      const body = await req.json();
      console.log('Dados recebidos:', body);

      // Verificar campos obrigatórios
      if (!body.nome || !body.local || !body.data || !body.hora || !body.capacidade) {
        console.log('Campos obrigatórios faltando');
        return NextResponse.json(
          { message: 'Campos obrigatórios faltando' },
          { status: 400 }
        );
      }

      // Garantir que capacidade seja um número
      const capacidade = parseInt(body.capacidade);
      if (isNaN(capacidade) || capacidade <= 0) {
        console.log('Capacidade inválida');
        return NextResponse.json(
          { message: 'Capacidade inválida' },
          { status: 400 }
        );
      }

      // Formatar data e hora
      try {
        console.log(`Formatando data: ${body.data} e hora: ${body.hora}`);
        const dataHora = new Date(`${body.data}T${body.hora}`);
        
        if (isNaN(dataHora.getTime())) {
          throw new Error('Data ou hora inválida');
        }
        
        console.log('Data formatada:', dataHora);

        // Criar o evento no banco de dados
        console.log('Criando evento no banco de dados...');
        const evento = await db.event.create({
          data: {
            nome: body.nome,
            local: body.local,
            data: dataHora,
            hora: body.hora,
            capacidade: capacidade,
            descricao: body.descricao || '',
            creatorId: userId,
          },
        });
        
        console.log('Evento criado com sucesso:', evento);
        
        return NextResponse.json(evento, { status: 201 });
      } catch (error) {
        console.error('Erro ao processar data/hora:', error);
        return NextResponse.json(
          { message: 'Data ou hora inválida' },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      return NextResponse.json(
        { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
        { status: 500 }
      );
    }
  });
}

// GET: Listar todos os eventos do usuário atual
export async function GET(request: Request) {
  return withUserAuth(request, async (userId) => {
    try {
      // Usar o helper de multitenancy para garantir que apenas eventos do usuário atual sejam retornados
      const eventos = await multitenancy.events.findMany(userId, {
        orderBy: {
          data: 'desc'
        }
      });
      
      return NextResponse.json(eventos);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar eventos' },
        { status: 500 }
      );
    }
  });
} 