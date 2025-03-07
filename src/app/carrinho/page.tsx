'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { AppHeader } from '@/components/ui/AppHeader';

// Tipos
type ItemCarrinho = {
  produtoId: string;
  quantidade: number;
  nome: string;
  preco: number;
  imagem?: string;
  eventId: string;
};

export default function CarrinhoPage() {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Carregar carrinho do localStorage
  useEffect(() => {
    try {
      setLoading(true);
      const carrinhoSalvo = localStorage.getItem('carrinho');
      
      if (carrinhoSalvo) {
        const carrinhoParseado = JSON.parse(carrinhoSalvo);
        setItens(carrinhoParseado);
        setLoading(false);
      } else {
        setItens([]);
        setLoading(false);
      }
    } catch (err) {
      console.error('Erro ao carregar carrinho:', err);
      setError('Não foi possível carregar o carrinho. Tente novamente.');
      setLoading(false);
    }
  }, []);

  // Função para formatar preço
  function formatarPreco(preco: number) {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  // Função para alterar quantidade
  function alterarQuantidade(index: number, delta: number) {
    const novoItens = [...itens];
    const novaQuantidade = Math.max(1, novoItens[index].quantidade + delta);
    novoItens[index].quantidade = novaQuantidade;
    
    localStorage.setItem('carrinho', JSON.stringify(novoItens));
    setItens(novoItens);
  }
  
  // Função para remover item
  function removerItem(index: number) {
    const novoItens = [...itens];
    novoItens.splice(index, 1);
    
    localStorage.setItem('carrinho', JSON.stringify(novoItens));
    setItens(novoItens);
  }
  
  // Calcular total do carrinho
  const total = itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  
  // Agrupar itens por evento
  const itensPorEvento: Record<string, ItemCarrinho[]> = {};
  itens.forEach((item) => {
    if (!itensPorEvento[item.eventId]) {
      itensPorEvento[item.eventId] = [];
    }
    itensPorEvento[item.eventId].push(item);
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Carregando seu carrinho...</p>
      </div>
    );
  }

  if (error) {
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
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
          <Link href="/catalogo/eventos">
            <Button variant="primary" className="mt-4 w-full">
              Voltar para Eventos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <AppHeader
        title="Seu Carrinho"
        showBackButton={true}
        backUrl="/catalogo/igrejas"
        sticky={true}
      />

      {/* Conteúdo */}
      <div className="flex-1 p-4 pb-24">
        {itens.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center mt-4">
            <div className="flex justify-center mb-4">
              <ShoppingBag size={64} className="text-gray-300" />
            </div>
            <h2 className="text-xl font-medium text-gray-900 mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-600 mb-6">Adicione produtos aos eventos disponíveis para continuar.</p>
            <Link href="/catalogo/eventos">
              <Button variant="primary" className="w-full">
                Ver Eventos Disponíveis
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-2 bg-white shadow-sm rounded-xl">
              {/* Itens do carrinho agrupados por evento */}
              {Object.entries(itensPorEvento).map(([eventId, itensDoEvento]) => (
                <div key={eventId} className="border-b border-gray-100 last:border-b-0">
                  <div className="divide-y divide-gray-100">
                    {itensDoEvento.map((item) => {
                      const itemIndex = itens.findIndex(i => 
                        i.produtoId === item.produtoId && i.eventId === item.eventId
                      );
                      
                      return (
                        <div key={item.produtoId} className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Imagem do produto */}
                            <div className="w-20 h-20 relative flex-shrink-0">
                              {item.imagem ? (
                                <Image
                                  src={item.imagem}
                                  alt={item.nome}
                                  fill
                                  className="object-cover rounded-md"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                  <ShoppingBag size={24} className="text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Detalhes do produto e controles */}
                            <div className="flex-grow min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h3 className="font-medium text-gray-900 truncate">{item.nome}</h3>
                                  <p className="text-gray-600 text-sm">
                                    {formatarPreco(item.preco)} cada
                                  </p>
                                </div>
                                
                                <button 
                                  onClick={() => removerItem(itemIndex)}
                                  className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0"
                                  aria-label="Remover item"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>

                              <div className="mt-3 flex items-center justify-between">
                                {/* Controles de quantidade */}
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                  <button 
                                    onClick={() => alterarQuantidade(itemIndex, -1)}
                                    className="px-2 py-1 text-gray-700 bg-gray-50 active:bg-gray-100"
                                    disabled={item.quantidade <= 1}
                                  >
                                    <Minus size={14} />
                                  </button>
                                  
                                  <span className="px-3 py-1 min-w-[30px] text-center text-sm font-medium">
                                    {item.quantidade}
                                  </span>
                                  
                                  <button 
                                    onClick={() => alterarQuantidade(itemIndex, 1)}
                                    className="px-2 py-1 text-gray-700 bg-gray-50 active:bg-gray-100"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                                
                                {/* Subtotal */}
                                <div className="text-right">
                                  <span className="font-medium text-primary-500">
                                    {formatarPreco(item.preco * item.quantidade)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Rodapé fixo com total e botão */}
      {itens.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-xl font-bold text-primary-500">{formatarPreco(total)}</p>
              </div>
              <Link href="/checkout">
                <Button variant="primary" className="flex items-center gap-2">
                  <span>Finalizar Compra</span>
                  <ArrowRight size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 