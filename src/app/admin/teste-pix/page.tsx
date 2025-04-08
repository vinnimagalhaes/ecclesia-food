'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';

export default function TestePIXPage() {
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [configs, setConfigs] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    carregarConfiguracoesPublicas();
  }, []);

  const carregarConfiguracoesPublicas = async () => {
    try {
      setLoading(true);
      setErro(null);
      
      console.log('Carregando configurações públicas...');
      const response = await fetch('/api/configuracoes/publica');
      
      if (!response.ok) {
        throw new Error(`Erro ao carregar configurações: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Configurações recebidas:', data);
      setConfigs(data);
      
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const testarGeracaoPIX = async () => {
    try {
      setLoading(true);
      setTestResult(null);
      
      if (!configs?.configPagamento?.chavePix) {
        throw new Error('Nenhuma chave PIX configurada');
      }
      
      console.log('Testando geração de PIX com chave:', configs.configPagamento.chavePix);
      
      const response = await fetch('/api/pix/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valor: 1.00,
          chavePix: configs.configPagamento.chavePix,
          nomeChavePix: 'N',
          cidadeChavePix: 'C',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Erro na API: ${errorData.error || response.status}`);
      }
      
      const data = await response.json();
      console.log('Resposta da API:', data);
      setTestResult(data);
      
    } catch (error) {
      console.error('Erro ao testar PIX:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader 
        title="Teste de PIX" 
        showBackButton={true}
      />
      
      <div className="flex-1 p-4">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h1 className="text-xl font-bold mb-4">Diagnóstico de Configuração PIX</h1>
            
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-10 h-10 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
                <span className="ml-3">Carregando...</span>
              </div>
            ) : erro ? (
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                <p className="text-red-700">{erro}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h2 className="font-medium mb-2">Configurações PIX detectadas:</h2>
                    <div className="space-y-2">
                      <p><span className="font-medium">PIX habilitado:</span> {configs?.configPagamento?.aceitaPix ? 'Sim' : 'Não'}</p>
                      <p><span className="font-medium">Chave PIX:</span> {configs?.configPagamento?.chavePix || 'Não configurada'}</p>
                      <p><span className="font-medium">Tipo PIX:</span> {configs?.configPagamento?.tipoPix || 'Não definido'}</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={testarGeracaoPIX}
                    disabled={!configs?.configPagamento?.chavePix}
                  >
                    Testar Geração de QR Code
                  </Button>
                  
                  {testResult && (
                    <div className="mt-6 space-y-4">
                      <h2 className="font-medium">Resultados do teste:</h2>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h3 className="font-medium mb-2">Código PIX gerado:</h3>
                        <div className="bg-white p-2 rounded border border-gray-300 overflow-auto">
                          <code className="text-xs break-all">{testResult.brcode}</code>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <h3 className="font-medium mb-2">QR Code:</h3>
                        {testResult.qrcode && (
                          <img 
                            src={testResult.qrcode} 
                            alt="QR Code PIX" 
                            className="w-64 h-64 border border-gray-300 rounded-lg p-2"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Instruções</h2>
            <div className="space-y-2 text-sm">
              <p>1. Verifique se a <strong>chave PIX</strong> mostrada acima corresponde à que você configurou.</p>
              <p>2. Clique em "Testar Geração de QR Code" para ver o QR Code que seria gerado com essa chave.</p>
              <p>3. Se a chave PIX exibida não for a que você configurou, verifique as configurações na página de <a href="/configuracoes" className="text-primary-500 underline">Configurações</a>.</p>
              <p>4. Certifique-se de que a chave PIX está no formato correto para o tipo selecionado (CPF, CNPJ, telefone, etc).</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 