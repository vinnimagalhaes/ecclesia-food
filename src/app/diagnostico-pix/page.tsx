'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

type DiagnosticoPix = {
  adminEncontrado: boolean;
  configPagamentoEncontrada: boolean;
  chavePix: string | null;
  tipoPix: string | null;
  aceitaPix: boolean | null;
  sugestoes: string[];
};

export default function DiagnosticoPixPage() {
  const [diagnostico, setDiagnostico] = useState<DiagnosticoPix | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarDiagnostico() {
      try {
        setLoading(true);
        setErro(null);
        
        console.log('Carregando diagnóstico PIX...');
        const response = await fetch('/api/pix/diagnostico');
        
        if (!response.ok) {
          throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Diagnóstico recebido:', data);
        setDiagnostico(data);
      } catch (error) {
        console.error('Erro ao carregar diagnóstico:', error);
        setErro(error instanceof Error ? error.message : 'Erro ao carregar diagnóstico');
      } finally {
        setLoading(false);
      }
    }

    carregarDiagnostico();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico do Sistema PIX</h1>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Analisando seu sistema PIX...</p>
        </div>
      ) : erro ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-700">{erro}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      ) : diagnostico ? (
        <div className="space-y-6">
          {/* Resumo */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Resumo</h2>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${diagnostico.adminEncontrado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Admin encontrado: {diagnostico.adminEncontrado ? 'Sim' : 'Não'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${diagnostico.configPagamentoEncontrada ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Configuração de pagamento: {diagnostico.configPagamentoEncontrada ? 'Encontrada' : 'Não encontrada'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${diagnostico.aceitaPix ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Aceita PIX: {diagnostico.aceitaPix ? 'Sim' : 'Não'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${diagnostico.chavePix ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Chave PIX: {diagnostico.chavePix || 'Não configurada'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${diagnostico.tipoPix ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Tipo da chave: {diagnostico.tipoPix || 'Não selecionado'}</span>
              </li>
            </ul>
          </div>
          
          {/* Sugestões */}
          {diagnostico.sugestoes.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h2 className="text-lg font-semibold mb-4">O que precisa ser corrigido</h2>
              <ul className="list-disc pl-5 space-y-2">
                {diagnostico.sugestoes.map((sugestao, index) => (
                  <li key={index} className="text-gray-700">{sugestao}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Próximos passos */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Próximos passos</h2>
            <div className="space-y-4">
              <Link href="/configuracoes" className="w-full block">
                <Button variant="primary" className="w-full">
                  Ir para Configurações
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                Atualizar Diagnóstico
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
          <p>Nenhum dado disponível.</p>
        </div>
      )}
    </div>
  );
} 