'use client';

import { useEffect, useState } from 'react';
import { Calendar, DollarSign, Clock, CheckCircle, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Tipos
type Evento = {
  id: string;
  nome: string;
  local: string;
  data: Date;
  createdAt: Date;
};

type Produto = {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  disponivel: boolean;
  eventId: string;
  createdAt: Date;
};

type Venda = {
  id: string;
  total: number;
  status: string;
  createdAt: Date;
};

type AtividadeRecente = {
  id: string;
  tipo: 'evento' | 'produto' | 'venda';
  nome: string;
  data: Date;
  descricao: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalVendasMes, setTotalVendasMes] = useState(0);
  const [vendasPendentes, setVendasPendentes] = useState(0);
  const [vendasFinalizadas, setVendasFinalizadas] = useState(0);

  // Buscar dados do sistema
  useEffect(() => {
    async function fetchDados() {
      try {
        setLoading(true);
        setError('');
        
        // Buscar todos os dados do dashboard em uma única chamada
        const dashboardResponse = await fetch('/api/dashboard');
        
        if (!dashboardResponse.ok) {
          throw new Error('Falha ao carregar dados do dashboard');
        }
        
        const dashboardData = await dashboardResponse.json();
        
        // Atualizar todos os estados com os dados recebidos
        setEventos(dashboardData.eventosRecentes || []);
        setProdutos(dashboardData.produtosRecentes || []);
        setVendas(dashboardData.vendasRecentes || []);
        setTotalVendasMes(dashboardData.totalVendasMes || 0);
        setVendasPendentes(dashboardData.vendasPendentes || 0);
        setVendasFinalizadas(dashboardData.vendasFinalizadas || 0);
        setAtividades(dashboardData.atividades || []);
        
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchDados();
  }, []);

  // Função para formatar preço
  function formatarPreco(preco: number) {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  // Função para formatar data relativa
  function formatarDataRelativa(data: Date) {
    return formatDistanceToNow(new Date(data), {
      addSuffix: true,
      locale: ptBR
    });
  }
  
  const totalVendas = vendas.reduce((total, venda) => total + venda.total, 0);
  
  const vendasEsteMes = vendas
    .filter(venda => {
      const dataVenda = new Date(venda.createdAt);
      const hoje = new Date();
      return dataVenda.getMonth() === hoje.getMonth() && 
             dataVenda.getFullYear() === hoje.getFullYear();
    })
    .reduce((total, venda) => total + venda.total, 0);
  
  // Calcular crescimento de vendas (comparando com mês anterior)
  const vendasMesAnterior = vendas
    .filter(venda => {
      const dataVenda = new Date(venda.createdAt);
      const hoje = new Date();
      const mesAnterior = hoje.getMonth() === 0 ? 11 : hoje.getMonth() - 1;
      const anoMesAnterior = hoje.getMonth() === 0 ? hoje.getFullYear() - 1 : hoje.getFullYear();
      return dataVenda.getMonth() === mesAnterior && 
             dataVenda.getFullYear() === anoMesAnterior;
    })
    .reduce((total, venda) => total + venda.total, 0);
  
  const crescimentoVendas = vendasMesAnterior === 0 
    ? 100 
    : Math.round((vendasEsteMes - vendasMesAnterior) / vendasMesAnterior * 100);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-500">Carregando dados do dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-md">
        <h2 className="text-lg font-medium mb-2">Erro</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        
        {/* Link para o painel master - apenas para SUPER_ADMIN */}
        {session?.user?.role === 'SUPER_ADMIN' && (
          <Link 
            href="/master" 
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md text-sm font-medium"
          >
            <Shield size={16} />
            Painel Master
          </Link>
        )}
      </div>
      
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Vendas do Mês</p>
              <h3 className="text-2xl font-bold">{formatarPreco(totalVendasMes)}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <DollarSign className="text-green-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Eventos Ativos</p>
              <h3 className="text-2xl font-bold">{eventos.length}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Calendar className="text-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Vendas Pendentes</p>
              <h3 className="text-2xl font-bold">{vendasPendentes}</h3>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Clock className="text-yellow-500" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Vendas Finalizadas</p>
              <h3 className="text-2xl font-bold">{vendasFinalizadas}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <CheckCircle className="text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">Atividades Recentes</h3>
          
          {atividades.length === 0 ? (
            <div className="mt-6 text-center py-8 text-gray-500">
              Nenhuma atividade recente encontrada
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {atividades.map((atividade) => (
                <div key={`${atividade.tipo}-${atividade.id}`} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full ${
                      atividade.tipo === 'evento' 
                        ? 'bg-green-500' 
                        : atividade.tipo === 'produto' 
                          ? 'bg-blue-500' 
                          : 'bg-yellow-500'
                    }`}></div>
                    <p className="ml-3 text-sm text-gray-500">{atividade.descricao}</p>
                  </div>
                  <span className="text-sm text-gray-400">{formatarDataRelativa(atividade.data)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Próximos Eventos */}
      {eventos.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Próximos Eventos</h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Local
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produtos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {eventos
                    .filter(evento => new Date(evento.data) >= new Date())
                    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                    .slice(0, 5)
                    .map((evento) => {
                      const produtosDoEvento = produtos.filter(p => p.eventId === evento.id);
                      
                      return (
                        <tr key={evento.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{evento.nome}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{evento.local}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {new Date(evento.data).toLocaleDateString('pt-BR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {produtosDoEvento.length} produtos
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 