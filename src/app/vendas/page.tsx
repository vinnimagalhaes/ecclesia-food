'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Search, Filter, Download, DollarSign, Calendar, Tag, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import React from 'react';

// API client
const api = axios.create({
  baseURL: '/api'
});

// Tipos
type Venda = {
  id: string;
  cliente: string;
  tipo: 'evento' | 'rifa';
  total: number;
  status: 'PENDENTE' | 'FINALIZADA' | 'CANCELADA';
  data: string;
  evento?: {
    id: string;
    nome: string;
  };
  itens: {
    id: string;
    nome: string;
    quantidade: number;
    precoUnitario: number;
  }[];
};

export default function VendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todas');
  const [busca, setBusca] = useState('');
  const [periodo, setPeriodo] = useState('todos');
  const [filtroEvento, setFiltroEvento] = useState('todos');
  const [eventos, setEventos] = useState<{id: string, nome: string}[]>([]);

  // Refs para evitar loops infinitos no useEffect
  const vendasRef = React.useRef(vendas);
  const loadingRef = React.useRef(loading);
  
  useEffect(() => {
    vendasRef.current = vendas;
  }, [vendas]);
  
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);
  
  useEffect(() => {
    // Tentar carregar usando o método principal primeiro
    carregarVendas();
    
    // Se não tivermos dados após 2 segundos, tentar o método alternativo
    const timeoutId = setTimeout(() => {
      if (vendasRef.current.length === 0 && !loadingRef.current) {
        console.log('Tentando método alternativo após timeout...');
        carregarVendasManualmente();
      }
    }, 2000);
    
    // Limpar timeout se o componente for desmontado
    return () => clearTimeout(timeoutId);
  }, []);

  // Carregar eventos para o filtro de eventos
  useEffect(() => {
    const carregarEventos = async () => {
      try {
        const response = await api.get('/eventos');
        if (response.status === 200) {
          // Extrair apenas id e nome para o dropdown
          const eventosParaDropdown = response.data.map((e: any) => ({
            id: e.id,
            nome: e.nome
          }));
          setEventos(eventosParaDropdown);
        }
      } catch (error) {
        console.error('Erro ao carregar eventos para filtro:', error);
      }
    };

    carregarEventos();
  }, []);

  // Verificar estado da sessão
  const verificarSessao = () => {
    try {
      console.log('Verificando estado da sessão...');
      
      // Verificar cookies
      console.log('Cookies disponíveis:', document.cookie);
      
      // Verificar localStorage
      console.log('Session em localStorage:', localStorage.getItem('next-auth.session-token'));
      console.log('Callback URL em localStorage:', localStorage.getItem('next-auth.callback-url'));
      
      // Tentar buscar session do NextAuth
      fetch('/api/auth/session')
        .then(res => res.json())
        .then(data => {
          console.log('Dados da sessão NextAuth:', data);
          alert(`Estado da sessão: ${data?.user ? 'Autenticado como ' + data.user.email : 'Não autenticado'}`);
        })
        .catch(err => {
          console.error('Erro ao verificar sessão:', err);
          alert('Erro ao verificar sessão. Veja o console para detalhes.');
        });
    } catch (error) {
      console.error('Erro ao verificar sessão:', error);
    }
  };

  // Buscar dados do banco de dados
  const carregarVendas = async () => {
    setLoading(true);
    try {
      console.log('Iniciando carregamento de vendas...');
      
      // Definir headers de autenticação, caso necessário
      const headers = {};
      
      // Buscar vendas da API com mais detalhes sobre qualquer erro
      try {
        console.log('Fazendo requisição para /api/vendas...');
        const response = await api.get('/vendas', { 
          headers, 
          withCredentials: true // Garantir que os cookies sejam enviados 
        });
        
        console.log('Resposta da API de vendas (status):', response.status);
        console.log('Resposta da API de vendas (dados):', JSON.stringify(response.data, null, 2));
        
        if (!response.data || !Array.isArray(response.data)) {
          console.error('Resposta da API não é um array como esperado:', response.data);
          setError('Formato de dados inválido recebido da API.');
          setVendas([]);
          return;
        }
        
        // Mapear os dados para o formato esperado pela interface
        const vendasProcessadas = response.data.map((venda: any) => {
          console.log('Processando venda:', venda);
          
          // Verificar se os dados estão no formato esperado ou se precisam ser extraídos de metadata
          const cliente = venda.cliente || (venda.metadata && venda.metadata.cliente) || '';
          const tipo = venda.tipo || (venda.metadata && venda.metadata.tipo) || 'evento';
          
          const vendaProcessada = {
            id: venda.id,
            cliente: cliente,
            tipo: tipo,
            total: venda.total || 0,
            status: venda.status || 'PENDENTE',
            data: venda.createdAt || venda.data || new Date().toISOString(),
            evento: venda.event ? {
              id: venda.event.id,
              nome: venda.event.nome
            } : undefined,
            itens: venda.items || []
          };
          
          console.log('Venda processada:', vendaProcessada);
          return vendaProcessada;
        });
        
        console.log(`${vendasProcessadas.length} vendas processadas.`);
        setVendas(vendasProcessadas);
        setError('');
      } catch (apiError: any) {
        console.error('Erro na requisição à API:', apiError);
        
        if (apiError.response) {
          console.error('Status do erro:', apiError.response.status);
          console.error('Dados do erro:', apiError.response.data);
          setError(`Erro ao obter vendas: ${apiError.response.data?.error || apiError.response.data?.message || apiError.message}`);
        } else if (apiError.request) {
          console.error('Sem resposta do servidor:', apiError.request);
          setError('Sem resposta do servidor. Verifique sua conexão.');
        } else {
          console.error('Erro ao configurar requisição:', apiError.message);
          setError(`Erro ao configurar requisição: ${apiError.message}`);
        }
        
        // Em caso de erro, tentar usar dados de localStorage como fallback
        try {
          const storedVendas = localStorage.getItem('vendasCache');
          if (storedVendas) {
            console.log('Usando dados em cache do localStorage...');
            const parsedVendas = JSON.parse(storedVendas);
            setVendas(parsedVendas);
            setError(error + ' (Exibindo dados em cache)');
          }
        } catch (cacheError) {
          console.error('Erro ao usar cache:', cacheError);
        }
      }
    } catch (err) {
      console.error('Erro geral ao carregar vendas:', err);
      setError('Não foi possível carregar as vendas. Tente novamente mais tarde.');
      setVendas([]);
    } finally {
      setLoading(false);
    }
  };

  // Método alternativo para carregar vendas (para testes/depuração)
  const carregarVendasManualmente = async () => {
    setLoading(true);
    
    try {
      console.log('Tentando carregar vendas manualmente via fetch...');
      
      // Usar fetch diretamente em vez do axios
      const response = await fetch('/api/vendas', {
        method: 'GET',
        credentials: 'include', // Importante para enviar cookies
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta do fetch:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Dados obtidos via fetch:', data);
      
      // Usar os mesmos dados para processar como no método principal
      const vendasProcessadas = data.map((venda: any) => ({
        id: venda.id,
        cliente: venda.cliente || (venda.metadata && venda.metadata.cliente) || '',
        tipo: venda.tipo || (venda.metadata && venda.metadata.tipo) || 'evento',
        total: venda.total || 0,
        status: venda.status || 'PENDENTE',
        data: venda.createdAt || venda.data || new Date().toISOString(),
        evento: venda.event ? {
          id: venda.event.id,
          nome: venda.event.nome
        } : undefined,
        itens: venda.items || []
      }));
      
      console.log(`${vendasProcessadas.length} vendas processadas via fetch.`);
      
      // Atualizar estado e cachear
      setVendas(vendasProcessadas);
      setError('');
      
      // Salvar no localStorage para uso offline
      localStorage.setItem('vendasCache', JSON.stringify(vendasProcessadas));
      
    } catch (err) {
      console.error('Erro no método alternativo:', err);
      setError('Falha ao carregar dados manualmente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar data
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Função para formatar valor monetário
  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Filtrar vendas com base nos critérios
  const vendasFiltradas = vendas.filter(venda => {
    // Filtro por status
    if (filtro !== 'todas' && venda.status.toLowerCase() !== filtro) {
      return false;
    }
    
    // Filtro por período
    if (periodo !== 'todos') {
      const dataVenda = new Date(venda.data);
      const hoje = new Date();
      
      if (periodo === 'hoje') {
        return dataVenda.toDateString() === hoje.toDateString();
      } else if (periodo === 'semana') {
        const umaSemanaAtras = new Date();
        umaSemanaAtras.setDate(hoje.getDate() - 7);
        return dataVenda >= umaSemanaAtras;
      } else if (periodo === 'mes') {
        return dataVenda.getMonth() === hoje.getMonth() && 
               dataVenda.getFullYear() === hoje.getFullYear();
      }
    }
    
    // Filtro por evento
    if (filtroEvento !== 'todos') {
      if (venda.tipo !== 'evento' || !venda.evento || venda.evento.id !== filtroEvento) {
        return false;
      }
    }
    
    // Filtro por busca (cliente, ID ou evento)
    if (busca && !venda.cliente.toLowerCase().includes(busca.toLowerCase()) && 
        !venda.id.toLowerCase().includes(busca.toLowerCase()) && 
        !(venda.evento && venda.evento.nome.toLowerCase().includes(busca.toLowerCase()))) {
      return false;
    }
    
    return true;
  });

  // Calcular totais
  const totalVendas = vendasFiltradas.reduce((acc, venda) => acc + venda.total, 0);
  const totalFinalizadas = vendasFiltradas.filter(v => v.status === 'FINALIZADA').reduce((acc, venda) => acc + venda.total, 0);
  const totalPendentes = vendasFiltradas.filter(v => v.status === 'PENDENTE').reduce((acc, venda) => acc + venda.total, 0);

  // Função para finalizar uma venda pendente
  const finalizarVenda = async (id: string) => {
    try {
      await api.patch(`/vendas/${id}`, { status: 'FINALIZADA' });
      
      // Atualizar a lista de vendas após finalizar
      const vendasAtualizadas = vendas.map(venda => 
        venda.id === id ? { ...venda, status: 'FINALIZADA' as const } : venda
      );
      
      setVendas(vendasAtualizadas);
    } catch (err) {
      console.error('Erro ao finalizar venda:', err);
      alert('Não foi possível finalizar a venda. Tente novamente.');
    }
  };

  // Renderizar status com cores
  const renderizarStatus = (status: string) => {
    switch (status) {
      case 'FINALIZADA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Finalizada
          </span>
        );
      case 'PENDENTE':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock size={12} className="mr-1" />
            Pendente
          </span>
        );
      case 'CANCELADA':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            Cancelada
          </span>
        );
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
        <Link href="/vendas/nova">
          <Button variant="primary" className="flex items-center gap-2">
            <DollarSign size={16} />
            <span>Nova Venda</span>
          </Button>
        </Link>
      </div>

      {/* Resumo de Vendas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total de Vendas</p>
              <p className="text-xl font-bold text-gray-900">{formatarValor(totalVendas)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign size={20} className="text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vendas Finalizadas</p>
              <p className="text-xl font-bold text-green-600">{formatarValor(totalFinalizadas)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle size={20} className="text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Vendas Pendentes</p>
              <p className="text-xl font-bold text-yellow-600">{formatarValor(totalPendentes)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por cliente, ID ou evento..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="todas">Todos os Status</option>
              <option value="finalizada">Finalizadas</option>
              <option value="pendente">Pendentes</option>
              <option value="cancelada">Canceladas</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="todos">Todos os Períodos</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Este mês</option>
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filtroEvento}
              onChange={(e) => setFiltroEvento(e.target.value)}
            >
              <option value="todos">Todos os Eventos</option>
              {eventos.map((evento) => (
                <option key={evento.id} value={evento.id}>
                  {evento.nome}
                </option>
              ))}
            </select>
            
            <Button 
              variant="secondary" 
              className="flex items-center gap-2"
              onClick={carregarVendas}
              disabled={loading}
            >
              {loading ? 'Atualizando...' : 'Atualizar Dados'}
            </Button>
            
            <Button variant="secondary" className="flex items-center gap-2">
              <Download size={16} />
              <span>Exportar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de Vendas */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">Carregando vendas...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            {error}
          </div>
        ) : vendasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma venda encontrada com os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID da Venda
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evento
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendasFiltradas.map((venda) => (
                  <tr key={venda.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {venda.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venda.cliente}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {venda.tipo === 'evento' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <Calendar size={12} className="mr-1" />
                          {venda.evento?.nome || 'Evento'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Tag size={12} className="mr-1" />
                          Rifa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatarValor(venda.total)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {renderizarStatus(venda.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatarData(venda.data)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <Link href={`/vendas/${venda.id}`}>
                          <Button variant="secondary" size="sm">
                            Detalhes
                          </Button>
                        </Link>
                        {venda.status === 'PENDENTE' && (
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => finalizarVenda(venda.id)}
                          >
                            Finalizar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 