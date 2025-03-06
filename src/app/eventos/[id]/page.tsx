'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock, ArrowLeft, Edit, PlusCircle, Package, Link2 } from 'lucide-react';
import { toast } from 'sonner';

interface Evento {
  id: string;
  nome: string;
  data: string;
  local: string;
  descricao: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface PerfilIgreja {
  nome: string;
  cidade: string;
}

interface Imagem {
  id: string;
  url: string;
  productId: string;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  descricao: string;
  eventId: string;
  disponivel: boolean;
  images?: Imagem[];
}

export default function DetalhesEventoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [perfilIgreja, setPerfilIgreja] = useState<PerfilIgreja | null>(null);

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/eventos/' + params.id);
    } else if (status === 'authenticated') {
      fetchEvento();
      fetchProdutos();
    }
  }, [params.id, router, status]);

  const fetchEvento = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/eventos/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar evento');
      }
      
      const data = await response.json();
      setEvento(data);
      
      // Buscar perfil da igreja do criador
      try {
        const configResponse = await fetch(`/api/usuarios/${data.creator.id}/config?key=perfilIgreja`);
        const configData = await configResponse.json();
        
        if (configResponse.ok && configData.value) {
          const perfilParsed = JSON.parse(configData.value);
          if (perfilParsed.nome && perfilParsed.cidade) {
            setPerfilIgreja({
              nome: perfilParsed.nome,
              cidade: perfilParsed.cidade
            });
          }
        }
      } catch (configError) {
        console.error('Erro ao carregar perfil da igreja:', configError);
        // Não definimos error state aqui para manter a página utilizável mesmo sem o link
      }
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      setError('Não foi possível carregar os detalhes do evento.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProdutos = async () => {
    try {
      const response = await fetch(`/api/eventos/${params.id}/produtos`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar produtos');
      }
      
      const data = await response.json();
      console.log('Produtos carregados:', data);
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      // Não definimos error state aqui para manter a página utilizável mesmo sem produtos
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </button>
        </div>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  if (!evento) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </button>
        </div>
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          Evento não encontrado
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => router.push('/eventos')} 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2" size={16} />
          Voltar para eventos
        </button>
        <div className="flex gap-2">
          <Link 
            href={`/eventos/${params.id}/editar`}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
          >
            <Edit size={16} />
            Editar Evento
          </Link>
          {perfilIgreja?.cidade && perfilIgreja?.nome && (
            <Link 
              href={`/catalogo/igrejas/${perfilIgreja.cidade.toLowerCase().replace(/\s+/g, '-')}/${perfilIgreja.nome.toLowerCase().replace(/\s+/g, '-')}/eventos/${params.id}`}
              target="_blank"
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition"
            >
              <Link2 size={16} />
              Link do Evento
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <h1 className="text-2xl font-bold mb-4">{evento.nome}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center text-gray-700">
            <Calendar size={18} className="mr-2 text-primary-600" />
            <span>{new Date(evento.data).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <Clock size={18} className="mr-2 text-primary-600" />
            <span>{new Date(evento.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center text-gray-700">
            <MapPin size={18} className="mr-2 text-primary-600" />
            <span>{evento.local}</span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Descrição</h2>
          <div className="text-gray-700 whitespace-pre-line">{evento.descricao}</div>
        </div>

        <div className="text-sm text-gray-500">
          Criado em: {new Date(evento.createdAt).toLocaleDateString('pt-BR')}
          {evento.updatedAt && evento.updatedAt !== evento.createdAt && 
            ` · Atualizado em: ${new Date(evento.updatedAt).toLocaleDateString('pt-BR')}`}
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Produtos do Evento</h2>
        <Link 
          href={`/eventos/${params.id}/produtos/novo`}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <PlusCircle size={16} />
          Novo Produto
        </Link>
      </div>

      {produtos.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <Package size={40} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-4">Nenhum produto cadastrado para este evento.</p>
          <Link 
            href={`/eventos/${params.id}/produtos/novo`} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <PlusCircle size={16} />
            Adicionar Produto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {produtos.map((produto) => (
            <div key={produto.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="relative h-40 bg-gray-200">
                {produto.images && produto.images.length > 0 ? (
                  <Image 
                    src={produto.images[0].url} 
                    alt={produto.nome}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <Package size={40} />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="text-lg font-semibold">{produto.nome}</h3>
                  <span className="font-medium text-primary-600">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.preco)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{produto.descricao}</p>
                <div className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${produto.disponivel ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {produto.disponivel ? 'Disponível' : 'Indisponível'}
                  </span>
                  <Link 
                    href={`/eventos/${params.id}/produtos/${produto.id}`}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Ver detalhes
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 