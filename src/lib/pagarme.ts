import { PAGARME_API_KEY } from '@/config/env';

// URL base da API da Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// Verificar se a chave da API está presente
if (!PAGARME_API_KEY) {
  console.error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
  throw new Error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
}

console.log('Iniciando conexão com API da Pagar.me...');
console.log('API Key presente:', !!PAGARME_API_KEY);

interface Customer {
  name: string;
  email: string;
  document_number: string;
}

interface PaymentRequest {
  amount: number;
  customer: Customer;
  orderId: string;
}

export async function createPixPayment({ amount, customer, orderId }: PaymentRequest) {
  try {
    console.log('Iniciando criação de pagamento PIX:', {
      amount,
      customer,
      orderId,
    });

    // Validar dados antes de enviar
    if (!amount || amount <= 0) {
      throw new Error('Valor do pagamento inválido');
    }

    if (!customer.name || !customer.email || !customer.document_number) {
      throw new Error('Dados do cliente incompletos');
    }

    if (!orderId) {
      throw new Error('ID do pedido não fornecido');
    }

    const requestBody = {
      code: orderId,
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document_number,
        type: 'individual',
        document_type: 'cpf',
      },
      items: [
        {
          amount,
          description: 'Pagamento via PIX',
          quantity: 1,
          code: 'PIX',
        },
      ],
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: 3600, // 1 hora
            additional_information: [
              {
                name: 'Pedido',
                value: orderId,
              },
            ],
          },
        },
      ],
      closed: true,
      status: 'pending',
    };

    console.log('Enviando requisição para Pagar.me:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${PAGARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Resposta da Pagar.me:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar pagamento');
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    throw error;
  }
}

export async function getTransactionStatus(orderId: string) {
  try {
    console.log('Verificando status do pedido:', orderId);

    const response = await fetch(`${PAGARME_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Resposta da Pagar.me:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao verificar status');
    }

    return data;
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
} 