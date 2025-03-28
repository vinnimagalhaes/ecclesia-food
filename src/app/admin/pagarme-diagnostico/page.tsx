'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PagarMeDiagnosticoPage() {
  const [loading, setLoading] = useState(false);
  const [basicResult, setBasicResult] = useState<any>(null);
  const [debugResult, setDebugResult] = useState<any>(null);
  const [accountResult, setAccountResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [testRunning, setTestRunning] = useState<string>('');

  // Executar teste básico
  const runBasicTest = async () => {
    setTestRunning('basic');
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/payments/pagarme-test');
      const data = await response.json();
      setBasicResult(data);
    } catch (error) {
      setError('Erro ao executar teste básico');
      console.error('Erro ao executar teste básico:', error);
    } finally {
      setLoading(false);
      setTestRunning('');
    }
  };

  // Executar teste avançado
  const runDebugTest = async () => {
    setTestRunning('debug');
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/payments/pagarme-debug');
      const data = await response.json();
      setDebugResult(data);
    } catch (error) {
      setError('Erro ao executar teste avançado');
      console.error('Erro ao executar teste avançado:', error);
    } finally {
      setLoading(false);
      setTestRunning('');
    }
  };

  // Verificar status da conta
  const checkAccountStatus = async () => {
    setTestRunning('account');
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/payments/pagarme-account');
      const data = await response.json();
      setAccountResult(data);
    } catch (error) {
      setError('Erro ao verificar status da conta');
      console.error('Erro ao verificar status da conta:', error);
    } finally {
      setLoading(false);
      setTestRunning('');
    }
  };

  // Função para obter sugestões de solução com base nos resultados dos testes
  const getSuggestions = () => {
    const suggestions = [];

    if (!basicResult?.api_key_presente) {
      suggestions.push({
        problema: 'Chave API não configurada',
        solucao: 'Configure a chave API (sk_test_*) nas variáveis de ambiente do projeto.'
      });
      return suggestions; // Não podemos sugerir mais nada sem a chave
    }

    if (!basicResult?.api_key_valida) {
      suggestions.push({
        problema: 'Formato da chave API inválido',
        solucao: 'A chave API deve começar com "sk_test_" (ambiente de testes) ou "sk_" (ambiente de produção).'
      });
      return suggestions; // Não podemos sugerir mais nada com uma chave em formato inválido
    }

    // Verificar se os testes avançados encontraram endpoints funcionais
    const endpointsFuncionais = debugResult?.detalhes?.endpointsFuncionais || [];
    const endpointsPrioritarios = debugResult?.detalhes?.endpointsPrioritariosFuncionais || [];
    
    if (endpointsPrioritarios.length > 0) {
      suggestions.push({
        problema: 'Restrições de acesso a endpoints específicos',
        solucao: `Sua chave API está funcionando corretamente com os endpoints: ${endpointsPrioritarios.join(', ')}. Continue usando o método Basic Auth com estes endpoints para a integração.`
      });
    } else if (endpointsFuncionais.length > 0) {
      suggestions.push({
        problema: 'Endpoint merchants/me não acessível',
        solucao: `Sua chave API funciona apenas com endpoints não-prioritários. Isso pode indicar limitações da sua conta ou permissões da chave API. Tente usar apenas os endpoints que funcionam: ${endpointsFuncionais.join(', ')}.`
      });
    } else if (!basicResult?.teste_conexao) {
      suggestions.push({
        problema: 'Erro de autenticação com a API',
        solucao: 'Verifique se a chave API está correta e se a conta está ativa no painel da Pagar.me.'
      });

      if (debugResult?.logs) {
        const erros401Count = debugResult.logs.filter((log: string) => log.includes('401')).length;
        const erros403Count = debugResult.logs.filter((log: string) => log.includes('403')).length;
        
        if (erros401Count > 0) {
          suggestions.push({
            problema: 'Erro 401 (Não autorizado)',
            solucao: 'A chave API pode estar incorreta, suspensa ou a conta pode estar inativa. Verifique no painel da Pagar.me.'
          });
        }
        
        if (erros403Count > 0) {
          suggestions.push({
            problema: 'Erro 403 (Proibido)',
            solucao: 'A chave API não tem permissões suficientes ou o IP pode estar bloqueado. Verifique as configurações de segurança no painel da Pagar.me.'
          });
        }
      }
    }

    // Verificar status da conta
    if (accountResult) {
      if (!accountResult.conta_verificada) {
        suggestions.push({
          problema: 'Conta não verificada',
          solucao: 'Não foi possível verificar o status da conta. Verifique se a integração foi configurada corretamente no painel da Pagar.me.'
        });
      } else if (accountResult.status_conta !== 'active') {
        suggestions.push({
          problema: `Status da conta: ${accountResult.status_conta}`,
          solucao: 'A conta não está ativa. Acesse o painel da Pagar.me e verifique o status da sua conta.'
        });
      }
      
      if (accountResult.detalhes?.motivos_pendencia?.length > 0) {
        suggestions.push({
          problema: 'Pendências na conta',
          solucao: `Resolva as seguintes pendências: ${accountResult.detalhes.motivos_pendencia.join(', ')}`
        });
      }
    }

    // Se nenhuma sugestão específica foi adicionada, adicione uma geral
    if (suggestions.length === 0) {
      suggestions.push({
        problema: 'Outro problema não identificado',
        solucao: 'Entre em contato com o suporte da Pagar.me para verificar o status da sua conta e da integração.'
      });
    }

    // Adicionar uma sugestão sobre uso do Basic Auth se o teste avançado indica que ele funciona
    if (debugResult?.detalhes?.sucessos > 0) {
      suggestions.push({
        problema: 'Método de autenticação correto',
        solucao: 'Utilize sempre o método Basic Auth para autenticação com a API da Pagar.me, que é o método que está funcionando corretamente com sua chave.'
      });
    }

    return suggestions;
  };

  // Renderizar resultados do teste básico
  const renderBasicResult = () => {
    if (!basicResult) return null;

    return (
      <div className="mt-4 p-4 border rounded">
        <h3 className="text-lg font-medium">Resultado do Teste Básico</h3>
        <p><strong>Chave API presente:</strong> {basicResult.api_key_presente ? '✅ Sim' : '❌ Não'}</p>
        <p><strong>Chave API válida:</strong> {basicResult.api_key_valida ? '✅ Sim' : '❌ Não'}</p>
        <p><strong>Ambiente:</strong> {basicResult.api_key_ambiente || 'N/A'}</p>
        <p><strong>Formato:</strong> {basicResult.api_key_formato || 'N/A'}</p>
        <p><strong>Conexão testada:</strong> {basicResult.teste_conexao ? '✅ Sucesso' : '❌ Falha'}</p>
        <p><strong>Mensagem:</strong> {basicResult.mensagem || 'N/A'}</p>
        {basicResult.detalhes && (
          <details>
            <summary className="cursor-pointer text-blue-600">Ver detalhes</summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">
              {JSON.stringify(basicResult.detalhes, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  // Renderizar resultados do teste avançado
  const renderDebugResult = () => {
    if (!debugResult) return null;

    return (
      <div className="mt-4 p-4 border rounded">
        <h3 className="text-lg font-medium">Resultado do Teste Avançado</h3>
        <p><strong>Conexão testada:</strong> {debugResult.teste_conexao ? '✅ Sucesso' : '❌ Falha'}</p>
        <p><strong>Mensagem:</strong> {debugResult.mensagem || 'N/A'}</p>
        
        {debugResult.detalhes && debugResult.detalhes.testes && (
          <div className="mt-2">
            <p><strong>Testes realizados:</strong> {debugResult.detalhes.total}</p>
            <p><strong>Testes com sucesso:</strong> {debugResult.detalhes.sucessos}</p>
            
            <details>
              <summary className="cursor-pointer text-blue-600">Ver resultados dos testes</summary>
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                {debugResult.detalhes.testes.map((teste: any, index: number) => (
                  <div key={index} className={`p-2 mb-2 rounded ${teste.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    <p><strong>Endpoint:</strong> {teste.endpoint}</p>
                    <p><strong>Método Auth:</strong> {teste.authMethod}</p>
                    <p><strong>Status:</strong> {teste.status} {teste.statusText}</p>
                    <p><strong>Resultado:</strong> {teste.success ? 'Sucesso' : 'Falha'}</p>
                    {teste.error && <p><strong>Erro:</strong> {teste.error}</p>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        
        {debugResult.logs && (
          <details>
            <summary className="cursor-pointer text-blue-600">Ver logs</summary>
            <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
              {debugResult.logs.map((log: string, index: number) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    );
  };

  // Renderizar resultados da verificação da conta
  const renderAccountResult = () => {
    if (!accountResult) return null;

    return (
      <div className="mt-4 p-4 border rounded">
        <h3 className="text-lg font-medium">Status da Conta</h3>
        <p><strong>Conta verificada:</strong> {accountResult.conta_verificada ? '✅ Sim' : '❌ Não'}</p>
        <p><strong>Status da conta:</strong> {accountResult.status_conta || 'N/A'}</p>
        <p><strong>Mensagem:</strong> {accountResult.mensagem || 'N/A'}</p>
        
        {accountResult.detalhes && accountResult.detalhes.conta && (
          <div className="mt-2">
            <p><strong>ID da conta:</strong> {accountResult.detalhes.conta.id || 'N/A'}</p>
            <p><strong>Nome:</strong> {accountResult.detalhes.conta.nome || 'N/A'}</p>
            <p><strong>Email:</strong> {accountResult.detalhes.conta.email || 'N/A'}</p>
            <p><strong>Documento:</strong> {accountResult.detalhes.conta.documento || 'N/A'}</p>
            <p><strong>Tipo:</strong> {accountResult.detalhes.conta.tipo || 'N/A'}</p>
            <p><strong>Status de cadastro:</strong> {accountResult.detalhes.status_cadastro || 'N/A'}</p>
            
            {accountResult.detalhes.motivos_pendencia && accountResult.detalhes.motivos_pendencia.length > 0 && (
              <div>
                <p><strong>Motivos de pendência:</strong></p>
                <ul className="list-disc pl-5">
                  {accountResult.detalhes.motivos_pendencia.map((motivo: string, index: number) => (
                    <li key={index}>{motivo}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <details>
              <summary className="cursor-pointer text-blue-600">Ver dados completos</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs whitespace-pre-wrap">
                {JSON.stringify(accountResult.detalhes.dados_completos, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    );
  };

  // Renderizar sugestões
  const renderSuggestions = () => {
    if (!basicResult) return null;
    
    const suggestions = getSuggestions();
    
    return (
      <div className="mt-6 p-4 border rounded bg-yellow-50">
        <h3 className="text-lg font-medium">Diagnóstico e Sugestões</h3>
        
        {suggestions.map((suggestion, index) => (
          <div key={index} className="mt-2 p-2 border-l-4 border-yellow-500 bg-yellow-100">
            <p><strong>Problema:</strong> {suggestion.problema}</p>
            <p><strong>Solução:</strong> {suggestion.solucao}</p>
          </div>
        ))}
        
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Para mais informações, consulte a documentação da Pagar.me:
            <a href="https://docs.pagar.me" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
              https://docs.pagar.me
            </a>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico da Integração com Pagar.me</h1>
      
      <div className="mb-6">
        <p className="mb-2">
          Esta página permite diagnosticar problemas na integração com a API da Pagar.me.
          Execute os testes abaixo para verificar a configuração e o status da sua conta.
        </p>
        
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={runBasicTest}
            disabled={loading}
            className={`px-4 py-2 rounded ${loading && testRunning === 'basic' ? 'bg-gray-400' : 'bg-blue-600'} text-white`}
          >
            {loading && testRunning === 'basic' ? 'Executando...' : 'Teste Básico'}
          </button>
          
          <button
            onClick={runDebugTest}
            disabled={loading}
            className={`px-4 py-2 rounded ${loading && testRunning === 'debug' ? 'bg-gray-400' : 'bg-green-600'} text-white`}
          >
            {loading && testRunning === 'debug' ? 'Executando...' : 'Teste Avançado'}
          </button>
          
          <button
            onClick={checkAccountStatus}
            disabled={loading}
            className={`px-4 py-2 rounded ${loading && testRunning === 'account' ? 'bg-gray-400' : 'bg-purple-600'} text-white`}
          >
            {loading && testRunning === 'account' ? 'Executando...' : 'Verificar Conta'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
      </div>
      
      {renderBasicResult()}
      {renderDebugResult()}
      {renderAccountResult()}
      
      {(basicResult || debugResult || accountResult) && renderSuggestions()}
      
      <div className="mt-6">
        <Link href="/admin" className="text-blue-600 hover:underline">
          Voltar para o Painel Administrativo
        </Link>
      </div>
    </div>
  );
} 