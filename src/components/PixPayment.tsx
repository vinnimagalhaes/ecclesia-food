import { useState, useEffect, useRef } from 'react';
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
  const [isConnected, setIsConnected] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'failed'>('pending');
  const [error, setError] = useState<string>('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const paymentIdRef = useRef<string>('');

  useEffect(() => {
    handlePayment();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const startEventSource = (paymentId: string) => {
    // Se já existe uma conexão, fechá-la
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    try {
      console.log('Iniciando SSE para o pagamento:', paymentId);
      const eventSource = new EventSource(`/api/payment-events?transactionId=${paymentId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('Conexão SSE estabelecida');
        setIsConnected(true);
      };

      eventSource.onerror = (error) => {
        console.error('Erro na conexão SSE:', error);
        setIsConnected(false);
        
        // Em vez de fechar imediatamente, tentar reconectar
        setTimeout(() => {
          console.log('Tentando reconectar SSE...');
          // Se ainda estiver no mesmo estado, tentar reconectar
          if (paymentStatus === 'pending' && paymentIdRef.current === paymentId) {
            startEventSource(paymentId);
          }
        }, 5000);
      };

      eventSource.addEventListener('message', (event) => {
        try {
          console.log('Evento SSE bruto recebido:', event.data);
          const data = JSON.parse(event.data);
          console.log('Evento SSE processado:', data);

          if (data.type === 'connected') {
            console.log('Conexão SSE confirmada');
            setIsConnected(true);
          } else if (data.type === 'status') {
            console.log('Status atual do pagamento:', data.data.status);
            updatePaymentStatus(data.data.status);
          } else if (data.type === 'payment_update') {
            console.log('Atualização de pagamento recebida:', data.data);
            updatePaymentStatus(data.data.status);
          } else if (data.type === 'ping') {
            console.log('Ping recebido:', data);
          } else {
            console.log('Tipo de evento desconhecido:', data.type);
          }
        } catch (error) {
          console.error('Erro ao processar evento SSE:', error);
        }
      });

      return eventSource;
    } catch (error) {
      console.error('Erro ao iniciar EventSource:', error);
      
      // Tentar reconectar após um tempo
      setTimeout(() => {
        if (paymentStatus === 'pending') {
          console.log('Tentando reconectar após erro...');
          startEventSource(paymentId);
        }
      }, 5000);
      
      return null;
    }
  };

  const updatePaymentStatus = (status: string) => {
    console.log('Atualizando status do pagamento:', status);
    const normalizedStatus = status.toUpperCase();
    
    if (normalizedStatus === 'PAID' || normalizedStatus === 'CONFIRMED') {
      console.log('Pagamento confirmado!');
      setPaymentStatus('paid');
      
      // Fechar conexão SSE apenas após confirmar que o estado foi atualizado
      setTimeout(() => {
        if (eventSourceRef.current) {
          console.log('Fechando conexão SSE após pagamento confirmado');
          eventSourceRef.current.close();
        }
        // Chamar callback de sucesso
        onSuccess?.();
      }, 500);
      
      toast.success('Pagamento confirmado!');
    } else if (normalizedStatus === 'FAILED' || normalizedStatus === 'CANCELED' || normalizedStatus === 'CANCELLED') {
      console.log('Pagamento falhou ou foi cancelado');
      setPaymentStatus('failed');
      
      setTimeout(() => {
        if (eventSourceRef.current) {
          console.log('Fechando conexão SSE após pagamento falhar');
          eventSourceRef.current.close();
        }
      }, 500);
      
      toast.error('Pagamento falhou ou foi cancelado.');
    } else {
      console.log('Status de pagamento não processado:', normalizedStatus);
    }
  };

  const handlePayment = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Remover verificação obrigatória de autenticação
      // Pagamentos podem ser feitos por usuários não autenticados
      console.log('Status da sessão:', session ? 'Autenticado' : 'Não autenticado');

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

      // Salvar o ID do pagamento
      paymentIdRef.current = data.id;

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

      // Tentar obter o PIX copia e cola (verificar vários campos possíveis)
      const pixText = data.pix_copy_paste || data.qr_code_text || data.pix_code || data.pix_text;
      
      if (pixText) {
        console.log('Código PIX copia e cola encontrado:', pixText);
        setPixCopyPaste(pixText);
      } else {
        console.log('Código PIX copia e cola não encontrado na resposta padrão, verificando campos aninhados');
        
        // Tentar encontrar em campos aninhados
        if (data.last_transaction) {
          const nestedPixText = data.last_transaction.qr_code_text || 
                              data.last_transaction.pix_code_text || 
                              data.last_transaction.pix_code;
          
          if (nestedPixText) {
            console.log('Código PIX encontrado em last_transaction:', nestedPixText);
            setPixCopyPaste(nestedPixText);
          } else if (data.last_transaction.additional_information?.pix_code) {
            console.log('Código PIX encontrado em additional_information:', data.last_transaction.additional_information.pix_code);
            setPixCopyPaste(data.last_transaction.additional_information.pix_code);
          }
        }
        
        // Se ainda não encontrou, procurar em outros lugares
        if (!pixCopyPaste && data.charges && data.charges.length > 0) {
          const charge = data.charges[0];
          if (charge.last_transaction) {
            const chargePixText = charge.last_transaction.qr_code_text || 
                                charge.last_transaction.pix_code_text || 
                                charge.last_transaction.pix_code;
                                
            if (chargePixText) {
              console.log('Código PIX encontrado em charges[0].last_transaction:', chargePixText);
              setPixCopyPaste(chargePixText);
            } else if (charge.last_transaction.additional_information?.pix_code) {
              console.log('Código PIX encontrado em charges[0].additional_information:', charge.last_transaction.additional_information.pix_code);
              setPixCopyPaste(charge.last_transaction.additional_information.pix_code);
            }
          }
        }
        
        // Se ainda não tiver o código PIX, logar aviso
        if (!pixCopyPaste) {
          console.warn('Não foi possível encontrar o código PIX para cópia em nenhum campo');
        }
      }
      
      // Iniciar conexão SSE para receber atualizações em tempo real
      startEventSource(data.id);
    } catch (err) {
      console.error('Erro ao criar pagamento:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pagamento');
    } finally {
      setIsLoading(false);
    }
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
      {paymentStatus === 'paid' ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-green-700">Pagamento Confirmado!</h2>
          <p className="text-gray-600 text-center">
            Seu pagamento foi processado com sucesso.
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold">Pagamento via PIX</h2>
          {isConnected ? (
            <div className="bg-green-50 px-3 py-1 rounded-full text-xs text-green-600 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Conectado
            </div>
          ) : (
            <div className="bg-yellow-50 px-3 py-1 rounded-full text-xs text-yellow-600 flex items-center">
              <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
              Reconectando...
            </div>
          )}
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
          
          <p className="text-sm text-primary">
            Aguardando confirmação do pagamento...
          </p>
          
          <button
            onClick={() => {
              toast.info('Verificando status do pagamento...');
              if (paymentIdRef.current) {
                if (eventSourceRef.current) {
                  eventSourceRef.current.close();
                }
                startEventSource(paymentIdRef.current);
              }
            }}
            className="mt-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Verificar status
          </button>
        </>
      )}
    </div>
  );
} 