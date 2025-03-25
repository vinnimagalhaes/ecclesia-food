import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface PixPaymentProps {
  amount: number;
  customer: {
    name: string;
    email: string;
    document_number: string;
  };
  orderId: string;
  onSuccess?: () => void;
}

export function PixPayment({
  amount,
  customer,
  orderId,
  onSuccess,
}: PixPaymentProps) {
  const [qrCode, setQrCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    createPayment();
  }, []);

  const createPayment = async () => {
    try {
      console.log('Iniciando criação de pagamento PIX:', {
        amount,
        customer,
        orderId,
      });

      const response = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          customer,
          orderId,
        }),
      });

      const data = await response.json();
      console.log('Resposta da API:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar pagamento');
      }

      if (!data.data?.charges?.[0]?.last_transaction?.qr_code) {
        throw new Error('QR Code não encontrado na resposta');
      }

      setQrCode(data.data.charges[0].last_transaction.qr_code);
      setIsLoading(false);
      startStatusCheck(orderId);
    } catch (error) {
      console.error('Erro detalhado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao gerar pagamento PIX';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const startStatusCheck = (id: string) => {
    setIsCheckingStatus(true);
    const interval = setInterval(async () => {
      try {
        console.log('Verificando status do pedido:', id);
        const response = await fetch(`/api/payments/pix?transactionId=${id}`);
        const data = await response.json();
        console.log('Status do pedido:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao verificar status');
        }

        const status = data.data?.charges?.[0]?.status;
        if (status === 'paid') {
          clearInterval(interval);
          setIsCheckingStatus(false);
          toast.success('Pagamento confirmado!');
          onSuccess?.();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
        clearInterval(interval);
        setIsCheckingStatus(false);
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(interval);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center p-6 space-y-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
        <button
          onClick={createPayment}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 space-y-4">
      <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
      <div className="bg-white p-4 rounded-lg shadow-md">
        {qrCode && (
          <img
            src={qrCode}
            alt="QR Code PIX"
            className="w-64 h-64"
          />
        )}
      </div>
      <p className="text-sm text-gray-600">
        Escaneie o QR Code com seu aplicativo de pagamento
      </p>
      {isCheckingStatus && (
        <p className="text-sm text-primary">
          Aguardando confirmação do pagamento...
        </p>
      )}
    </div>
  );
} 