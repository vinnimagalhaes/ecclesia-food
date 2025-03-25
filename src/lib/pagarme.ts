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
  phone: string;  // Agora é obrigatório
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
  expiresIn?: number; // Tempo de expiração do PIX em segundos
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

    console.log('Validando dados do cliente:', {
      name: customer.name,
      email: customer.email,
      document_number: customer.document_number,
      phone: customer.phone
    });

    if (!customer.name) {
      console.error('Nome do cliente não fornecido');
      throw new Error('Nome do cliente não fornecido');
    }

    if (!customer.email) {
      console.error('Email do cliente não fornecido');
      throw new Error('Email do cliente não fornecido');
    }

    if (!customer.document_number) {
      console.error('Documento do cliente não fornecido');
      throw new Error('Documento do cliente não fornecido');
    }

    if (!customer.phone) {
      console.error('Telefone do cliente não fornecido');
      throw new Error('Telefone do cliente não fornecido');
    }

    if (!orderId) {
      console.error('ID do pedido não fornecido');
      throw new Error('ID do pedido não fornecido');
    }

    if (!items || items.length === 0) {
      console.error('Nenhum item fornecido no pedido');
      throw new Error('Nenhum item fornecido no pedido');
    }

    // Formatar o telefone para o formato da Pagar.me
    const phone = customer.phone.replace(/\D/g, '');
    console.log('Telefone formatado:', phone);

    if (phone.length < 10) {
      console.error('Telefone inválido:', phone);
      throw new Error('Telefone do cliente inválido');
    }

    const areaCode = phone.substring(0, 2);
    const number = phone.substring(2);
    console.log('Telefone separado:', { areaCode, number });

    // Converter valor para centavos
    const amountInCents = amount;

    const requestBody = {
      code: orderId,
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document_number.replace(/\D/g, ''),
        type: 'individual',
        document_type: 'cpf',
        phones: {
          mobile_phone: {
            country_code: '55',
            area_code: areaCode,
            number: number
          }
        }
      },
      items: items.map((item, index) => ({
        amount: item.amount, // Removendo a conversão para centavos
        description: item.name,
        quantity: item.quantity,
        code: `ITEM_${index + 1}`,
      })),
      payments: [
        {
          payment_method: 'pix',
          pix: {
            expires_in: expiresIn,
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
      amount: amountInCents, // Usando o valor sem conversão
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
      throw new Error(data.message || 'Erro ao criar pagamento na Pagar.me');
    }

    // Verificar se temos os dados necessários
    if (!data.charges || !Array.isArray(data.charges) || data.charges.length === 0) {
      console.error('Resposta não contém charges:', data);
      throw new Error('Resposta inválida da Pagar.me: charges não encontrados');
    }

    const charge = data.charges[0];
    console.log('Charge encontrado:', JSON.stringify(charge, null, 2));

    // Verificar se temos a última transação
    if (!charge.last_transaction) {
      console.error('Charge não contém last_transaction:', charge);
      throw new Error('Resposta inválida da Pagar.me: last_transaction não encontrado');
    }

    const lastTransaction = charge.last_transaction;
    console.log('Última transação:', JSON.stringify(lastTransaction, null, 2));

    // Verificar status da transação
    if (lastTransaction.status === 'failed') {
      console.error('Transação falhou:', {
        status: lastTransaction.status,
        error: lastTransaction.error,
        message: lastTransaction.message,
        details: lastTransaction.details,
        gateway_response: lastTransaction.gateway_response,
      });
      throw new Error(`Falha na transação: ${lastTransaction.message || lastTransaction.error || 'Erro desconhecido'}`);
    }

    // Verificar se temos o QR code
    if (!lastTransaction.qr_code && !lastTransaction.qr_code_url) {
      console.error('Last transaction não contém qr_code ou qr_code_url:', lastTransaction);
      throw new Error('Resposta inválida da Pagar.me: qr_code não encontrado');
    }

    // Calcular data de expiração
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    return {
      id: data.id,
      status: data.status,
      charges: data.charges,
      qr_code: lastTransaction.qr_code || lastTransaction.qr_code_url,
      qr_code_url: lastTransaction.qr_code_url,
      expires_at: expiresAt.toISOString(),
      order_code: orderId,
      customer: {
        name: customer.name,
        email: customer.email,
        document: customer.document_number,
        phone: customer.phone,
      },
      items: items.map(item => ({
        name: item.name,
        amount: item.amount,
        quantity: item.quantity,
        total: item.amount * item.quantity,
      })),
      total: amount,
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