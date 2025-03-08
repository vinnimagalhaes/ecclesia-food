'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
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

type Evento = {
  id: string;
  nome: string;
};

type FormularioCheckout = {
  nome: string;
  email: string;
  telefone: string;
  metodoPagamento: 'dinheiro' | 'cartao' | 'pix';
  observacoes: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [formulario, setFormulario] = useState<FormularioCheckout>({
    nome: '',
    email: '',
    telefone: '',
    metodoPagamento: 'dinheiro',
    observacoes: ''
  });

  // Carregar carrinho do localStorage
  useEffect(() => {
    try {
      setLoading(true);
      const carrinhoSalvo = localStorage.getItem('carrinho');
      
      if (!carrinhoSalvo || JSON.parse(carrinhoSalvo).length === 0) {
        router.push('/carrinho');
        return;
      }
      
      const carrinhoParseado = JSON.parse(carrinhoSalvo);
      setItens(carrinhoParseado);
      
      // Extrair IDs de eventos únicos
      const eventosIds = [...new Set(carrinhoParseado.map((item: ItemCarrinho) => item.eventId))];
      
      // Buscar informações dos eventos
      Promise.all(
        eventosIds.map(async (id) => {
          try {
            const response = await fetch(`/api/catalogo/eventos/${id}`);
            if (response.ok) {
              return await response.json();
            }
            return null;
          } catch (err) {
            console.error(`Erro ao buscar evento ${id}:`, err);
            return null;
          }
        })
      ).then((eventosData) => {
        const eventosMap: Record<string, Evento> = {};
        eventosData.forEach((evento) => {
          if (evento) {
            eventosMap[evento.id] = evento;
          }
        });
        setLoading(false);
      });
    } catch (err) {
      console.error('Erro ao carregar carrinho:', err);
      setError('Não foi possível carregar o carrinho. Tente novamente.');
      setLoading(false);
    }
  }, [router]);

  // Função para formatar preço
  function formatarPreco(preco: number) {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  // Calcular total do carrinho
  const total = itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  
  // Função para atualizar o formulário
  function atualizarFormulario(campo: keyof FormularioCheckout, valor: string) {
    setFormulario(prev => ({
      ...prev,
      [campo]: valor
    }));
  }
  
  // Função para enviar o pedido
  async function enviarPedido(e: React.FormEvent) {
    e.preventDefault();
    
    // Validar apenas nome e telefone como obrigatórios
    if (!formulario.nome || !formulario.telefone) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    if (itens.length === 0) {
      setError('Seu carrinho está vazio.');
      return;
    }
    
    try {
      setEnviando(true);
      setError('');
      
      console.log('Enviando pedido para API...');
      
      // Preparar os dados para a API no formato correto
      const dadosVenda = {
        cliente: formulario.nome,
        email: formulario.email || '', // Pode estar vazio
        telefone: formulario.telefone,
        tipo: 'evento', // Padrão para vendas de catálogo
        total: total,
        formaPagamento: formulario.metodoPagamento,
        origem: 'usuario_final',
        status: 'PENDENTE',
        itens: itens.map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.preco,
          productId: item.produtoId
        })),
        eventId: itens[0]?.eventId || undefined,
        observacoes: formulario.observacoes
      };
      
      console.log('Dados do pedido:', dadosVenda);
      
      // Enviar para a API de vendas
      const response = await fetch('/api/vendas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosVenda)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pedido');
      }
      
      const responseData = await response.json();
      console.log('Resposta da API:', responseData);
      
      // Salvar ID e informações do pedido para exibição na página de sucesso
      if (responseData.id) {
        localStorage.setItem('ultimoPedido', JSON.stringify({
          id: responseData.id,
          total: total,
          data: new Date().toISOString(),
          cliente: formulario.nome,
          itensQuantidade: itens.length
        }));
      }
      
      // Limpar o carrinho após pedido bem-sucedido
      localStorage.removeItem('carrinho');
      
      // Redirecionar para página de sucesso
      router.push('/checkout/sucesso');
    } catch (err) {
      console.error('Erro ao enviar pedido:', err);
      setError(`Não foi possível finalizar seu pedido: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setEnviando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Carregando checkout...</p>
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
          <div className="mt-4 flex gap-4">
            <Link href="/carrinho" className="w-full">
              <Button variant="primary" className="w-full">
                Voltar para o Carrinho
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <AppHeader
        title="Finalizar Pedido"
        showBackButton={true}
        backUrl="/carrinho"
        sticky={true}
      />

      {/* Formulário e resumo */}
      <div className="flex-1 p-4">
        <div className="space-y-4">
          {/* Formulário de checkout */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Seus Dados</h2>
              
              <form onSubmit={enviarPedido} className="space-y-4">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formulario.nome}
                    onChange={(e) => atualizarFormulario('nome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formulario.email}
                    onChange={(e) => atualizarFormulario('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="telefone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    id="telefone"
                    value={formulario.telefone}
                    onChange={(e) => atualizarFormulario('telefone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pagamento *
                  </label>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <label className={`
                      relative flex items-center p-3 rounded-md border cursor-pointer
                      ${formulario.metodoPagamento === 'dinheiro' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'}
                    `}>
                      <input
                        type="radio"
                        name="metodoPagamento"
                        value="dinheiro"
                        checked={formulario.metodoPagamento === 'dinheiro'}
                        onChange={() => atualizarFormulario('metodoPagamento', 'dinheiro')}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <span className={`w-4 h-4 mr-2 rounded-full border flex-shrink-0 ${formulario.metodoPagamento === 'dinheiro' ? 'border-4 border-primary-500' : 'border border-gray-400'}`}></span>
                        <span className="font-medium text-gray-700">Dinheiro</span>
                      </div>
                    </label>
                    
                    <label className={`
                      relative flex items-center p-3 rounded-md border cursor-pointer
                      ${formulario.metodoPagamento === 'cartao' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'}
                    `}>
                      <input
                        type="radio"
                        name="metodoPagamento"
                        value="cartao"
                        checked={formulario.metodoPagamento === 'cartao'}
                        onChange={() => atualizarFormulario('metodoPagamento', 'cartao')}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <span className={`w-4 h-4 mr-2 rounded-full border flex-shrink-0 ${formulario.metodoPagamento === 'cartao' ? 'border-4 border-primary-500' : 'border border-gray-400'}`}></span>
                        <span className="font-medium text-gray-700">Cartão</span>
                      </div>
                    </label>
                    
                    <label className={`
                      relative flex items-center p-3 rounded-md border cursor-pointer
                      ${formulario.metodoPagamento === 'pix' ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'}
                    `}>
                      <input
                        type="radio"
                        name="metodoPagamento"
                        value="pix"
                        checked={formulario.metodoPagamento === 'pix'}
                        onChange={() => atualizarFormulario('metodoPagamento', 'pix')}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <span className={`w-4 h-4 mr-2 rounded-full border flex-shrink-0 ${formulario.metodoPagamento === 'pix' ? 'border-4 border-primary-500' : 'border border-gray-400'}`}></span>
                        <span className="font-medium text-gray-700">Pix</span>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    rows={3}
                    value={formulario.observacoes}
                    onChange={(e) => atualizarFormulario('observacoes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Alguma informação adicional para seu pedido?"
                  ></textarea>
                </div>
              </form>
            </div>
          </div>

          {/* Resumo do pedido */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-3 mb-4">
                {itens.map((item) => (
                  <div key={item.produtoId} className="flex justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-700">
                        {item.quantidade}x {item.nome}
                      </p>
                    </div>
                    <div className="ml-4 text-right">
                      <p className="font-medium text-gray-900">
                        {formatarPreco(item.preco * item.quantidade)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900">Total</p>
                  <p className="font-bold text-xl text-primary-500">{formatarPreco(total)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botão de finalizar fixo na parte inferior */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <Button
          variant="primary"
          className="w-full py-3"
          onClick={enviarPedido}
          disabled={enviando}
        >
          {enviando ? 'Processando...' : 'Finalizar Pedido'}
        </Button>
      </div>
    </div>
  );
} 