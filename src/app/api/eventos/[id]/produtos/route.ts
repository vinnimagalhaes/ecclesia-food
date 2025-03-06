import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

export async function GET(
  { params }: { params: { id: string } }
) {
  console.log('Obtendo produtos do evento:', params.id);
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se o evento existe
    const evento = await db.event.findUnique({
      where: { id: params.id },
      include: { creator: true }
    });
    
    if (!evento) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }
    
    // Verificar se o usuário é o criador do evento ou tem permissão para visualizar
    // (No futuro, podemos adicionar roles ou verificações específicas aqui)
    
    // Buscar todos os produtos do evento
    const produtos = await db.product.findMany({
      where: { eventId: params.id },
      include: {
        images: true,
        event: {
          select: {
            nome: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para atualizar um produto específico do evento
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Atualizando produto do evento:', params.id);
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const body = await request.json();
    const { productId, ...productData } = body;
    
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o produto existe e pertence ao evento
    const produto = await db.product.findFirst({
      where: {
        id: productId,
        eventId: params.id
      },
      include: {
        event: {
          include: {
            creator: true
          }
        }
      }
    });
    
    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    
    // Verificar se o usuário é o criador do evento
    if (produto.event.creator.email !== session.user.email) {
      return NextResponse.json({ error: 'Você não tem permissão para editar este produto' }, { status: 403 });
    }
    
    // Atualizar o produto
    await db.product.update({
      where: { id: productId },
      data: {
        nome: productData.nome,
        preco: productData.preco,
        descricao: productData.descricao,
        categoria: productData.categoria,
        disponivel: productData.disponivel
      },
      include: {
        images: true
      }
    });
    
    // Se houver uma nova imagem, atualizar
    if (productData.imageUrl) {
      // Verificar se já existe uma imagem principal
      const imagemExistente = await db.productImage.findFirst({
        where: {
          productId: productId,
          principal: true
        }
      });
      
      if (imagemExistente) {
        // Atualizar a imagem existente
        await db.productImage.update({
          where: { id: imagemExistente.id },
          data: {
            url: productData.imageUrl,
            alt: productData.nome || 'Imagem do produto'
          }
        });
      } else {
        // Criar uma nova imagem
        await db.productImage.create({
          data: {
            url: productData.imageUrl,
            alt: productData.nome || 'Imagem do produto',
            principal: true,
            product: {
              connect: { id: productId }
            }
          }
        });
      }
    }
    
    // Buscar o produto atualizado com as imagens atualizadas
    const produtoFinal = await db.product.findUnique({
      where: { id: productId },
      include: {
        images: true
      }
    });
    
    return NextResponse.json(produtoFinal);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para excluir um produto específico do evento
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('Excluindo produto do evento:', params.id);
  
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter o ID do produto da URL
    const url = new URL(request.url);
    const productId = url.searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json({ error: 'ID do produto é obrigatório' }, { status: 400 });
    }
    
    // Verificar se o produto existe e pertence ao evento
    const produto = await db.product.findFirst({
      where: {
        id: productId,
        eventId: params.id
      },
      include: {
        event: {
          include: {
            creator: true
          }
        }
      }
    });
    
    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    
    // Verificar se o usuário é o criador do evento
    if (produto.event.creator.email !== session.user.email) {
      return NextResponse.json({ error: 'Você não tem permissão para excluir este produto' }, { status: 403 });
    }
    
    // Primeiro excluir todas as imagens do produto
    await db.productImage.deleteMany({
      where: { productId: productId }
    });
    
    // Excluir o produto
    await db.product.delete({
      where: { id: productId }
    });
    
    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 