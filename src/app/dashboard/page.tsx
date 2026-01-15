'use client';

import { useEffect, useState } from 'react';
import { Calendar, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

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

type AtividadeRecente = {
  id: string;
  tipo: 'evento' | 'produto' | 'venda';
  nome: string;
  data: Date;
  descricao: string;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [totalVendasMes, setTotalVendasMes] = useState(0);
  const [vendasPendentes, setVendasPendentes] = useState(0);
  const [vendasFinalizadas, setVendasFinalizadas] = useState(0);

  // Proteger rota
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  // Simular busca de dados (Depois vamos conectar com Firebase)
  useEffect(() => {
    if (user) {
      // Aqui vamos buscar do Firestore
      setLoading(false);
    }
  }, [user]);

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
  
  if (authLoading || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-pulse text-gray-500">Carregando dados do dashboard...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Bem-vindo, {user.displayName || user.email}</p>
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

      {/* Placeholder para quando tiver dados */}
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <p className="text-gray-500">Seus dados aparecerão aqui assim que você criar eventos e produtos.</p>
      </div>
    </div>
  );
}
