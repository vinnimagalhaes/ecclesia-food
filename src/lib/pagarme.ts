if (!process.env.PAGARME_API_KEY) {
  throw new Error('PAGARME_API_KEY não está definida');
}

const PAGARME_API_KEY = process.env.PAGARME_API_KEY;
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

console.log('Iniciando conexão com API da Pagar.me...');
console.log('API Key presente:', !!process.env.PAGARME_API_KEY);

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

    const response = await fetch(`${PAGARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    const data = await response.json();
    console.log('Resposta da Pagar.me:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar pagamento');
    }

    return data;
  } catch (error) {
    console.error('Erro ao criar pagamento:', error);
    throw error;
  }
}

export async function getTransactionStatus(transactionId: string) {
  try {
    console.log('Buscando status da transação:', transactionId);

    const response = await fetch(`${PAGARME_API_URL}/orders/${transactionId}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
      },
    });

    const data = await response.json();
    console.log('Status da transação:', data);

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao buscar status da transação');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar status da transação:', error);
    throw error;
  }
} 