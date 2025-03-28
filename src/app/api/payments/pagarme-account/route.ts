import { NextResponse } from 'next/server';
import { PAGARME_API_KEY } from '@/config/env';

// URL base da API da Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

export const dynamic = 'force-dynamic'; // Evitar cache

export async function GET() {
  try {
    const resultado = {
      conta_verificada: false,
      status_conta: '',
      detalhes: {},
      mensagem: '',
      timestamp: new Date().toISOString()
    };

    // Verificar se a chave da API está presente
    if (!PAGARME_API_KEY) {
      resultado.mensagem = 'PAGARME_API_KEY não está definida nas variáveis de ambiente';
      return NextResponse.json(resultado);
    }

    console.log('Verificando status da conta na Pagar.me...');

    // Tentar obter informações da conta
    try {
      // Testando diferentes métodos de autenticação
      const authMethods = [
        { 
          nome: 'Basic Auth', 
          getHeaders: () => ({
            'Authorization': `Basic ${Buffer.from(PAGARME_API_KEY + ':').toString('base64')}`,
            'Content-Type': 'application/json',
          })
        },
        { 
          nome: 'Bearer Token', 
          getHeaders: () => ({
            'Authorization': `Bearer ${PAGARME_API_KEY}`,
            'Content-Type': 'application/json',
          })
        },
        { 
          nome: 'Api-Key no Header', 
          getHeaders: () => ({
            'api-key': PAGARME_API_KEY,
            'Content-Type': 'application/json',
          })
        }
      ];
      
      let responseData = null;
      let successMethod = '';
      
      // Testar cada método de autenticação
      for (const method of authMethods) {
        console.log(`Tentando método: ${method.nome}`);
        
        const response = await fetch(`${PAGARME_API_URL}/merchants/me`, {
          method: 'GET',
          headers: method.getHeaders(),
        });
        
        if (response.ok) {
          responseData = await response.json();
          successMethod = method.nome;
          console.log(`Método ${method.nome} funcionou!`);
          break;
        } else {
          console.log(`Método ${method.nome} falhou com status ${response.status}`);
        }
      }
      
      if (!responseData) {
        resultado.mensagem = 'Não foi possível obter informações da conta';
        return NextResponse.json(resultado);
      }
      
      resultado.conta_verificada = true;
      resultado.status_conta = responseData.status || 'Desconhecido';
      resultado.mensagem = `Informações da conta obtidas com sucesso usando ${successMethod}`;
      
      // Informações básicas da conta
      const contaInfo = {
        id: responseData.id,
        nome: responseData.name,
        status: responseData.status,
        tipo: responseData.type,
        documento: responseData.document,
        email: responseData.email,
        criado_em: responseData.created_at,
        metodo_autenticacao: successMethod
      };
      
      // Verificar status de cadastro e documentação
      let statusCadastro = 'Completo';
      const motivos = [];
      
      if (!responseData.document) {
        statusCadastro = 'Incompleto';
        motivos.push('Documento não cadastrado');
      }
      
      if (responseData.status !== 'active') {
        statusCadastro = 'Inativo';
        motivos.push(`Status da conta: ${responseData.status}`);
      }
      
      resultado.detalhes = {
        conta: contaInfo,
        status_cadastro: statusCadastro,
        motivos_pendencia: motivos,
        dados_completos: responseData
      };

      return NextResponse.json(resultado);
    } catch (error) {
      console.error('Erro ao verificar status da conta:', error);
      resultado.mensagem = `Erro ao verificar status da conta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`;
      return NextResponse.json(resultado);
    }
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erro ao verificar conta',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 