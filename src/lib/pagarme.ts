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
  phone: string;
  [key: string]: string;
}

interface PaymentRequest {
  amount: number;
  customer: Customer;
  orderId: string;
  items: Array<{
    name: string;
    amount: number;
    quantity: number;
  }>;
  expiresIn?: number;
}

export async function createPixPayment({ amount, customer, orderId, items, expiresIn = 3600 }: PaymentRequest) {
  try {
    console.log('Iniciando criação de pagamento PIX:', {
      amount,
      customer,
      orderId,
      items,
      expiresIn,
    });

    // Validar dados antes de enviar
    if (!amount || amount <= 0) {
      console.error('Valor inválido:', amount);
      throw new Error('Valor do pagamento inválido');
    }

    // Validar dados do cliente
    if (!customer || typeof customer !== 'object') {
      console.error('Dados do cliente inválidos:', customer);
      throw new Error('Dados do cliente inválidos');
    }

    // Validar campos obrigatórios do cliente
    const requiredFields = ['name', 'email', 'document_number', 'phone'];
    const missingFields = requiredFields.filter(field => !customer[field]);
    
    if (missingFields.length > 0) {
      console.error('Campos obrigatórios faltando:', missingFields);
      throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
    }

    // Formatar o telefone
    const phone = customer.phone.replace(/\D/g, '');
    if (phone.length < 10) {
      console.error('Telefone inválido:', phone);
      throw new Error('Telefone do cliente inválido');
    }

    // Extrair DDD e número do telefone
    const areaCode = phone.substring(0, 2);
    const number = phone.substring(2);

    // Formatar documento
    const document = customer.document_number.replace(/\D/g, '');
    if (document.length !== 11) {
      console.error('Documento inválido:', document);
      throw new Error('Documento do cliente inválido');
    }

    // Converter valor para centavos
    const amountInCents = Math.round(amount * 100);

    const requestBody = {
      items: items.map((item, index) => ({
        amount: Math.round(item.amount * 100),
        description: item.name,
        quantity: item.quantity,
        code: `ITEM_${index + 1}`,
      })),
      customer: {
        name: customer.name,
        email: customer.email,
        type: 'individual',
        documents: [
          {
            type: 'cpf',
            number: document
          }
        ],
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: areaCode,
            number: number
          }
        }
      },
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: expiresIn
          }
        }
      ],
      code: orderId,
      closed: true
    };

    console.log('Enviando requisição para Pagar.me:', JSON.stringify(requestBody, null, 2));

    const authToken = Buffer.from(PAGARME_API_KEY + ':').toString('base64');

    const response = await fetch(`${PAGARME_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Status da resposta:', response.status);
    console.log('Headers da resposta:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Resposta completa da Pagar.me:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Erro na resposta da Pagar.me:', {
        status: response.status,
        statusText: response.statusText,
        data,
        errors: data.errors,
        message: data.message,
        details: data.details,
        gateway_response: data.gateway_response,
      });
      
      let errorMessage = 'Erro ao criar pagamento na Pagar.me';
      if (data.message) {
        errorMessage = data.message;
      } else if (data.errors && data.errors.length > 0) {
        errorMessage = data.errors[0].message;
      } else if (data.details && data.details[0]) {
        errorMessage = data.details[0].message;
      }
      
      throw new Error(errorMessage);
    }

    if (!data.charges || !Array.isArray(data.charges) || data.charges.length === 0) {
      console.error('Resposta não contém charges:', data);
      throw new Error('Resposta inválida da Pagar.me: charges não encontrados');
    }

    const charge = data.charges[0];
    console.log('Charge encontrado:', JSON.stringify(charge, null, 2));

    if (!charge.last_transaction) {
      console.error('Charge não contém last_transaction:', charge);
      throw new Error('Resposta inválida da Pagar.me: last_transaction não encontrado');
    }

    const lastTransaction = charge.last_transaction;
    console.log('Última transação:', JSON.stringify(lastTransaction, null, 2));

    if (lastTransaction.status === 'failed') {
      console.error('Transação falhou:', {
        status: lastTransaction.status,
        error: lastTransaction.error,
        message: lastTransaction.message,
        details: lastTransaction.details,
        gateway_response: lastTransaction.gateway_response,
      });
      
      let errorMessage = 'Falha na transação';
      if (lastTransaction.message) {
        errorMessage = lastTransaction.message;
      } else if (lastTransaction.error) {
        errorMessage = lastTransaction.error;
      } else if (lastTransaction.details && lastTransaction.details[0]) {
        errorMessage = lastTransaction.details[0].message;
      }
      
      throw new Error(errorMessage);
    }

    if (!lastTransaction.qr_code && !lastTransaction.qr_code_url) {
      console.error('Last transaction não contém qr_code ou qr_code_url:', lastTransaction);
      throw new Error('Resposta inválida da Pagar.me: qr_code não encontrado');
    }

    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    return {
      id: charge.id,
      qr_code: lastTransaction.qr_code,
      qr_code_url: lastTransaction.qr_code_url,
      expires_at: expiresAt.toISOString(),
      status: lastTransaction.status,
      amount: amountInCents,
      customer: {
        name: customer.name,
        email: customer.email,
        document: document,
        phone: phone,
      },
      items: items.map(item => ({
        name: item.name,
        amount: Math.round(item.amount * 100),
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
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