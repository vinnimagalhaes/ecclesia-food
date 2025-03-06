'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  categoria?: string;
  disponivel: boolean;
  createdAt: string;
  eventId: string;
  images?: {
    id: string;
    url: string;
    alt?: string;
  }[];
}

export default function DetalhesProdutoPage({ 
  params 
}: { 
  params: { id: string; produtoId: string } 
}) {
  const router = useRouter();
  const { status } = useSession();
  const [produto, setProduto] = useState<Produto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/eventos/${params.id}/produtos/${params.produtoId}`);
    } else if (status === 'authenticated') {
      fetchProduto();
    }
  }, [status, params.id, params.produtoId, router]);

  const fetchProduto = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/produtos/${params.produtoId}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar produto');
      }
      
      const data = await response.json();
      setProduto(data);
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      toast.error('Não foi possível carregar os detalhes do produto');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/produtos/${params.produtoId}?eventId=${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao excluir produto');
      }

      toast.success('Produto excluído com sucesso');
      router.push(`/eventos/${params.id}`);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Não foi possível excluir o produto');
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!produto) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.push(`/eventos/${params.id}`)} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar para o evento
          </button>
        </div>
        <div className="bg-red-50 text-red-600 p-6 rounded-lg text-center">
          Produto não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => router.push(`/eventos/${params.id}`)} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2" size={16} />
          Voltar para o evento
        </button>

        <div className="flex gap-2">
          <Link
            href={`/eventos/${params.id}/produtos/${params.produtoId}/editar`}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
          >
            <Edit size={16} />
            Editar
          </Link>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
          >
            {isDeleting ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-red-600 border-r-2 border-red-600 border-b-2 border-transparent"></span>
            ) : (
              <Trash2 size={16} />
            )}
            Excluir
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        {/* Imagem do produto */}
        <div className="relative h-64 bg-gray-100">
          {produto.images && produto.images.length > 0 ? (
            <Image 
              src={produto.images[0].url} 
              alt={produto.nome}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <ShoppingBag size={64} />
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Cabeçalho */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h1 className="text-2xl font-bold mb-2 sm:mb-0">{produto.nome}</h1>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xl font-semibold text-primary-600">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${produto.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {produto.disponivel ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>

          {/* Categoria */}
          {produto.categoria && (
            <div className="mb-4">
              <span className="text-xs uppercase tracking-wider bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {produto.categoria}
              </span>
            </div>
          )}

          {/* Descrição */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Descrição</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {produto.descricao || 'Nenhuma descrição fornecida.'}
            </p>
          </div>

          {/* Metadados */}
          <div className="text-sm text-gray-500 mt-6 pt-4 border-t border-gray-100">
            Adicionado em: {new Date(produto.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  );
} 