'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { PixPayment } from '@/components/PixPayment';
import Link from 'next/link';

type UltimoPedido = {
  id: string;
  total: number;
  data: string;
  cliente: string;
  itensQuantidade: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix';
};

export default function SucessoPage() {
  const router = useRouter();
  const [pedido, setPedido] = useState<UltimoPedido | null>(null);
  const [configPagamento, setConfigPagamento] = useState<any>(null);

  useEffect(() => {
    // Recuperar informações do último pedido
    const ultimoPedidoStr = localStorage.getItem('ultimoPedido');
    if (!ultimoPedidoStr) {
      router.push('/');
      return;
    }

    try {
      const ultimoPedido = JSON.parse(ultimoPedidoStr);
      setPedido(ultimoPedido);

      // Se for pagamento PIX, carregar as configurações
      if (ultimoPedido.formaPagamento === 'pix') {
        carregarConfiguracoes();
      }
    } catch (error) {
      console.error('Erro ao carregar informações do pedido:', error);
      router.push('/');
    }
  }, [router]);

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch('/api/configuracoes/publica');
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }
      const data = await response.json();
      setConfigPagamento({
        chavePix: data.configPagamento.chavePix,
        nomeChavePix: data.configPagamento.nomeChavePix || data.perfilIgreja.nome,
        cidadeChavePix: data.configPagamento.cidadeChavePix || data.perfilIgreja.cidade
      });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

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
        sticky={true}
      />

      <div className="flex-1 p-4">
        <div className="space-y-4">
          {/* Mensagem de sucesso */}
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  Pedido realizado com sucesso!
                </p>
              </div>
            </div>
          </div>

          {/* Detalhes do pedido */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes do Pedido</h2>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Número do pedido:</span> {pedido.id}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Cliente:</span> {pedido.cliente}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total:</span> {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.total)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Forma de pagamento:</span> {
                  pedido.formaPagamento === 'pix' ? 'PIX' :
                  pedido.formaPagamento === 'cartao' ? 'Cartão' : 'Dinheiro'
                }
              </p>
            </div>
          </div>

          {/* Componente PIX se for pagamento via PIX */}
          {pedido.formaPagamento === 'pix' && configPagamento && (
            <PixPayment
              valor={pedido.total}
              chavePix={configPagamento.chavePix}
              nomeChavePix={configPagamento.nomeChavePix}
              cidadeChavePix={configPagamento.cidadeChavePix}
            />
          )}

          {/* Instruções específicas para cada forma de pagamento */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Próximos Passos</h2>
            {pedido.formaPagamento === 'pix' ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  1. Utilize o QR Code ou o código PIX acima para realizar o pagamento
                </p>
                <p className="text-sm text-gray-600">
                  2. Após o pagamento, guarde o comprovante
                </p>
                <p className="text-sm text-gray-600">
                  3. Seu pedido será processado assim que o pagamento for confirmado
                </p>
              </div>
            ) : pedido.formaPagamento === 'cartao' ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  1. Tenha seu cartão em mãos no momento da entrega
                </p>
                <p className="text-sm text-gray-600">
                  2. O pagamento será processado na entrega
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  1. Separe o valor exato para facilitar o troco
                </p>
                <p className="text-sm text-gray-600">
                  2. O pagamento será realizado na entrega
                </p>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button variant="primary" className="w-full">
                Voltar para o Início
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}