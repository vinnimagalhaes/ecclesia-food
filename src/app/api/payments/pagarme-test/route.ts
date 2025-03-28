import { NextResponse } from 'next/server';
import { PAGARME_API_KEY } from '@/config/env';

// URL base da API da Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

export const dynamic = 'force-dynamic'; // Evitar cache

export async function GET() {
  try {
    const resultado = {
      api_key_presente: false,
      api_key_valida: false,
      api_key_ambiente: '',
      teste_conexao: false,
      detalhes: {},
      mensagem: '',
      timestamp: new Date().toISOString()
    };

    // 1. Verificar se a chave da API está presente
    if (!PAGARME_API_KEY) {
      resultado.mensagem = 'PAGARME_API_KEY não está definida nas variáveis de ambiente';
      return NextResponse.json(resultado);
    }

    // Marcar que a chave está presente
    resultado.api_key_presente = true;

    // 2. Validar formato da chave
    if (!PAGARME_API_KEY.startsWith('sk_')) {
      resultado.mensagem = 'PAGARME_API_KEY deve começar com "sk_"';
      return NextResponse.json(resultado);
    }

    // Marcar que a chave é válida
    resultado.api_key_valida = true;
    resultado.api_key_ambiente = PAGARME_API_KEY.startsWith('sk_test_') ? 'Teste' : 'Produção';

    // 3. Testar conexão com a API da Pagar.me
    try {
      // Criar o token de autenticação
      const authToken = Buffer.from(PAGARME_API_KEY + ':').toString('base64');

      // Fazer uma solicitação simples para verificar a conexão
      const response = await fetch(`${PAGARME_API_URL}/merchants/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        resultado.mensagem = 'Erro na resposta da Pagar.me';
        resultado.detalhes = {
          status: response.status,
          statusText: response.statusText,
          data: data
        };
        return NextResponse.json(resultado);
      }

      // Conexão bem-sucedida
      resultado.teste_conexao = true;
      resultado.mensagem = 'Conexão com a Pagar.me estabelecida com sucesso';
      resultado.detalhes = {
        merchant: {
          id: data.id,
          name: data.name,
          status: data.status
        }
      };

      return NextResponse.json(resultado);
    } catch (error) {
      resultado.mensagem = 'Erro ao testar conexão com a Pagar.me';
      resultado.detalhes = {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : null
      };
      return NextResponse.json(resultado);
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro no diagnóstico',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 