'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { QrCode, Copy, CheckCircle, RefreshCw, Info, AlertCircle } from 'lucide-react';

// Configuração para indicar que esta página lida com conteúdo dinâmico
export const dynamic = 'force-dynamic';

export default function SolucaoPixPage() {
  const [carregando, setCarregando] = useState(true);
  const [resultado, setResultado] = useState<any>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [detalhesVisiveis, setDetalhesVisiveis] = useState(false);

  const carregarDiagnostico = async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      console.log('Iniciando diagnóstico direto...');
      const response = await fetch('/api/pix/direto');
      
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Resultado do diagnóstico direto:', data);
      setResultado(data);
    } catch (error) {
      console.error('Erro ao carregar diagnóstico:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao carregar diagnóstico');
    } finally {
      setCarregando(false);
    }
  };

  const copiarCodigoPix = async () => {
    if (!resultado?.pixGerado?.brcode) return;
    
    try {
      await navigator.clipboard.writeText(resultado.pixGerado.brcode);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
      setErro('Não foi possível copiar o código PIX');
    }
  };

  useEffect(() => {
    carregarDiagnostico();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Solução PIX</h1>
      
      {carregando ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Realizando diagnóstico completo...</p>
        </div>
      ) : erro ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <p className="text-red-700">{erro}</p>
          <Button 
            onClick={() => carregarDiagnostico()}
            className="mt-4"
          >
            Tentar Novamente
          </Button>
        </div>
      ) : resultado ? (
        <div className="space-y-6">
          {/* Status */}
          <div className={`p-6 rounded-xl ${resultado.temErro ? 'bg-red-50' : 'bg-green-50'}`}>
            <div className="flex items-center gap-2 mb-2">
              {resultado.temErro ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" />
              )}
              <h2 className={`text-lg font-semibold ${resultado.temErro ? 'text-red-700' : 'text-green-700'}`}>
                {resultado.mensagem || (resultado.temErro ? 'Diagnóstico com problemas' : 'Diagnóstico concluído com sucesso')}
              </h2>
            </div>
            
            {resultado.instrucoes && resultado.instrucoes.length > 0 && (
              <ul className="list-disc pl-6 mt-3 space-y-1">
                {resultado.instrucoes.map((instrucao: string, i: number) => (
                  <li key={i} className={`${resultado.temErro ? 'text-red-700' : 'text-green-700'}`}>{instrucao}</li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Resumo configurações */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Diagnóstico PIX</h2>
              <button 
                className="text-primary-500 text-sm flex items-center"
                onClick={() => setDetalhesVisiveis(!detalhesVisiveis)}
              >
                <Info size={16} className="mr-1" />
                {detalhesVisiveis ? 'Ocultar detalhes' : 'Ver detalhes técnicos'}
              </button>
            </div>
            
            {/* Resumo */}
            <ul className="space-y-2 mb-4">
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${resultado.userId ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Admin: {resultado.userId ? 'Encontrado' : 'Não encontrado'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${resultado.configuracoes?.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Configurações: {resultado.configuracoes?.length || 0} encontradas</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${resultado.diagnostico?.aceitaPix ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Aceita PIX: {resultado.diagnostico?.aceitaPix ? 'Sim' : 'Não'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${resultado.diagnostico?.chavePix ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Chave PIX: {resultado.diagnostico?.chavePix || 'Não configurada'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${resultado.diagnostico?.tipoPix ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>Tipo de chave: {resultado.diagnostico?.tipoPix || 'Não selecionado'}</span>
              </li>
              <li className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-2 ${resultado.pixGerado ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span>PIX gerado: {resultado.pixGerado ? 'Sim' : 'Não'}</span>
              </li>
            </ul>
            
            {/* Detalhes técnicos */}
            {detalhesVisiveis && (
              <div className="mt-4 bg-gray-50 p-4 rounded-md text-gray-700 text-sm">
                <h3 className="font-semibold mb-2">Detalhes Técnicos</h3>
                <pre className="whitespace-pre-wrap break-words overflow-auto max-h-[300px]">
                  {JSON.stringify(resultado, null, 2)}
                </pre>
              </div>
            )}
            
            <Button 
              onClick={carregarDiagnostico}
              variant="outline"
              className="mt-4 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              <span>Atualizar Diagnóstico</span>
            </Button>
          </div>
          
          {/* Código PIX */}
          {resultado.pixGerado && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold">Código PIX Gerado</h2>
              </div>

              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <img
                    src={resultado.pixGerado.qrcode}
                    alt="QR Code PIX"
                    className="w-64 h-64 border border-gray-200 rounded-lg p-2"
                  />
                </div>

                {/* Código Copia e Cola */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Código PIX Copia e Cola:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={resultado.pixGerado.brcode}
                      readOnly
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600 text-sm"
                    />
                    <Button
                      onClick={copiarCodigoPix}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      {copiado ? (
                        <>
                          <CheckCircle size={16} className="text-green-500" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          <span>Copiar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Próximos passos */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">O que fazer agora?</h2>
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Se você encontrou problemas com o diagnóstico, siga estas etapas:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-sm text-gray-700">
                <li>Acesse <a href="/configuracoes" className="text-primary-500 underline">Configurações</a> e verifique se a opção "Aceitar PIX" está ativada</li>
                <li>Preencha corretamente sua chave PIX e selecione o tipo correto</li>
                <li>Salve as configurações e volte para <a href="/solucao-pix" className="text-primary-500 underline">esta página</a> para verificar se o problema foi resolvido</li>
                <li>Se o QR Code foi gerado mas não funciona no seu aplicativo bancário, reveja o formato da sua chave PIX de acordo com o tipo selecionado</li>
              </ol>
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