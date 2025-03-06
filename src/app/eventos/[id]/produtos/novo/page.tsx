'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft, Save, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

export default function NovoProdutoPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventoNome, setEventoNome] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nome: '',
    preco: '',
    descricao: '',
    categoria: '',
    imageUrl: '',
  });

  // Redirecionar para login se não estiver autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/eventos/${params.id}/produtos/novo`);
    } else if (status === 'authenticated') {
      // Carregar informações do evento para exibir o nome
      fetchEventoInfo();
    }
  }, [router, status, params.id]);

  const fetchEventoInfo = async () => {
    try {
      const response = await fetch(`/api/eventos/${params.id}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar evento');
      }
      
      const evento = await response.json();
      setEventoNome(evento.nome);
    } catch (error) {
      console.error('Erro ao carregar informações do evento:', error);
      toast.error('Não foi possível carregar as informações do evento');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    // Verificar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Criar preview da imagem
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Enviar para o servidor
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao fazer upload da imagem');
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        imageUrl: data.url
      }));
      toast.success('Imagem carregada com sucesso!');
    } catch (error) {
      console.error('Erro no upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validações básicas
      if (!formData.nome || !formData.preco) {
        toast.error('Por favor, preencha os campos obrigatórios (nome e preço).');
        return;
      }
      
      // Verificar se o preço é um número positivo
      const preco = parseFloat(formData.preco);
      if (isNaN(preco) || preco <= 0) {
        toast.error('O preço deve ser um número positivo.');
        return;
      }
      
      // Enviar dados para a API
      const response = await fetch('/api/produtos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          eventId: params.id,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar produto');
      }
      
      const produto = await response.json();
      
      toast.success('Produto criado com sucesso!');
      router.push(`/eventos/${params.id}`);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar produto. Tente novamente.');
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
          <h1 className="text-2xl font-bold mb-2">Novo Produto</h1>
          <p className="text-gray-600">
            Adicione um novo produto para o evento: {eventoNome || 'Carregando...'}
          </p>
        </div>
        <Link
          href={`/eventos/${params.id}`}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
        >
          <ArrowLeft size={16} />
          Voltar para o evento
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto *
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
              <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-1">
                Preço (R$) *
              </label>
              <input
                type="number"
                id="preco"
                name="preco"
                value={formData.preco}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                placeholder="0.00"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">
                Categoria
              </label>
              <select
                id="categoria"
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione uma categoria</option>
                <option value="comida">Comida</option>
                <option value="bebida">Bebida</option>
                <option value="doce">Doce</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Imagem do Produto
              </label>
              
              {!imagePreview ? (
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    <div className="flex justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="flex text-sm text-gray-600">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                        <span>Selecione uma imagem</span>
                        <input 
                          id="file-upload" 
                          name="file-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF até 5MB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative mt-1 w-full h-40 border border-gray-200 rounded-md overflow-hidden">
                  <Image 
                    src={imagePreview} 
                    alt="Preview da imagem" 
                    fill
                    className="object-cover"
                  />
                  <button 
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              {uploadingImage && (
                <div className="mt-2 text-sm text-gray-500 flex items-center">
                  <span className="mr-2 inline-block animate-spin rounded-full h-4 w-4 border-2 border-b-transparent border-primary-600"></span>
                  Enviando imagem...
                </div>
              )}
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
              disabled={isSubmitting || uploadingImage}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-white border-r-2 border-white border-b-2 border-transparent"></span>
              ) : (
                <Save size={16} />
              )}
              Salvar Produto
            </button>
          </div>
        </form>
      </div>
    </>
  );
} 