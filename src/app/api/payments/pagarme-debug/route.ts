import { NextResponse } from 'next/server';
import { PAGARME_API_KEY } from '@/config/env';

// URL base da API da Pagar.me
const PAGARME_API_URL = 'https://api.pagar.me/core/v5';

export const dynamic = 'force-dynamic'; // Evitar cache

interface ResultadoDiagnostico {
  api_key_presente: boolean;
  api_key_valida: boolean;
  api_key_ambiente: string;
  api_key_formato: string;
  teste_conexao: boolean;
  detalhes: any;
  mensagem: string;
  logs: string[];
  timestamp: string;
}

export async function GET() {
  try {
    const resultado: ResultadoDiagnostico = {
      api_key_presente: false,
      api_key_valida: false,
      api_key_ambiente: '',
      api_key_formato: '',
      teste_conexao: false,
      detalhes: {},
      mensagem: '',
      logs: [],
      timestamp: new Date().toISOString()
    };

    // Função para adicionar logs
    const addLog = (mensagem: string) => {
      console.log(mensagem);
      resultado.logs.push(`${new Date().toISOString()} - ${mensagem}`);
    };

    // 1. Verificar se a chave da API está presente
    addLog('Verificando presença da chave API...');
    if (!PAGARME_API_KEY) {
      resultado.mensagem = 'PAGARME_API_KEY não está definida nas variáveis de ambiente';
      addLog('PAGARME_API_KEY não encontrada nas variáveis de ambiente');
      return NextResponse.json(resultado);
    }

    // Marcar que a chave está presente
    resultado.api_key_presente = true;
    resultado.api_key_formato = `${PAGARME_API_KEY.substring(0, 6)}...${PAGARME_API_KEY.substring(PAGARME_API_KEY.length - 4)}`;
    addLog(`Chave API encontrada: ${resultado.api_key_formato}`);

    // 2. Validar formato da chave
    addLog('Verificando formato da chave API...');
    if (!PAGARME_API_KEY.startsWith('sk_')) {
      resultado.mensagem = 'PAGARME_API_KEY deve começar com "sk_"';
      addLog('Formato da chave API inválido: deve começar com "sk_"');
      return NextResponse.json(resultado);
    }

    // Marcar que a chave é válida
    resultado.api_key_valida = true;
    resultado.api_key_ambiente = PAGARME_API_KEY.startsWith('sk_test_') ? 'Teste' : 'Produção';
    addLog(`Ambiente da chave API: ${resultado.api_key_ambiente}`);

    // 3. Testar diferentes endpoints e métodos de autenticação
    addLog('Testando diferentes endpoints com método Basic Auth (método recomendado)...');
    
    // Array de endpoints para testar - priorizando os endpoints que sabemos que funcionam
    const endpoints = [
      { url: `/customers`, nome: 'customers (listagem)', prioritario: true },
      { url: `/orders`, nome: 'orders (listagem)', prioritario: true },
      { url: `/merchants/me`, nome: 'merchants/me', prioritario: false }
    ];
    
    // Preparar o token de autenticação Basic Auth
    const authToken = Buffer.from(PAGARME_API_KEY + ':').toString('base64');
    
    const resultados = [];
    
    // Testar cada endpoint usando Basic Auth, que é o método que funciona
    for (const endpoint of endpoints) {
      addLog(`Testando endpoint: ${endpoint.nome}${endpoint.prioritario ? ' (prioritário)' : ''}`);
      
      try {
        const response = await fetch(`${PAGARME_API_URL}${endpoint.url}`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        const statusText = response.statusText;
        const status = response.status;
        
        let responseData;
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = { error: 'Não foi possível parsear a resposta como JSON' };
        }
        
        addLog(`  - Status: ${status} ${statusText}`);
        
        resultados.push({
          endpoint: endpoint.nome,
          authMethod: 'Basic Auth',
          status,
          statusText,
          success: response.ok,
          prioritario: endpoint.prioritario,
          data: responseData
        });
        
        // Se encontramos um endpoint prioritário que funciona, podemos marcar como sucesso
        if (response.ok && endpoint.prioritario) {
          resultado.teste_conexao = true;
          addLog(`  - Endpoint prioritário funcionando!`);
        }
      } catch (error) {
        addLog(`  - Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        
        resultados.push({
          endpoint: endpoint.nome,
          authMethod: 'Basic Auth',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          success: false,
          prioritario: endpoint.prioritario
        });
      }
    }
    
    // Verificar se algum teste foi bem-sucedido
    const sucessos = resultados.filter(r => r.success);
    const sucessosPrioritarios = resultados.filter(r => r.success && r.prioritario);
    
    if (sucessos.length > 0) {
      if (sucessosPrioritarios.length > 0) {
        resultado.mensagem = `Conexão estabelecida com sucesso em ${sucessosPrioritarios.length} endpoints prioritários`;
        addLog(`Conexão estabelecida com sucesso em ${sucessosPrioritarios.length} endpoints prioritários`);
      } else {
        resultado.mensagem = `Conexão estabelecida, mas apenas em endpoints não-prioritários`;
        addLog(`Conexão estabelecida, mas apenas em endpoints não-prioritários`);
      }
    } else {
      resultado.mensagem = 'Todos os testes de conexão falharam';
      addLog('Todos os testes de conexão falharam');
      
      // Analisar o padrão de erros para sugerir soluções
      const erros401 = resultados.filter(r => r.status === 401).length;
      const erros403 = resultados.filter(r => r.status === 403).length;
      
      if (erros401 > 0) {
        addLog('Detectados erros 401 (Não autorizado) - Possível problema com as credenciais');
        resultado.mensagem += '. Possíveis causas: chave API incorreta, chave suspensa ou desativada, ou conta sem permissões suficientes.';
      } else if (erros403 > 0) {
        addLog('Detectados erros 403 (Proibido) - Possível problema com as permissões');
        resultado.mensagem += '. Possíveis causas: chave sem permissões suficientes ou IP bloqueado.';
      }
    }
    
    // Adicionar conclusão sobre qual método funciona
    if (sucessosPrioritarios.length > 0) {
      addLog('CONCLUSÃO: Use o método Basic Auth com os endpoints /customers e /orders para integração');
      resultado.mensagem += '. Recomendação: Continuar usando Basic Auth com os endpoints /customers e /orders para integração.';
    }
    
    resultado.detalhes = {
      testes: resultados,
      sucessos: sucessos.length,
      sucessosPrioritarios: sucessosPrioritarios.length,
      total: resultados.length,
      endpointsFuncionais: sucessos.map(s => s.endpoint),
      endpointsPrioritariosFuncionais: sucessosPrioritarios.map(s => s.endpoint)
    };
    
    return NextResponse.json(resultado);
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