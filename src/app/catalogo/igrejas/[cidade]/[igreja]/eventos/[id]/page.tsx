'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, Users, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/ui/AppHeader';
import { AppIconLocation } from '@/components/ui/AppIconLocation';

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

type ProdutosPorCategoria = {
  [categoria: string]: Produto[];
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
  const [produtosPorCategoria, setProdutosPorCategoria] = useState<ProdutosPorCategoria>({});
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [quantidades, setQuantidades] = useState<Record<string, number>>({});
  const [nomeIgreja, setNomeIgreja] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('');

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
        
        // Buscar perfil da igreja do criador
        try {
          const configResponse = await fetch(`/api/usuarios/${eventoData.creator.id}/config?key=perfilIgreja`);
          const configData = await configResponse.json();
          
          if (configResponse.ok && configData.value) {
            const perfilParsed = JSON.parse(configData.value);
            if (perfilParsed.nome) {
              // Usar o nome da igreja do perfil
              setNomeIgreja(perfilParsed.nome);
            } else {
              // Fallback para o nome do criador se não encontrar nome da igreja
              setNomeIgreja(eventoData.creator.name);
            }
          } else {
            // Fallback para o nome do criador se não encontrar configuração
            setNomeIgreja(eventoData.creator.name);
          }
        } catch (configError) {
          console.error('Erro ao carregar perfil da igreja:', configError);
          // Fallback para o nome do criador se ocorrer erro
          setNomeIgreja(eventoData.creator.name);
        }
        
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
        
        // Agrupar produtos por categoria
        const produtosPorCat: ProdutosPorCategoria = {};
        const listaCategorias = new Set<string>();
        
        produtosDisponiveis.forEach((produto: Produto) => {
          // Se não tiver categoria, usar "Sem categoria"
          const categoria = produto.categoria?.trim() || "Outros";
          
          if (!produtosPorCat[categoria]) {
            produtosPorCat[categoria] = [];
          }
          
          produtosPorCat[categoria].push(produto);
          listaCategorias.add(categoria);
        });
        
        // Ordenar categorias (colocando "Outros" por último)
        const categoriasOrdenadas = Array.from(listaCategorias).sort((a, b) => {
          if (a === "Outros") return 1;
          if (b === "Outros") return -1;
          return a.localeCompare(b);
        });
        
        setProdutosPorCategoria(produtosPorCat);
        setCategorias(categoriasOrdenadas);
        
        // Definir categoria ativa inicial 
        if (categoriasOrdenadas.length > 0) {
          setCategoriaAtiva(categoriasOrdenadas[0]);
        }
        
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

  // Função para calcular o total de itens no carrinho
  function calcularTotalItens() {
    return carrinho.reduce((total, item) => total + item.quantidade, 0);
  }

  // Função para calcular o total em valor do carrinho
  function calcularTotalValor() {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Carregando produtos...</p>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error || 'Evento não encontrado'}</p>
            </div>
          </div>
          <Link href={`/catalogo/igrejas/${params.cidade}/${params.igreja}`}>
            <Button variant="primary" className="mt-4 w-full">
              Voltar para Eventos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 overflow-hidden pb-24">
      {/* Cabeçalho Fixo */}
      <AppHeader
        title={evento.nome}
        subtitle={nomeIgreja}
        showBackButton={true}
        backUrl={`/catalogo/igrejas/${params.cidade}/${params.igreja}`}
        sticky={true}
      />

      {/* Informações do Evento */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} className="flex-shrink-0 text-primary-500" />
              <span>{formatarData(evento.data.toString())}</span>
            </div>
            
            <div className="flex items-center gap-2 text-gray-600">
              <Clock size={16} className="flex-shrink-0 text-primary-500" />
              <span>{evento.hora}</span>
            </div>
            
            <AppIconLocation 
              location={evento.local}
              iconSize={16}
              className="text-gray-600"
            />
            
            <div className="flex items-center gap-2 text-gray-600">
              <Users size={16} className="flex-shrink-0 text-primary-500" />
              <span>Capacidade: {evento.capacidade} pessoas</span>
            </div>
          </div>
          
          {evento.descricao && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-gray-600 text-sm">{evento.descricao}</p>
            </div>
          )}
        </div>

        {/* Navegação por Categorias */}
        {categorias.length > 0 && (
          <div className="mb-4 -mx-4 px-4 overflow-x-auto">
            <div className="flex space-x-2 pb-2">
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  onClick={() => setCategoriaAtiva(categoria)}
                  className={`py-2 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    categoriaAtiva === categoria
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lista de produtos por categoria */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {categoriaAtiva ? categoriaAtiva : 'Produtos Disponíveis'}
        </h2>
        
        {produtos.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum produto disponível</h3>
            <p className="text-gray-600">Este evento ainda não possui produtos cadastrados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categoriaAtiva && produtosPorCategoria[categoriaAtiva] && (
              <div className="grid grid-cols-1 gap-3">
                {produtosPorCategoria[categoriaAtiva].map((produto) => {
                  const imagemPrincipal = produto.images.find(img => img.principal);
                  
                  return (
                    <div key={produto.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex">
                      {imagemPrincipal && (
                        <div className="relative h-24 w-24 flex-shrink-0">
                          <Image
                            src={imagemPrincipal.url}
                            alt={imagemPrincipal.alt || produto.nome}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 96px, 96px"
                            priority={true}
                            quality={75}
                          />
                        </div>
                      )}
                      
                      <div className="p-3 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                          <h3 className="text-base font-medium text-gray-900">{produto.nome}</h3>
                          <span className="font-medium text-primary-500">{formatarPreco(produto.preco)}</span>
                        </div>
                        
                        {produto.descricao && (
                          <p className="text-gray-600 text-xs mt-1 line-clamp-2">{produto.descricao}</p>
                        )}
                        
                        <div className="flex items-center justify-end mt-auto pt-2">
                          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                            <button 
                              onClick={() => alterarQuantidade(produto.id, produto, -1)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="px-3 py-1 text-sm">{quantidades[produto.id] || 0}</span>
                            <button 
                              onClick={() => alterarQuantidade(produto.id, produto, 1)}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 transition"
                            >
                              <Plus size={14} />
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
        )}
      </div>

      {/* Rodapé fixo do carrinho */}
      {calcularTotalItens() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-600">
                {calcularTotalItens()} {calcularTotalItens() === 1 ? 'item' : 'itens'} no carrinho
              </div>
              <div className="font-bold text-primary-600">
                {formatarPreco(calcularTotalValor())}
              </div>
            </div>
            <Link href="/carrinho">
              <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                <ShoppingCart size={18} />
                <span>Finalizar Pedido</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
} 