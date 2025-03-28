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
      api_key_formato: '',
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
    resultado.api_key_formato = `${PAGARME_API_KEY.substring(0, 6)}...${PAGARME_API_KEY.substring(PAGARME_API_KEY.length - 4)}`;

    // 2. Validar formato da chave
    if (!PAGARME_API_KEY.startsWith('sk_')) {
      resultado.mensagem = 'PAGARME_API_KEY deve começar com "sk_"';
      return NextResponse.json(resultado);
    }

    // Marcar que a chave é válida
    resultado.api_key_valida = true;
    resultado.api_key_ambiente = PAGARME_API_KEY.startsWith('sk_test_') ? 'Teste' : 'Produção';

    // 3. Testar conexão com a API da Pagar.me - Método 1: Basic Auth
    try {
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
        console.log('Tentativa 1 (Basic Auth) falhou:', response.status, response.statusText);
        
        // Se o método 1 falhar, tente o método 2: Bearer Token
        try {
          console.log('Tentando método 2: Bearer Token');
          
          const response2 = await fetch(`${PAGARME_API_URL}/merchants/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${PAGARME_API_KEY}`,
              'Content-Type': 'application/json',
            },
          });
          
          const data2 = await response2.json();
          
          if (!response2.ok) {
            console.log('Tentativa 2 (Bearer Token) também falhou:', response2.status, response2.statusText);
            
            resultado.mensagem = 'Erro na resposta da Pagar.me (ambos os métodos de autenticação falharam)';
            resultado.detalhes = {
              basicAuth: {
                status: response.status,
                statusText: response.statusText,
                data: data
              },
              bearerToken: {
                status: response2.status,
                statusText: response2.statusText,
                data: data2
              }
            };
            return NextResponse.json(resultado);
          }
          
          // Conexão bem-sucedida com Bearer Token
          resultado.teste_conexao = true;
          resultado.mensagem = 'Conexão com a Pagar.me estabelecida com sucesso (usando Bearer Token)';
          resultado.detalhes = {
            metodo: 'Bearer Token',
            merchant: {
              id: data2.id,
              name: data2.name,
              status: data2.status
            }
          };
          
          return NextResponse.json(resultado);
        } catch (error2) {
          resultado.mensagem = 'Erro ao testar conexão com a Pagar.me (ambos os métodos falharam)';
          resultado.detalhes = {
            basicAuth: {
              status: response.status,
              data: data
            },
            bearerToken: {
              error: error2 instanceof Error ? error2.message : 'Erro desconhecido'
            }
          };
          return NextResponse.json(resultado);
        }
      }

      // Conexão bem-sucedida com Basic Auth
      resultado.teste_conexao = true;
      resultado.mensagem = 'Conexão com a Pagar.me estabelecida com sucesso (usando Basic Auth)';
      resultado.detalhes = {
        metodo: 'Basic Auth',
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