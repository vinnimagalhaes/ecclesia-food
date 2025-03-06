'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NovoEventoPage() {
  const router = useRouter();
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nome: '',
    local: '',
    data: '',
    hora: '',
    capacidade: '',
    descricao: '',
  });

  // Redirecionar para login se não estiver autenticado
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/eventos/novo');
    }
  }, [router, status]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validações básicas
      if (!formData.nome || !formData.local || !formData.data || !formData.hora || !formData.capacidade) {
        toast.error('Por favor, preencha todos os campos obrigatórios.');
        return;
      }
      
      // Verificar se a capacidade é um número positivo
      const capacidade = parseInt(formData.capacidade);
      if (isNaN(capacidade) || capacidade <= 0) {
        toast.error('A capacidade deve ser um número positivo.');
        return;
      }
      
      // Enviar dados para a API
      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar evento');
      }
      
      const evento = await response.json();
      
      toast.success('Evento criado com sucesso!');
      router.push(`/eventos/${evento.id}`);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar evento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Novo Evento</h1>
          <p className="text-gray-600">Crie um novo evento para sua igreja</p>
        </div>
        <Link
          href="/eventos"
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Evento *
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                value={formData.local}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                id="data"
                name="data"
                value={formData.data}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="hora" className="block text-sm font-medium text-gray-700 mb-1">
                Hora *
              </label>
              <input
                type="time"
                id="hora"
                name="hora"
                value={formData.hora}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="capacidade" className="block text-sm font-medium text-gray-700 mb-1">
                Capacidade (quantidade de pessoas) *
              </label>
              <input
                type="number"
                id="capacidade"
                name="capacidade"
                value={formData.capacidade}
                onChange={handleChange}
                min="1"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white border-r-2 border-white border-b-2 border-transparent"></span>
              ) : (
                <Save size={16} />
              )}
              Salvar Evento
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 