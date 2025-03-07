'use client';

import { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Users, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

// Tipos
type Evento = {
  id: string;
  nome: string;
  local: string;
  data: Date;
  hora: string;
  capacidade: number;
  descricao?: string;
  status: string;
  creator: {
    name: string;
    image?: string;
    id: string;
  };
};

type Produto = {
  id: string;
  nome: string;
  preco: number;
  descricao?: string;
  categoria?: string;
  disponivel: boolean;
  images: {
    id: string;
    url: string;
    alt?: string;
    principal: boolean;
  }[];
};

type ItemCarrinho = {
  produtoId: string;
  quantidade: number;
  nome: string;
  preco: number;
  imagem?: string;
  eventId: string;
};

export default function EventoDetalhesPage({ 
  params 
}: { 
  params: { 
    cidade: string;
    igreja: string;
    id: string;
  } 
}) {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});

  // Efeito para carregar o evento e produtos
  useEffect(() => {
    async function fetchEventoEProdutos() {
      try {
        setLoading(true);
        setError('');
        
        console.log('Buscando dados do evento:', params.id);
        
        // Buscar evento
        const eventoResponse = await fetch(`/api/catalogo/eventos/${params.id}`);
        const eventoData = await eventoResponse.json();
        
        if (!eventoResponse.ok) {
          console.error('Erro na resposta do evento:', eventoData);
          throw new Error(eventoData.error || 'Falha ao carregar evento');
        }
        
        console.log('Dados do evento recebidos:', eventoData);
        setEvento(eventoData);
        
        // Buscar produtos do evento
        const produtosResponse = await fetch(`/api/catalogo/eventos/${params.id}/produtos`);
        const produtosData = await produtosResponse.json();
        
        if (!produtosResponse.ok) {
          console.error('Erro na resposta dos produtos:', produtosData);
          throw new Error(produtosData.error || 'Falha ao carregar produtos');
        }
        
        console.log('Dados dos produtos recebidos:', produtosData);
        
        // Filtrar apenas produtos disponíveis
        const produtosDisponiveis = produtosData.filter((produto: Produto) => produto.disponivel);
        setProdutos(produtosDisponiveis);
        
        // Inicializar quantidades
        const quantidadesIniciais: Record<string, number> = {};
        produtosDisponiveis.forEach((produto: Produto) => {
          quantidadesIniciais[produto.id] = 0;
        });
        setQuantidades(quantidadesIniciais);
        
        // Carregar carrinho do localStorage
        const carrinhoSalvo = localStorage.getItem('carrinho');
        if (carrinhoSalvo) {
          const carrinhoParseado = JSON.parse(carrinhoSalvo);
          setCarrinho(carrinhoParseado);
          
          // Atualizar quantidades com itens do carrinho
          carrinhoParseado.forEach((item: ItemCarrinho) => {
            if (item.eventId === params.id) {
              quantidadesIniciais[item.produtoId] = item.quantidade;
            }
          });
          setQuantidades(quantidadesIniciais);
        }
      } catch (err) {
        console.error('Erro detalhado ao carregar dados:', err);
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados. Tente novamente.');
        setEvento(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEventoEProdutos();
  }, [params.id]);

  // Função para formatar data
  function formatarData(dataString: string) {
    try {
      const data = new Date(dataString);
      return data.toLocaleDateString('pt-BR');
    } catch {
      return 'Data inválida';
    }
  }
  
  // Função para formatar preço
  function formatarPreco(preco: number) {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  // Função para alterar quantidade
  function alterarQuantidade(produtoId: string, produto: Produto, delta: number) {
    setQuantidades(prev => {
      const novaQuantidade = Math.max(0, (prev[produtoId] || 0) + delta);
      
      // Atualizar carrinho automaticamente
      const novoCarrinho = [...carrinho];
      const itemIndex = novoCarrinho.findIndex(item => item.produtoId === produtoId && item.eventId === params.id);
      
      if (novaQuantidade === 0 && itemIndex >= 0) {
        // Remover item se quantidade for zero
        novoCarrinho.splice(itemIndex, 1);
      } else if (novaQuantidade > 0) {
        if (itemIndex >= 0) {
          // Atualizar quantidade se já existe
          novoCarrinho[itemIndex].quantidade = novaQuantidade;
        } else {
          // Adicionar novo item
          novoCarrinho.push({
            produtoId: produto.id,
            quantidade: novaQuantidade,
            nome: produto.nome,
            preco: produto.preco,
            imagem: produto.images.find(img => img.principal)?.url,
            eventId: params.id
          });
        }
      }
      
      // Salvar no localStorage e atualizar estado
      localStorage.setItem('carrinho', JSON.stringify(novoCarrinho));
      setCarrinho(novoCarrinho);
      
      return { ...prev, [produtoId]: novaQuantidade };
    });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-500">Carregando...</div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-md">
        <h2 className="text-lg font-medium mb-2">Erro</h2>
        <p>{error || 'Evento não encontrado'}</p>
        <Link href={`/catalogo/igrejas/${params.cidade}/${params.igreja}`}>
          <Button variant="primary" className="mt-4">
            Voltar para Eventos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho do evento */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{evento.nome}</h1>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2 text-gray-600">
                <Calendar size={18} className="mt-1 flex-shrink-0" />
                <span>{formatarData(evento.data.toString())}</span>
              </div>
              
              <div className="flex items-start gap-2 text-gray-600">
                <Clock size={18} className="mt-1 flex-shrink-0" />
                <span>{evento.hora}</span>
              </div>
              
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <span>{evento.local}</span>
              </div>
              
              <div className="flex items-start gap-2 text-gray-600">
                <Users size={18} className="mt-1 flex-shrink-0" />
                <span>Capacidade: {evento.capacidade} pessoas</span>
              </div>
            </div>
          </div>
        </div>

        {evento.descricao && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Sobre o Evento</h2>
            <p className="text-gray-600">{evento.descricao}</p>
          </div>
        )}
      </div>

      {/* Lista de produtos */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Produtos Disponíveis</h2>
        
        {produtos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-600">Este evento ainda não possui produtos cadastrados.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {produtos.map((produto) => {
              const imagemPrincipal = produto.images.find(img => img.principal);
              
              return (
                <div key={produto.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {imagemPrincipal && (
                    <div className="relative h-48 w-full">
                      <Image
                        src={imagemPrincipal.url}
                        alt={imagemPrincipal.alt || produto.nome}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={true}
                        quality={75}
                        loading="eager"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{produto.nome}</h3>
                      <span className="font-medium text-primary-500">{formatarPreco(produto.preco)}</span>
                    </div>
                    
                    {produto.descricao && (
                      <p className="text-gray-600 text-sm mb-4">{produto.descricao}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <button 
                          onClick={() => alterarQuantidade(produto.id, produto, -1)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="px-4 py-1">{quantidades[produto.id] || 0}</span>
                        <button 
                          onClick={() => alterarQuantidade(produto.id, produto, 1)}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rodapé fixo do carrinho */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="container-app py-4">
          <Link href="/carrinho">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <ShoppingCart size={18} />
              <span>
                {carrinho.length > 0 
                  ? `Ver Carrinho (${carrinho.reduce((total, item) => total + item.quantidade, 0)} itens)`
                  : 'Carrinho Vazio'}
              </span>
              {carrinho.length > 0 && (
                <span className="bg-white text-primary-500 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                  {carrinho.reduce((total, item) => total + item.quantidade, 0)}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 