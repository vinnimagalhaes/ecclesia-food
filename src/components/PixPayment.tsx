import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface PixPaymentProps {
  amount: number;
  customer: {
    name: string;
    email: string;
    document_number?: string;
    document?: string;
    phone?: string;
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
  const { data: session } = useSession();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixCopyPaste, setPixCopyPaste] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    handlePayment();
  }, []);

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!session) {
        throw new Error('Usuário não autenticado');
      }

      // Validar dados do cliente
      if (!customer.name || !customer.email || (!customer.document_number && !customer.document)) {
        throw new Error('Dados do cliente incompletos');
      }

      // Validar telefone do cliente
      if (!customer.phone) {
        throw new Error('Telefone do cliente não fornecido. Este campo é obrigatório para pagamento PIX.');
      }

      // Limpar telefone para conter apenas números
      const phone = customer.phone.replace(/\D/g, '');
      if (phone.length < 10) {
        throw new Error('Telefone do cliente inválido. O número deve ter pelo menos 10 dígitos.');
      }

      // Limpar documento para conter apenas números
      const document = (customer.document_number || customer.document || '').replace(/\D/g, '');
      if (document.length !== 11 && document.length !== 14) {
        throw new Error('Documento do cliente inválido. CPF deve ter 11 dígitos e CNPJ 14 dígitos.');
      }

      // Validar valor
      if (!amount || amount <= 0) {
        throw new Error('Valor do pagamento inválido');
      }

      // Validar ID do pedido
      if (!orderId) {
        throw new Error('ID do pedido não fornecido');
      }

      console.log('Payload enviado para a API:', {
        amount,
        customer: {
          name: customer.name,
          email: customer.email,
          document,
          phone
        },
        orderId,
      });

      const response = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          customer: {
            name: customer.name,
            email: customer.email,
            document: document,
            phone: phone,
          },
          orderId,
        }),
      });

      const data = await response.json();
      console.log('Resposta da API:', data);

      if (!response.ok) {
        const errorMessage = data.error || 'Erro ao criar pagamento';
        console.error('Erro na resposta da API:', errorMessage, data.details);
        throw new Error(errorMessage);
      }

      // Verificar se temos o ID do pagamento
      if (!data.id) {
        console.error('ID do pagamento não encontrado na resposta:', data);
        throw new Error('ID do pagamento não encontrado na resposta');
      }

      // Preferir QR Code URL se disponível
      if (data.qr_code_url) {
        console.log('Usando QR Code URL:', data.qr_code_url);
        setQrCodeUrl(data.qr_code_url);
      } else if (data.qr_code) {
        // Se não tiver URL, usar o QR Code base64
        console.log('Usando QR Code base64');
        try {
          // Limpar qualquer caractere estranho antes de definir como base64
          const cleanBase64 = data.qr_code.replace(/\s/g, '');
          const validBase64 = cleanBase64.match(/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)?$/);
          
          if (validBase64) {
            setQrCodeUrl(`data:image/png;base64,${cleanBase64}`);
          } else {
            console.error('QR Code não é um base64 válido:', data.qr_code);
            throw new Error('QR Code inválido');
          }
        } catch (e) {
          console.error('Erro ao processar QR Code base64:', e);
          throw new Error('Erro ao processar QR Code');
        }
      } else {
        console.error('QR code não encontrado na resposta:', data);
        throw new Error('QR code não encontrado na resposta');
      }

      // Salvar o código PIX Copia e Cola se disponível
      if (data.pix_copy_paste) {
        setPixCopyPaste(data.pix_copy_paste);
      }
      
      // Iniciar verificação de status apenas se tivermos o ID
      if (data.id) {
        startStatusCheck(data.id);
      } else {
        console.error('ID do pagamento não encontrado, não é possível verificar status');
      }
    } catch (err) {
      console.error('Erro ao criar pagamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const startStatusCheck = (id: string) => {
    if (!id) {
      console.error('ID do pagamento não disponível');
      return;
    }

    setIsCheckingStatus(true);
    console.log('Iniciando verificação de status para o pagamento:', id);
    
    const interval = setInterval(async () => {
      try {
        if (!session) {
          throw new Error('Usuário não autenticado');
        }

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
          onClick={handlePayment}
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
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="QR Code PIX"
            className="w-64 h-64"
            onError={(e) => {
              console.error('Erro ao carregar QR Code:', e);
              setError('Erro ao carregar QR Code. Por favor, tente novamente.');
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-64 h-64 bg-gray-100">
            <p className="text-gray-500">Não foi possível carregar o QR Code</p>
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600">
        Escaneie o QR Code com seu aplicativo de pagamento
      </p>
      
      {pixCopyPaste && (
        <div className="mt-4 w-full max-w-md">
          <p className="text-sm font-medium text-gray-700 mb-1">Ou copie o código PIX:</p>
          <div className="relative">
            <input
              type="text"
              value={pixCopyPaste}
              readOnly
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md bg-gray-50"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(pixCopyPaste);
                toast.success('Código PIX copiado!');
              }}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-dark"
            >
              Copiar
            </button>
          </div>
        </div>
      )}
      
      {isCheckingStatus && (
        <p className="text-sm text-primary">
          Aguardando confirmação do pagamento...
        </p>
      )}
    </div>
  );
} 