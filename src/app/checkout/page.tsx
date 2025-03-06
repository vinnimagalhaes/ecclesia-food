'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { ShoppingBag, CreditCard, Smartphone } from 'lucide-react';

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
    
    if (!formulario.nome || !formulario.email || !formulario.telefone) {
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
        email: formulario.email,
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
        evento: itens[0]?.eventId ? { 
          id: itens[0]?.eventId 
        } : undefined,
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
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-500">Carregando checkout...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-md">
        <h2 className="text-lg font-medium mb-2">Erro</h2>
        <p>{error}</p>
        <div className="mt-4 flex gap-4">
          <Link href="/carrinho">
            <Button variant="secondary">
              Voltar para o Carrinho
            </Button>
          </Link>
          <Button variant="primary" onClick={() => setError('')}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Finalizar Pedido</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de checkout */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Seus Dados</h2>
            
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
                  E-mail *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formulario.email}
                  onChange={(e) => atualizarFormulario('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`
                    flex items-center p-3 border rounded-md cursor-pointer
                    ${formulario.metodoPagamento === 'dinheiro' ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
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
                      <span className="text-gray-900 ml-2">Dinheiro</span>
                    </div>
                  </label>
                  
                  <label className={`
                    flex items-center p-3 border rounded-md cursor-pointer
                    ${formulario.metodoPagamento === 'cartao' ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
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
                      <CreditCard size={18} className="text-gray-500" />
                      <span className="text-gray-900 ml-2">Cartão</span>
                    </div>
                  </label>
                  
                  <label className={`
                    flex items-center p-3 border rounded-md cursor-pointer
                    ${formulario.metodoPagamento === 'pix' ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}
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
                      <Smartphone size={18} className="text-gray-500" />
                      <span className="text-gray-900 ml-2">PIX</span>
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
                  value={formulario.observacoes}
                  onChange={(e) => atualizarFormulario('observacoes', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
              
              <div className="pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="w-full"
                  disabled={enviando}
                >
                  {enviando ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Resumo do pedido */}
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Resumo do Pedido</h2>
            
            <div className="space-y-4 mb-6">
              {itens.map(item => (
                <div key={item.produtoId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.quantidade}x {item.nome}
                  </span>
                  <span className="font-medium">
                    {formatarPreco(item.preco * item.quantidade)}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatarPreco(total)}</span>
              </div>
              
              <div className="flex justify-between items-center font-bold text-lg mt-4">
                <span>Total</span>
                <span className="text-primary-500">{formatarPreco(total)}</span>
              </div>
            </div>
            
            <div className="mt-6">
              <Link href="/carrinho">
                <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
                  <ShoppingBag size={18} />
                  <span>Voltar ao Carrinho</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 