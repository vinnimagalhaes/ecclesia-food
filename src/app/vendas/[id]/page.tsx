'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  DollarSign, 
  Tag, 
  Clock, 
  CheckCircle, 
  X,
  Truck,
  MessageSquare
} from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  total?: number;
  productId?: string;
}

interface Venda {
  id: string;
  cliente: string;
  email?: string;
  telefone?: string;
  tipo: 'evento' | 'rifa';
  total: number;
  status: 'PENDENTE' | 'FINALIZADA' | 'CANCELADA';
  formaPagamento?: string;
  origem?: string;
  createdAt: string;
  items: ItemVenda[];
  event?: {
    id: string;
    nome: string;
    data?: string;
    local?: string;
  };
  metadata?: {
    observacoes?: string;
  };
}

export default function VendaDetalhesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [venda, setVenda] = useState<Venda | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [atualizando, setAtualizando] = useState(false);

  // Carregar os dados da venda
  useEffect(() => {
    async function carregarVenda() {
      try {
        setLoading(true);
        const response = await api.get(`/vendas/${params.id}`);
        console.log('Dados da venda:', response.data);
        setVenda(response.data);
        setError('');
      } catch (err) {
        console.error('Erro ao carregar venda:', err);
        setError('Não foi possível carregar os detalhes da venda.');
      } finally {
        setLoading(false);
      }
    }

    carregarVenda();
  }, [params.id]);

  // Formatar valor monetário
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatar data
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString);
      return format(data, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (error) {
      return dataString;
    }
  };

  // Finalizar venda
  const finalizarVenda = async () => {
    if (!venda) return;
    
    try {
      setAtualizando(true);
      await api.patch(`/vendas/${venda.id}`, { status: 'FINALIZADA' });
      
      // Atualizar estado local
      setVenda({ ...venda, status: 'FINALIZADA' });
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      alert('Não foi possível finalizar a venda. Tente novamente.');
    } finally {
      setAtualizando(false);
    }
  };

  // Cancelar venda
  const cancelarVenda = async () => {
    if (!venda) return;
    
    if (!confirm('Tem certeza que deseja cancelar esta venda?')) {
      return;
    }
    
    try {
      setAtualizando(true);
      await api.patch(`/vendas/${venda.id}`, { status: 'CANCELADA' });
      
      // Atualizar estado local
      setVenda({ ...venda, status: 'CANCELADA' });
    } catch (err) {
      console.error('Erro ao cancelar venda:', err);
      alert('Não foi possível cancelar a venda. Tente novamente.');
    } finally {
      setAtualizando(false);
    }
  };

  // Excluir venda
  const excluirVenda = async () => {
    if (!venda) return;
    
    // Confirmar exclusão com o usuário
    if (!confirm('Tem certeza que deseja excluir permanentemente esta venda? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    try {
      setAtualizando(true);
      await api.delete(`/vendas/${venda.id}`);
      
      alert('Venda excluída com sucesso!');
      // Redirecionar para a lista de vendas
      router.push('/vendas');
    } catch (err) {
      console.error('Erro ao excluir venda:', err);
      alert('Não foi possível excluir a venda. Tente novamente.');
      setAtualizando(false);
    }
  };

  // Renderizar status com cores
  const renderizarStatus = (status: string) => {
    switch (status) {
      case 'FINALIZADA':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle size={16} className="mr-1" />
            Finalizada
          </span>
        );
      case 'PENDENTE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock size={16} className="mr-1" />
            Pendente
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <X size={16} className="mr-1" />
            Cancelada
          </span>
        );
      default:
        return status;
    }
  };

  // Renderizar forma de pagamento
  const renderizarFormaPagamento = (metodo?: string) => {
    switch (metodo?.toLowerCase()) {
      case 'dinheiro':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            <DollarSign size={16} className="mr-1" />
            Dinheiro
          </span>
        );
      case 'cartao':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            <Tag size={16} className="mr-1" />
            Cartão
          </span>
        );
      case 'pix':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <DollarSign size={16} className="mr-1" />
            PIX
          </span>
        );
      default:
        return metodo || 'Não especificado';
    }
  };

  // Conteúdo de loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-pulse text-gray-500">Carregando detalhes da venda...</div>
      </div>
    );
  }

  // Conteúdo de erro
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/vendas">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes da Venda</h1>
        </div>
        
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-md">
          <h2 className="text-lg font-medium mb-2">Erro</h2>
          <p>{error}</p>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => router.push('/vendas')}
          >
            Voltar para Vendas
          </Button>
        </div>
      </div>
    );
  }

  // Conteúdo principal quando a venda está carregada
  if (!venda) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/vendas">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes da Venda</h1>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-md">
          <h2 className="text-lg font-medium mb-2">Venda não encontrada</h2>
          <p>Não foi possível encontrar a venda com o ID especificado.</p>
          <Button 
            variant="primary" 
            className="mt-4"
            onClick={() => router.push('/vendas')}
          >
            Voltar para Vendas
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/vendas">
            <Button variant="secondary" size="sm">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Detalhes da Venda #{venda.id.substring(0, 8)}</h1>
        </div>
        
        <div className="flex gap-2">
          {venda.status === 'PENDENTE' && (
            <>
              <Button 
                variant="primary" 
                onClick={finalizarVenda}
                disabled={atualizando}
              >
                <CheckCircle size={16} className="mr-1" />
                Finalizar Venda
              </Button>
              
              <Button 
                variant="secondary" 
                onClick={cancelarVenda}
                disabled={atualizando}
                className="text-red-600 hover:text-red-700"
              >
                <X size={16} className="mr-1" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Card de informações principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações da venda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detalhes da venda */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign size={18} className="mr-2 text-primary-500" />
              Informações da Venda
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">ID da Venda</p>
                <p className="font-medium">{venda.id}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Status</p>
                <div>{renderizarStatus(venda.status)}</div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Data</p>
                <p>{formatarData(venda.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Forma de Pagamento</p>
                <div>{renderizarFormaPagamento(venda.formaPagamento)}</div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Tipo</p>
                <p>{venda.tipo === 'evento' ? 'Evento' : 'Rifa'}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Origem</p>
                <p>{venda.origem === 'usuario_final' ? 'Site (Cliente Final)' : 'Administrativo'}</p>
              </div>
            </div>

            {venda.metadata && venda.metadata.observacoes && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <MessageSquare size={16} className="mr-1 text-primary-500" />
                  Observações do Cliente
                </h3>
                <div className="bg-yellow-50 p-3 rounded-md">
                  <p className="text-gray-800">{venda.metadata.observacoes}</p>
                </div>
              </div>
            )}

            {venda.event && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                  <Calendar size={16} className="mr-1 text-primary-500" />
                  Evento Relacionado
                </h3>
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="font-medium text-blue-800">{venda.event.nome}</p>
                  {venda.event.local && <p className="text-sm text-blue-700">Local: {venda.event.local}</p>}
                  {venda.event.data && <p className="text-sm text-blue-700">Data: {formatarData(venda.event.data)}</p>}
                </div>
              </div>
            )}
          </div>
          
          {/* Itens da venda */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Truck size={18} className="mr-2 text-primary-500" />
              Itens da Venda
            </h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produto
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço Unitário
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantidade
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {venda.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.nome}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {formatarValor(item.precoUnitario)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {item.quantidade}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatarValor(item.quantidade * item.precoUnitario)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      Total
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                      {formatarValor(venda.total)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        
        {/* Informações do cliente */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User size={18} className="mr-2 text-primary-500" />
              Informações do Cliente
            </h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Nome</p>
                <p className="font-medium">{venda.cliente}</p>
              </div>
              
              {venda.email && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <div className="flex items-center">
                    <Mail size={16} className="mr-1 text-gray-400" />
                    <a href={`mailto:${venda.email}`} className="text-primary-600 hover:underline">
                      {venda.email}
                    </a>
                  </div>
                </div>
              )}
              
              {venda.telefone && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Telefone</p>
                  <div className="flex items-center">
                    <Phone size={16} className="mr-1 text-gray-400" />
                    <a href={`tel:${venda.telefone}`} className="text-primary-600 hover:underline">
                      {venda.telefone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Resumo financeiro */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign size={18} className="mr-2 text-primary-500" />
              Resumo Financeiro
            </h2>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal ({venda.items.reduce((acc, item) => acc + item.quantidade, 0)} itens)</span>
                <span>{formatarValor(venda.total)}</span>
              </div>
              
              <div className="flex justify-between items-center font-bold pt-2 border-t border-gray-200">
                <span>Total</span>
                <span className="text-lg text-primary-600">{formatarValor(venda.total)}</span>
              </div>
            </div>
          </div>
          
          {/* Ações */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Ações</h2>
            
            <div className="space-y-4">
              <Button variant="secondary" className="w-full" onClick={() => window.print()}>
                Imprimir Detalhes
              </Button>
              
              <Link href="/vendas" className="block mt-4">
                <Button variant="secondary" className="w-full">
                  Voltar para Lista
                </Button>
              </Link>
              
              <Button 
                variant="destructive" 
                className="w-full bg-red-100 hover:bg-red-200 text-red-700 border border-red-300"
                onClick={excluirVenda}
                disabled={atualizando}
              >
                {atualizando ? 'Excluindo...' : 'Excluir Venda'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 