'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { PlusCircle, Calendar, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/Switch';

// Defina o tipo de evento
interface Evento {
  id: string;
  nome: string;
  data: string;
  local: string;
  descricao?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function EventosAdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('todos');

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (!authLoading && !user) {
      router.push('/auth/login');
    } else if (user) {
      // Carregar dados de eventos quando autenticado
      fetchEventos();
    }
  }, [router, user, authLoading]);

  const fetchEventos = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // TODO: Implementar busca no Firestore
      // const snapshot = await getDocs(collection(db, 'eventos'));
      // ...
      
      setEventos([]); // Dados vazios por enquanto
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setError('Não foi possível carregar os eventos. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para alternar o status do evento
  const toggleEventoStatus = async (eventoId: string, currentStatus: string) => {
    try {
      // TODO: Implementar update no Firestore
      
      // Atualizar a lista de eventos localmente
      setEventos(eventos.map(evento => {
        if (evento.id === eventoId) {
          return {
            ...evento,
            status: evento.status === 'ATIVO' ? 'INATIVO' : 'ATIVO'
          };
        }
        return evento;
      }));
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Não foi possível atualizar o status do evento. Tente novamente.');
    }
  };

  // Filtrar eventos com base na busca e no filtro
  const filteredEventos = eventos.filter(evento => {
    // Aplicar filtro de busca
    if (searchTerm && !evento.nome.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Aplicar filtro de status
    if (filter === 'ativos') {
      return new Date(evento.data) >= new Date();
    } else if (filter === 'passados') {
      return new Date(evento.data) < new Date();
    }
    
    return true;
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecionamento acontece no useEffect
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Gerenciamento de Eventos</h1>
        <p className="text-gray-600">Gerencie os eventos da sua igreja e seus produtos</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar eventos..."
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
          <select 
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="todos">Todos os eventos</option>
            <option value="ativos">Eventos ativos</option>
            <option value="passados">Eventos passados</option>
          </select>
        </div>
        <Link 
          href="/eventos/novo" 
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
        >
          <PlusCircle size={16} />
          Novo Evento
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse">Carregando eventos...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      ) : filteredEventos.length === 0 ? (
        <div className="bg-gray-50 p-8 text-center rounded-lg">
          <p className="text-gray-600 mb-4">Nenhum evento encontrado.</p>
          <Link 
            href="/eventos/novo" 
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <PlusCircle size={16} />
            Criar Novo Evento
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEventos.map((evento) => (
            <div key={evento.id} className="bg-white rounded-lg shadow-sm hover:shadow transition p-6 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{evento.nome}</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${evento.status === 'ATIVO' ? 'text-green-600' : 'text-gray-500'}`}>
                    {evento.status === 'ATIVO' ? 'Ativo' : 'Inativo'}
                  </span>
                  <Switch
                    checked={evento.status === 'ATIVO'}
                    onCheckedChange={() => toggleEventoStatus(evento.id, evento.status)}
                  />
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-gray-600">
                  <Calendar size={16} className="mr-2" />
                  <span>{new Date(evento.data).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin size={16} className="mr-2" />
                  <span>{evento.local}</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Link 
                  href={`/eventos/${evento.id}`}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition flex-1 text-center"
                >
                  Ver Detalhes
                </Link>
                <Link 
                  href={`/eventos/${evento.id}/editar`}
                  className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-md hover:bg-gray-100 transition flex-1 text-center"
                >
                  Editar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
