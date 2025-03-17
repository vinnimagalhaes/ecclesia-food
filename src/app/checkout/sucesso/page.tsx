'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import Link from 'next/link';
import { QrCode, Copy, CheckCircle } from 'lucide-react';

type UltimoPedido = {
  id: string;
  total: number;
  data: string;
  cliente: string;
  itensQuantidade: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix';
};

// Código PIX estático para uso enquanto a geração dinâmica não funciona
const CODIGO_PIX_ESTATICO = "00020126580014BR.GOV.BCB.PIX0136d90c0d10-c973-4449-a888-4efb01455f4452040000530398654041.005802BR5918MARCOS VINICIUS S6009SAO PAULO62290525mpagamento*ecclesia123456789630480A8";

// QR Code em base64
const QR_CODE_PIX_ESTATICO = "data:image/png;base64,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";

export default function SucessoPage() {
  const router = useRouter();
  const [pedido, setPedido] = useState<UltimoPedido | null>(null);
  const [copiado, setCopiado] = useState(false);

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
                <span className="font-medium">Forma de pagamento:</span> {
                  pedido.formaPagamento === 'pix' ? 'PIX' :
                  pedido.formaPagamento === 'cartao' ? 'Cartão' : 'Dinheiro'
                }
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
                    src={QR_CODE_PIX_ESTATICO}
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