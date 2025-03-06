import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

// Função para criar um produto
export async function POST(req: Request) {
  try {
    console.log('POST /api/produtos - Iniciando');
    
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
    if (!body.nome || !body.preco || !body.eventId) {
      console.log('Campos obrigatórios faltando');
      return NextResponse.json(
        { message: 'Campos obrigatórios faltando (nome, preço e ID do evento)' },
        { status: 400 }
      );
    }

    // Verificar se o evento existe e pertence ao usuário
    const evento = await db.event.findFirst({
      where: {
        id: body.eventId,
        creatorId: session.user.id
      }
    });

    if (!evento) {
      console.log('Evento não encontrado ou não pertence ao usuário');
      return NextResponse.json(
        { message: 'Evento não encontrado ou você não tem permissão' },
        { status: 404 }
      );
    }

    // Criar o produto no banco de dados
    const produto = await db.product.create({
      data: {
        nome: body.nome,
        preco: parseFloat(body.preco),
        descricao: body.descricao || '',
        categoria: body.categoria || null,
        disponivel: true,
        creatorId: session.user.id,
        eventId: body.eventId,
      },
    });
    
    console.log('Produto criado com sucesso:', produto);
    
    // Se houver uma URL de imagem, adicionar a imagem
    if (body.imageUrl) {
      const imagem = await db.productImage.create({
        data: {
          url: body.imageUrl,
          alt: body.nome,
          principal: true,
          productId: produto.id,
        },
      });
      console.log('Imagem adicionada:', imagem);
    }
    
    return NextResponse.json(produto, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Função para listar produtos
export async function GET(req: Request) {
  try {
    console.log('GET /api/produtos - Iniciando');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Obter o evento ID da URL se existir
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    
    // Ensure users can only see their own products
    const where = {
      creatorId: session.user.id,
      ...(eventId ? { eventId } : {})
    };
    
    console.log(`Buscando produtos ${eventId ? 'para o evento ' + eventId : 'de todos os eventos'} do usuário ${session.user.id}`);
    
    // Buscar produtos com suas imagens
    const produtos = await db.product.findMany({
      where,
      include: {
        images: true,
        event: {
          select: {
            nome: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`${produtos.length} produtos encontrados`);
    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 