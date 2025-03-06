'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useCarrinho, ItemCarrinho } from '@/contexts/CarrinhoContext';
import axios from 'axios';
import { CheckCircle, CreditCard, Wallet, QrCode } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const { itens, total, limparCarrinho } = useCarrinho();
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('pix');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  // Verificar se há itens no carrinho
  if (itens.length === 0 && !sucesso) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Seu carrinho está vazio</h1>
          <p className="text-gray-600 mb-6">Adicione produtos ao carrinho antes de finalizar a compra.</p>
          <Button onClick={() => router.push('/eventos')}>
            Ver Eventos
          </Button>
        </div>
      </div>
    );
  }

  // Função para finalizar a compra
  const finalizarCompra = async () => {
    // Validar formulário
    if (!nome || !email || !telefone) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (itens.length === 0) {
      setErro('Seu carrinho está vazio. Adicione produtos antes de finalizar a compra.');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      console.log('Preparando venda com itens:', itens);
      
      // Criar objeto de venda
      const venda = {
        cliente: nome,
        email,
        telefone,
        tipo: 'evento', // Ou 'rifa' dependendo do contexto
        total,
        formaPagamento,
        status: 'PENDENTE',
        itens: itens.map((item: ItemCarrinho) => ({
          id: item.id,
          nome: item.nome,
          quantidade: item.quantidade,
          precoUnitario: item.preco
        })),
        evento: itens[0]?.evento ? {
          id: itens[0].evento.id,
          nome: itens[0].evento.nome
        } : undefined,
        origem: 'usuario_final'
      };

      console.log('Enviando venda para API:', venda);

      // Enviar para a API
      const response = await axios.post('/api/vendas', venda);
      
      console.log('Resposta da API:', response.data);
      
      // Limpar carrinho e mostrar sucesso
      limparCarrinho();
      setSucesso(true);
      toast.success('Compra realizada com sucesso!');
      
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('Detalhes do erro:', error.response.data);
        setErro(`Erro: ${error.response.data.error || 'Ocorreu um erro ao processar sua compra.'}`);
      } else {
        setErro('Ocorreu um erro ao processar sua compra. Por favor, tente novamente.');
      }
      
      toast.error('Erro ao finalizar compra. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Tela de sucesso
  if (sucesso) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle size={48} className="text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-4">Compra realizada com sucesso!</h1>
          <p className="text-gray-600 mb-6">
            Obrigado por sua compra, {nome}. Você receberá um e-mail com os detalhes da sua compra em breve.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => router.push('/eventos')}>
              Continuar Comprando
            </Button>
            <Button variant="secondary" onClick={() => router.push('/')}>
              Voltar para Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Finalizar Compra</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formulário de Dados */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Seus Dados</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone *
                </label>
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Forma de Pagamento</h2>
            
            <div className="space-y-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer flex items-center ${formaPagamento === 'pix' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                onClick={() => setFormaPagamento('pix')}
              >
                <div className="mr-3">
                  <QrCode size={24} className={formaPagamento === 'pix' ? 'text-primary-500' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-medium">PIX</h3>
                  <p className="text-sm text-gray-500">Pagamento instantâneo</p>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer flex items-center ${formaPagamento === 'cartao' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                onClick={() => setFormaPagamento('cartao')}
              >
                <div className="mr-3">
                  <CreditCard size={24} className={formaPagamento === 'cartao' ? 'text-primary-500' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-medium">Cartão de Crédito/Débito</h3>
                  <p className="text-sm text-gray-500">Pagamento seguro</p>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer flex items-center ${formaPagamento === 'dinheiro' ? 'border-primary-500 bg-primary-50' : 'border-gray-200'}`}
                onClick={() => setFormaPagamento('dinheiro')}
              >
                <div className="mr-3">
                  <Wallet size={24} className={formaPagamento === 'dinheiro' ? 'text-primary-500' : 'text-gray-400'} />
                </div>
                <div>
                  <h3 className="font-medium">Dinheiro</h3>
                  <p className="text-sm text-gray-500">Pague na retirada</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resumo do Pedido */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
            
            <div className="space-y-4">
              <div className="max-h-60 overflow-y-auto">
                {itens.map((item: ItemCarrinho) => (
                  <div key={item.id} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="font-medium">{item.nome}</p>
                      <p className="text-sm text-gray-500">Qtd: {item.quantidade}</p>
                    </div>
                    <p className="font-medium">
                      {(item.preco * item.quantidade).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between mb-2">
                  <p>Subtotal</p>
                  <p className="font-medium">
                    {total.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
                
                <div className="flex justify-between font-bold text-lg mt-4">
                  <p>Total</p>
                  <p>
                    {total.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    })}
                  </p>
                </div>
              </div>
              
              {erro && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {erro}
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={finalizarCompra}
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Finalizar Compra'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 