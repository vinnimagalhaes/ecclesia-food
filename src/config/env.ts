// Verificar se a chave da API está presente
if (!process.env.PAGARME_API_KEY) {
  console.error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
  throw new Error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
}

export const PAGARME_API_KEY = process.env.PAGARME_API_KEY; 