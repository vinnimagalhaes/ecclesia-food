// Verificar se as chaves da API estão presentes
if (!process.env.PAGARME_API_KEY) {
  console.error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
  throw new Error('PAGARME_API_KEY não está definida nas variáveis de ambiente');
}

if (!process.env.PAGARME_PUBLIC_KEY) {
  console.error('PAGARME_PUBLIC_KEY não está definida nas variáveis de ambiente');
  throw new Error('PAGARME_PUBLIC_KEY não está definida nas variáveis de ambiente');
}

// Validar formato das chaves
if (!process.env.PAGARME_API_KEY.startsWith('sk_')) {
  console.error('PAGARME_API_KEY deve começar com "sk_"');
  throw new Error('PAGARME_API_KEY inválida');
}

if (!process.env.PAGARME_PUBLIC_KEY.startsWith('pk_')) {
  console.error('PAGARME_PUBLIC_KEY deve começar com "pk_"');
  throw new Error('PAGARME_PUBLIC_KEY inválida');
}

export const PAGARME_API_KEY = process.env.PAGARME_API_KEY;
export const PAGARME_PUBLIC_KEY = process.env.PAGARME_PUBLIC_KEY; 