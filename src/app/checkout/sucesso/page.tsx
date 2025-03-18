'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import Link from 'next/link';
import { QrCode, Copy, CheckCircle } from 'lucide-react';

interface UltimoPedido {
  id: string;
  total: number;
  data: string;
  cliente: string;
  itensQuantidade: number;
  formaPagamento: string;
}

interface ConfigPagamento {
  aceitaDinheiro: boolean;
  aceitaCartao: boolean;
  aceitaPix: boolean;
  chavePix: string;
  tipoPix: string;
  taxaServico: number;
  qrCodePix: string;
}

// Código PIX estático para uso enquanto a geração dinâmica não funciona
const CODIGO_PIX_ESTATICO = "00020126330014BR.GOV.BCB.PIX0111444707018905204000053039865802BR5924Vinicius Souza Magalhaes6009SAO PAULO62140510i7ImBv3mlq6304F3B4";

export default function SucessoPage() {
  const router = useRouter();
  const [pedido, setPedido] = useState<UltimoPedido | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [configPagamento, setConfigPagamento] = useState<ConfigPagamento | null>(null);

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
    } catch (error) {
      console.error('Erro ao carregar informações do pedido:', error);
      router.push('/');
    }
  }, [router]);

  // Carregar configurações de pagamento
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const response = await fetch('/api/configuracoes/publica');
        if (!response.ok) {
          throw new Error('Erro ao carregar configurações');
        }
        const data = await response.json();
        setConfigPagamento(data.configPagamento);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    carregarConfiguracoes();
  }, []);

  const copiarCodigoPix = async () => {
    try {
      await navigator.clipboard.writeText(CODIGO_PIX_ESTATICO);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
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
                <span className="font-medium">Forma de pagamento:</span> {pedido.formaPagamento}
              </p>
            </div>
          </div>

          {/* Componente PIX se for pagamento via PIX */}
          {pedido.formaPagamento === 'pix' && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold">Pagamento PIX</h2>
              </div>

              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <img
                    src={configPagamento?.qrCodePix}
                    alt="QR Code PIX"
                    className="w-64 h-64 border border-gray-200 rounded-lg p-2"
                  />
                </div>

                {/* Código Copia e Cola */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Código PIX Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={CODIGO_PIX_ESTATICO}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600 text-sm"
                    />
                    <Button
                      onClick={copiarCodigoPix}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {copiado ? (
                        <>
                          <CheckCircle size={16} className="text-green-500" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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