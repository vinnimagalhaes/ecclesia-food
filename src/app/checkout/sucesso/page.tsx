'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/ui/AppHeader';
import { PixPayment } from '@/components/PixPayment';

interface UltimoPedido {
  id: string;
  total: number;
  data: string;
  cliente: string;
  itensQuantidade: number;
  formaPagamento: string;
  customer?: {
    name: string;
    email: string;
    document_number: string;
    phone?: string;
  };
  documento?: string;
  document_number?: string;
  telefone?: string;
  email?: string;
}

export default function SucessoPage() {
  const router = useRouter();
  const [pedido, setPedido] = useState<UltimoPedido | null>(null);

  useEffect(() => {
    // Recuperar informações do último pedido
    const ultimoPedidoStr = localStorage.getItem('ultimoPedido');
    if (!ultimoPedidoStr) {
      router.push('/');
      return;
    }

    try {
      const ultimoPedido = JSON.parse(ultimoPedidoStr);
      console.log('Dados recebidos do localStorage:', ultimoPedido);
      setPedido(ultimoPedido);
    } catch (error) {
      console.error('Erro ao carregar informações do pedido:', error);
      router.push('/');
    }
  }, [router]);

  if (!pedido) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader
        title="Pedido Confirmado"
        showBackButton={false}
      />

      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Resumo do Pedido */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Pedido:</span> #{pedido.id}
              </p>
              <p>
                <span className="font-medium">Data:</span>{' '}
                {new Date(pedido.data).toLocaleString('pt-BR')}
              </p>
              <p>
                <span className="font-medium">Cliente:</span> {pedido.cliente}
              </p>
              <p>
                <span className="font-medium">Itens:</span> {pedido.itensQuantidade}
              </p>
              <p>
                <span className="font-medium">Total:</span>{' '}
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(pedido.total)}
              </p>
            </div>
          </div>

          {/* Pagamento PIX */}
          {pedido.formaPagamento === 'pix' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <PixPayment
                amount={pedido.total}
                customer={pedido.customer || {
                  name: pedido.cliente,
                  email: pedido.email || '',
                  document: pedido.documento || pedido.document_number || '',
                  phone: pedido.telefone || ''
                }}
                orderId={pedido.id}
                onSuccess={() => {
                  // Aqui você pode adicionar lógica adicional quando o pagamento for confirmado
                  console.log('Pagamento confirmado!');
                }}
              />
            </div>
          )}

          {/* Botão Voltar */}
          <div className="flex justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Voltar para o Início
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}