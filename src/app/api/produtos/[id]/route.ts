import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';

// Função para obter um produto específico
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/produtos/${params.id} - Iniciando`);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Buscar o produto com suas imagens
    const produto = await db.product.findUnique({
      where: {
        id: params.id
      },
      include: {
        images: true,
        event: {
          select: {
            id: true,
            nome: true,
            creatorId: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    if (!produto) {
      console.log('Produto não encontrado');
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Produto encontrado:', produto.id);
    return NextResponse.json(produto);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para atualizar um produto
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PUT /api/produtos/${params.id} - Iniciando`);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Obter dados do corpo da requisição
    const body = await req.json();
    console.log('Dados recebidos:', body);
    
    // Verificar se o produto existe
    const produto = await db.product.findUnique({
      where: {
        id: params.id
      },
      include: {
        event: true
      }
    });
    
    if (!produto) {
      console.log('Produto não encontrado');
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o criador do evento ou do produto
    if (produto.creatorId !== session.user.id && produto.event.creatorId !== session.user.id) {
      console.log('Usuário não autorizado a editar este produto');
      return NextResponse.json(
        { message: 'Você não tem permissão para editar este produto' },
        { status: 403 }
      );
    }
    
    // Atualizar o produto
    await db.product.update({
      where: {
        id: params.id
      },
      data: {
        nome: body.nome,
        preco: parseFloat(body.preco),
        descricao: body.descricao,
        categoria: body.categoria,
        disponivel: body.disponivel
      },
      include: {
        images: true
      }
    });
    
    // Atualizar ou adicionar imagem se necessário
    if (body.imageUrl) {
      const imagemExistente = await db.productImage.findFirst({
        where: {
          productId: params.id
        }
      });
      
      if (imagemExistente) {
        // Atualizar imagem existente
        await db.productImage.update({
          where: {
            id: imagemExistente.id
          },
          data: {
            url: body.imageUrl,
            alt: body.nome
          }
        });
      } else {
        // Criar nova imagem
        await db.productImage.create({
          data: {
            url: body.imageUrl,
            alt: body.nome,
            principal: true,
            productId: params.id
          }
        });
      }
    }
    
    // Buscar o produto atualizado com as imagens
    const produtoFinal = await db.product.findUnique({
      where: {
        id: params.id
      },
      include: {
        images: true
      }
    });
    
    console.log('Produto atualizado com sucesso');
    return NextResponse.json(produtoFinal);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// Função para excluir um produto
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/produtos/${params.id} - Iniciando`);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar se o produto existe
    const produto = await db.product.findUnique({
      where: {
        id: params.id
      },
      include: {
        event: true
      }
    });
    
    if (!produto) {
      console.log('Produto não encontrado');
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o usuário é o criador do evento ou do produto
    if (produto.creatorId !== session.user.id && produto.event.creatorId !== session.user.id) {
      console.log('Usuário não autorizado a excluir este produto');
      return NextResponse.json(
        { message: 'Você não tem permissão para excluir este produto' },
        { status: 403 }
      );
    }
    
    // Primeiro excluir todas as imagens do produto
    await db.productImage.deleteMany({
      where: {
        productId: params.id
      }
    });
    
    // Excluir o produto
    await db.product.delete({
      where: {
        id: params.id
      }
    });
    
    console.log('Produto excluído com sucesso');
    return NextResponse.json({ message: 'Produto excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 