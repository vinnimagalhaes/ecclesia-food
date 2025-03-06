'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Evento {
  id: string;
  nome: string;
  data: string;
  local: string;
  descricao: string;
}

export default function EditarEventoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [evento, setEvento] = useState<Evento>({
    id: '',
    nome: '',
    data: '',
    local: '',
    descricao: ''
  });

  useEffect(() => {
    // Redirecionar para login se não estiver autenticado
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/eventos/' + params.id + '/editar');
    } else if (status === 'authenticated') {
      fetchEvento();
    }
  }, [params.id, router, status]);

  const fetchEvento = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/eventos/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar evento');
      }
      
      const data = await response.json();
      
      // Formatar data para o formato esperado pelo input type="datetime-local"
      const dataObj = new Date(data.data);
      const dataFormatada = new Date(dataObj.getTime() - dataObj.getTimezoneOffset() * 60000)
        .toISOString()
        .substring(0, 16);
      
      setEvento({
        ...data,
        data: dataFormatada
      });
    } catch (error) {
      console.error('Erro ao carregar evento:', error);
      setError('Não foi possível carregar os detalhes do evento.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEvento(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!evento.nome || !evento.data || !evento.local) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      setIsSaving(true);
      setError('');
      
      console.log('Enviando dados:', evento);
      
      const response = await fetch(`/api/eventos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(evento)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Resposta de erro:', errorData);
        throw new Error(errorData.message || 'Falha ao atualizar evento');
      }
      
      toast.success('Evento atualizado com sucesso!');
      router.push(`/eventos/${params.id}`);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      setError('Ocorreu um erro ao atualizar o evento. Por favor, tente novamente.');
      toast.error('Falha ao atualizar evento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm('Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.');
    
    if (!confirmDelete) return;
    
    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/eventos/${params.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Falha ao excluir evento');
      }
      
      toast.success('Evento excluído com sucesso!');
      router.push('/eventos');
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      toast.error('Falha ao excluir evento');
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  if (error && !evento.id) {
    return (
      <div className="p-6">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()} 
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2" size={16} />
            Voltar
          </button>
        </div>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <Link 
          href={`/eventos/${params.id}`}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2" size={16} />
          Voltar para detalhes
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6">Editar Evento</h1>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Evento *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={evento.nome}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Digite o nome do evento"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Hora *
                </label>
                <input
                  type="datetime-local"
                  id="data"
                  name="data"
                  value={evento.data}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="local" className="block text-sm font-medium text-gray-700 mb-1">
                  Local *
                </label>
                <input
                  type="text"
                  id="local"
                  name="local"
                  value={evento.local}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Local do evento"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                id="descricao"
                name="descricao"
                value={evento.descricao}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Descreva os detalhes do evento"
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
              >
                <Trash2 size={16} />
                {isDeleting ? 'Excluindo...' : 'Excluir Evento'}
              </button>
              
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                <Save size={16} />
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 