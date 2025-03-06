'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

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
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-500">Carregando carrinho...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-md">
        <h2 className="text-lg font-medium mb-2">Erro</h2>
        <p>{error}</p>
        <Link href="/catalogo/eventos">
          <Button variant="primary" className="mt-4">
            Voltar para Eventos
          </Button>
        </Link>
      </div>
    );
  }

  if (itens.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="flex justify-center mb-4">
          <ShoppingBag size={64} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-medium text-gray-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-600 mb-6">Adicione produtos aos eventos disponíveis para continuar.</p>
        <Link href="/catalogo/eventos">
          <Button variant="primary">
            Ver Eventos Disponíveis
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-32">
      <div className="px-4 sm:px-0 py-6 flex justify-center items-center">
        <div className="flex items-center gap-3">
          <ShoppingBag size={28} className="text-primary-500" />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Seu Carrinho</h1>
        </div>
      </div>
      
      <div className="bg-white shadow-sm overflow-hidden sm:rounded-xl">
        {/* Itens do carrinho agrupados por evento */}
        {Object.entries(itensPorEvento).map(([eventId, itensDoEvento]) => (
          <div key={eventId} className="border-b border-gray-200 last:border-b-0">
            <div className="divide-y divide-gray-100">
              {itensDoEvento.map((item, index) => {
                const itemIndex = itens.findIndex(i => 
                  i.produtoId === item.produtoId && i.eventId === item.eventId
                );
                
                return (
                  <div key={item.produtoId} className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Imagem do produto */}
                      <div className="w-20 h-20 sm:w-16 sm:h-16 relative flex-shrink-0">
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
                          <div className="flex items-center border-2 border-gray-200 rounded-lg">
                            <button 
                              onClick={() => alterarQuantidade(itemIndex, -1)}
                              className="px-3 py-1 text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                              disabled={item.quantidade <= 1}
                            >
                              <Minus size={16} className="stroke-[2.5]" />
                            </button>
                            
                            <span className="px-3 py-1 min-w-[40px] text-center font-medium border-x-2 border-gray-200">
                              {item.quantidade}
                            </span>
                            
                            <button 
                              onClick={() => alterarQuantidade(itemIndex, 1)}
                              className="px-3 py-1 text-gray-700 hover:text-gray-900 hover:bg-gray-50 active:bg-gray-100"
                            >
                              <Plus size={16} className="stroke-[2.5]" />
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
      
      {/* Total e botão de finalizar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-primary-500">{formatarPreco(total)}</p>
            </div>
            
            <Link href="/checkout">
              <Button variant="primary" size="lg">
                Finalizar Compra
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 