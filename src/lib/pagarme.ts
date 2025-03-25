import { PAGARME_API_KEY } from '@/config/env';

// URL base da API da Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

// Verificar se a chave da API está presente
if (!PAGARME_API_KEY) {
  console.error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
  throw new Error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
}

// Validar formato da chave
if (!PAGARME_API_KEY.startsWith('sk_')) {
  console.error('PAGARME_API_KEY deve começar com "sk_"');
  throw new Error('PAGARME_API_KEY inválida');
}

console.log('Iniciando conexão com API da Pagar.me...');
console.log('API Key presente:', !!PAGARME_API_KEY);
console.log('Ambiente:', PAGARME_API_KEY.startsWith('sk_test_') ? 'Teste' : 'Produção');

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
        document: customer.document_number.replace(/\D/g, ''), // Remove caracteres não numéricos
        type: 'individual',
        document_type: 'cpf',
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: '11',
            number: '999999999'
          }
        }
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

    // Criar o token de autenticação
    const authToken = Buffer.from(PAGARME_API_KEY + ':').toString('base64');
    console.log('Token de autenticação gerado:', authToken.substring(0, 10) + '...');

    const response = await fetch(`${PAGARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('Resposta completa da Pagar.me:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Erro na resposta da Pagar.me:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
      throw new Error(data.message || 'Erro ao criar pagamento');
    }

    // Verificar se temos os dados necessários
    if (!data.charges || !Array.isArray(data.charges) || data.charges.length === 0) {
      console.error('Resposta não contém charges:', data);
      throw new Error('Resposta inválida da Pagar.me: charges não encontrados');
    }

    const charge = data.charges[0];
    if (!charge.last_transaction) {
      console.error('Charge não contém last_transaction:', charge);
      throw new Error('Resposta inválida da Pagar.me: last_transaction não encontrado');
    }

    if (!charge.last_transaction.qr_code) {
      console.error('Last transaction não contém qr_code:', charge.last_transaction);
      throw new Error('Resposta inválida da Pagar.me: qr_code não encontrado');
    }

    return {
      id: data.id,
      status: data.status,
      charges: data.charges,
      qr_code: charge.last_transaction.qr_code,
      qr_code_url: charge.last_transaction.qr_code_url,
      expires_at: charge.last_transaction.expires_at,
    };
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    throw error;
  }
}

export async function getTransactionStatus(orderId: string) {
  try {
    console.log('Verificando status do pedido:', orderId);

    // Criar o token de autenticação
    const authToken = Buffer.from(PAGARME_API_KEY + ':').toString('base64');

    const response = await fetch(`${PAGARME_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Resposta da Pagar.me:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Erro na resposta da Pagar.me:', {
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
      throw new Error(data.message || 'Erro ao verificar status');
    }

    return data;
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
} 