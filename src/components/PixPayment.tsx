import { useState, useEffect } from 'react';
import { QrCode, Copy, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PixPaymentProps {
  valor: number;
  chavePix: string;
  nomeChavePix: string;
  cidadeChavePix: string;
}

export function PixPayment({ valor, chavePix, nomeChavePix, cidadeChavePix }: PixPaymentProps) {
  const [copiado, setCopiado] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixCopiaECola, setPixCopiaECola] = useState<string>('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string>('');

  useEffect(() => {
    const gerarCodigoPix = async () => {
      try {
        setCarregando(true);
        setErro('');

        const response = await fetch('/api/pix/gerar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            valor,
            chavePix,
            nomeChavePix,
            cidadeChavePix,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao gerar código PIX');
        }

        const data = await response.json();
        setQrCodeUrl(data.qrcode);
        setPixCopiaECola(data.brcode);
      } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        setErro('Não foi possível gerar o código PIX. Por favor, tente novamente.');
      } finally {
        setCarregando(false);
      }
    };

    gerarCodigoPix();
  }, [valor, chavePix, nomeChavePix, cidadeChavePix]);

  const copiarCodigoPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
      setErro('Não foi possível copiar o código PIX');
    }
  };

  if (erro) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="h-5 w-5 text-primary-500" />
        <h2 className="text-lg font-semibold">Pagamento via PIX</h2>
      </div>

      <div className="space-y-6">
        {carregando ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-12 h-12 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Gerando QR Code PIX...</p>
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="flex flex-col items-center">
              {qrCodeUrl && (
                <img
                  src={qrCodeUrl}
                  alt="QR Code PIX"
                  className="w-64 h-64 border border-gray-200 rounded-lg p-2"
                />
              )}
            </div>

            {/* Código Copia e Cola */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Código PIX Copia e Cola:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pixCopiaECola}
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

            {/* Instruções */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium text-gray-900">Como pagar:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-600 text-sm">
                <li>Abra o app do seu banco</li>
                <li>Escolha pagar via PIX</li>
                <li>Escaneie o QR Code ou cole o código PIX</li>
                <li>Confirme as informações e finalize o pagamento</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 