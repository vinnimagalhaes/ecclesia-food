'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Plus, Minus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

// API client
const api = axios.create({
  baseURL: '/api'
});

// Tipos
interface ItemVenda {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  produtoId?: string;
}

interface Evento {
  id: string;
  nome: string;
}

interface Produto {
  id: string;
  nome: string;
  preco: number;
  descricao?: string;
  categoria?: string;
  disponivel: boolean;
  eventId: string;
}

export default function NovaVendaPage() {
  const router = useRouter();
  
  // Estados do formulário
  const [cliente, setCliente] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<'dinheiro' | 'cartao' | 'pix'>('dinheiro');
  const [itens, setItens] = useState<ItemVenda[]>([
    { id: crypto.randomUUID(), nome: '', quantidade: 1, precoUnitario: 0 }
  ]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoSelecionado, setEventoSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [produtosDoEvento, setProdutosDoEvento] = useState<Produto[]>([]);
  const [todosProdutos, setTodosProdutos] = useState<Produto[]>([]);

  // Carregar eventos disponíveis
  useEffect(() => {
    async function carregarEventos() {
      try {
        const response = await api.get('/eventos');
        setEventos(response.data);
      } catch (err) {
        console.error('Erro ao carregar eventos:', err);
      }
    }

    async function carregarTodosProdutos() {
      try {
        const response = await api.get('/produtos');
        setTodosProdutos(response.data);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
      }
    }

    carregarEventos();
    carregarTodosProdutos();
  }, []);

  // Carregar produtos do evento selecionado
  useEffect(() => {
    async function carregarProdutosDoEvento() {
      if (!eventoSelecionado) {
        setProdutosDoEvento([]);
        return;
      }
      
      try {
        const response = await api.get(`/eventos/${eventoSelecionado}/produtos`);
        console.log('Resposta da API de produtos:', response.data);
        
        // Verificar a estrutura do primeiro produto (se existir)
        if (response.data.length > 0) {
          console.log('Estrutura do primeiro produto:', JSON.stringify(response.data[0], null, 2));
          console.log('Preço do primeiro produto:', response.data[0].preco);
        }
        
        // Garantir que todos os produtos tenham preços numéricos
        const produtosProcessados = response.data.map((produto: any) => {
          if (typeof produto.preco !== 'number') {
            return {
              ...produto,
              preco: Number(produto.preco) || 0
            };
          }
          return produto;
        });
        
        console.log('Produtos processados:', produtosProcessados);
        setProdutosDoEvento(produtosProcessados);
        
        // Limpar os itens quando mudar de evento
        setItens([{ id: crypto.randomUUID(), nome: '', quantidade: 1, precoUnitario: 0 }]);
      } catch (err) {
        console.error('Erro ao carregar produtos do evento:', err);
      }
    }

    carregarProdutosDoEvento();
  }, [eventoSelecionado]);

  // Calcular total da venda
  const total = itens.reduce((acc, item) => acc + (item.quantidade * item.precoUnitario), 0);

  // Adicionar novo item
  const adicionarItem = () => {
    setItens([...itens, { id: crypto.randomUUID(), nome: '', quantidade: 1, precoUnitario: 0 }]);
  };

  // Remover item
  const removerItem = (id: string) => {
    if (itens.length > 1) {
      setItens(itens.filter(item => item.id !== id));
    }
  };

  // Atualizar item
  const atualizarItem = (id: string, campo: keyof ItemVenda, valor: any) => {
    setItens(itens.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  // Selecionar produto
  const selecionarProduto = (id: string, produtoId: string) => {
    if (!produtoId) return;
    
    console.log('Selecionando produto:', produtoId);
    console.log('Produtos disponíveis:', produtosDoEvento);
    
    const produto = produtosDoEvento.find(p => p.id === produtoId);
    console.log('Produto encontrado:', produto);
    
    if (produto) {
      // Garantir que temos acesso ao preço, independentemente da estrutura
      let preco = 0;
      if (typeof produto.preco === 'number') {
        preco = produto.preco;
      } else if (produto.preco) {
        // Tentar converter para número se for outro tipo
        try {
          preco = Number(produto.preco);
        } catch (e) {
          console.error('Erro ao converter preço:', e);
        }
      }
      
      if (preco <= 0) {
        console.error('Preço inválido:', preco);
        alert('Este produto tem um preço inválido. Por favor, edite o produto para corrigir o preço.');
        return;
      }
      
      console.log('Atualizando item com nome:', produto.nome, 'e preço:', preco);
      
      // Criar um novo array de itens com o item atualizado
      const novosItens = [...itens];
      const index = novosItens.findIndex(item => item.id === id);
      
      if (index !== -1) {
        novosItens[index] = {
          ...novosItens[index],
          nome: produto.nome,
          precoUnitario: preco,
          produtoId: produto.id
        };
        
        // Atualizar o estado com o novo array
        setItens(novosItens);
        
        console.log('Item atualizado:', novosItens[index]);
      }
    }
  };

  // Enviar formulário
  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Enviando formulário...');
    console.log('Cliente:', cliente);
    console.log('Evento selecionado:', eventoSelecionado);
    console.log('Itens:', itens);
    
    // Validar formulário
    if (!cliente) {
      alert('Por favor, informe o nome do cliente.');
      return;
    }

    if (!eventoSelecionado) {
      alert('Por favor, selecione um evento.');
      return;
    }

    // Verificar cada item individualmente para identificar qual está falhando
    const itensInvalidos = itens.filter(item => !item.nome || item.quantidade <= 0 || item.precoUnitario <= 0);
    if (itensInvalidos.length > 0) {
      console.error('Itens inválidos:', itensInvalidos);
      
      // Verificar cada problema específico
      const problemas: string[] = [];
      
      itensInvalidos.forEach((item, index) => {
        if (!item.nome) {
          problemas.push(`Item ${index + 1}: Nome do produto não selecionado`);
        }
        if (item.quantidade <= 0) {
          problemas.push(`Item ${index + 1}: Quantidade inválida`);
        }
        if (item.precoUnitario <= 0) {
          problemas.push(`Item ${index + 1}: Preço unitário inválido`);
        }
        
        console.error(`Item ${index + 1}:`, {
          nome: item.nome ? 'OK' : 'FALTANDO',
          quantidade: item.quantidade > 0 ? 'OK' : 'INVÁLIDO',
          precoUnitario: item.precoUnitario > 0 ? 'OK' : 'INVÁLIDO',
          produtoId: item.produtoId ? 'OK' : 'FALTANDO'
        });
      });
      
      alert(`Por favor, corrija os seguintes problemas:\n${problemas.join('\n')}`);
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para envio
      const dadosVenda = {
        cliente,
        email: email || undefined,
        telefone: telefone || undefined,
        tipo: 'evento', // Campo obrigatório na API
        total,
        itens: itens.map(({ id, produtoId, ...rest }) => ({
          ...rest,
          productId: produtoId // Garantir que produtoId seja enviado como productId para a API
        })),
        eventId: eventoSelecionado || undefined,
        formaPagamento,
        status: 'PENDENTE',
        origem: 'admin'
      };

      console.log('Dados para envio:', JSON.stringify(dadosVenda, null, 2));

      // Enviar para a API
      try {
        const response = await api.post('/vendas', dadosVenda);
        console.log('Resposta da API:', response.data);
        
        // Redirecionar para a lista de vendas
        router.push('/vendas');
        router.refresh();
      } catch (apiError: any) {
        console.error('Erro detalhado da API:', apiError);
        
        if (apiError.response) {
          // O servidor respondeu com um status de erro
          console.error('Status do erro:', apiError.response.status);
          console.error('Dados da resposta:', apiError.response.data);
          console.error('Headers da resposta:', apiError.response.headers);
          
          // Mostrar detalhes específicos do erro se disponíveis
          const errorMessage = apiError.response.data?.detalhes || 
                              apiError.response.data?.error || 
                              apiError.response.data?.message || 
                              'Erro desconhecido';
          console.error('Mensagem de erro detalhada:', errorMessage);
          
          alert(`Erro ao criar venda: ${errorMessage}`);
        } else if (apiError.request) {
          // A requisição foi feita mas não houve resposta
          console.error('Sem resposta do servidor:', apiError.request);
          alert('Não foi possível obter resposta do servidor. Verifique sua conexão.');
        } else {
          // Algo aconteceu ao configurar a requisição
          console.error('Erro ao configurar requisição:', apiError.message);
          alert(`Erro ao configurar requisição: ${apiError.message}`);
        }
        
        throw apiError; // Repassar o erro para o catch externo
      }
    } catch (err) {
      console.error('Erro ao criar venda:', err);
      alert('Não foi possível criar a venda. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Formatar valor monetário
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Monitorar mudanças nos itens
  useEffect(() => {
    console.log('Itens atualizados:', itens);
  }, [itens]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendas">
          <Button variant="secondary" size="sm">
            <ArrowLeft size={16} />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Nova Venda</h1>
      </div>

      <form onSubmit={enviarFormulario} className="space-y-8">
        {/* Informações do cliente */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Informações do Cliente</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Cliente*
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Detalhes da venda */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Detalhes da Venda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Evento*
              </label>
              <select
                value={eventoSelecionado}
                onChange={(e) => setEventoSelecionado(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione um evento</option>
                {eventos.map(evento => (
                  <option key={evento.id} value={evento.id}>
                    {evento.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={formaPagamento}
                onChange={(e) => setFormaPagamento(e.target.value as 'dinheiro' | 'cartao' | 'pix')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="pix">PIX</option>
              </select>
            </div>
          </div>

          {/* Itens da venda */}
          <h3 className="text-md font-medium mb-2">Itens</h3>
          {!eventoSelecionado && (
            <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
              Selecione um evento para visualizar os produtos disponíveis.
            </div>
          )}
          {eventoSelecionado && produtosDoEvento.length === 0 && (
            <div className="p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
              Este evento não possui produtos cadastrados. Adicione produtos ao evento antes de criar uma venda.
            </div>
          )}
          <div className="space-y-4 mb-4">
            {itens.map((item, index) => (
              <div key={item.id} className="flex flex-wrap items-end gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto/Item*
                  </label>
                  <select
                    value={item.produtoId || ''}
                    onChange={(e) => selecionarProduto(item.id, e.target.value)}
                    className={`w-full px-3 py-2 border ${!item.nome ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                    disabled={!eventoSelecionado || produtosDoEvento.length === 0}
                  >
                    <option value="">Selecione um produto</option>
                    {produtosDoEvento.map(produto => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} - {typeof produto.preco === 'number' ? formatarValor(produto.preco) : 'Preço não disponível'}
                      </option>
                    ))}
                  </select>
                  {!item.nome && (
                    <p className="mt-1 text-xs text-red-500">Selecione um produto</p>
                  )}
                </div>
                <div className="w-24">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qtd*
                  </label>
                  <div className="flex">
                    <button
                      type="button"
                      onClick={() => atualizarItem(item.id, 'quantidade', Math.max(1, item.quantidade - 1))}
                      className="px-2 py-2 bg-gray-200 rounded-l-md hover:bg-gray-300"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantidade}
                      onChange={(e) => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 1)}
                      className={`w-full px-2 py-2 border-y ${item.quantidade <= 0 ? 'border-red-500' : 'border-gray-300'} text-center focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => atualizarItem(item.id, 'quantidade', item.quantidade + 1)}
                      className="px-2 py-2 bg-gray-200 rounded-r-md hover:bg-gray-300"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  {item.quantidade <= 0 && (
                    <p className="mt-1 text-xs text-red-500">Quantidade inválida</p>
                  )}
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Unit.
                  </label>
                  <div className={`px-3 py-2 border ${item.precoUnitario <= 0 ? 'border-red-500' : 'border-gray-300'} rounded-md bg-gray-100 text-gray-700`}>
                    {item.precoUnitario ? formatarValor(item.precoUnitario) : 'R$ 0,00'}
                  </div>
                  {item.precoUnitario <= 0 && (
                    <p className="mt-1 text-xs text-red-500">Preço inválido</p>
                  )}
                </div>
                <div className="w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subtotal
                  </label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700">
                    {item.precoUnitario ? formatarValor(item.quantidade * item.precoUnitario) : 'R$ 0,00'}
                  </div>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => removerItem(item.id)}
                    disabled={itens.length === 1}
                    className={`p-2 rounded-md ${itens.length === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:bg-red-100'}`}
                    title={itens.length === 1 ? "Não é possível remover o único item" : "Remover item"}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={adicionarItem}
              className="flex items-center gap-1"
              disabled={!eventoSelecionado || produtosDoEvento.length === 0}
            >
              <Plus size={16} />
              <span>Adicionar Item</span>
            </Button>
            <div className="text-xl font-bold">
              Total: {formatarValor(total)}
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex justify-end gap-3">
          <Link href="/vendas">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !eventoSelecionado || produtosDoEvento.length === 0}
            className="flex items-center gap-2"
          >
            {loading ? 'Salvando...' : (
              <>
                <Save size={16} />
                <span>Salvar Venda</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
} 