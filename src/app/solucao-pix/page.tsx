'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { QrCode, Copy, CheckCircle } from 'lucide-react';

interface ConfigPagamento {
  aceitaDinheiro: boolean;
  aceitaCartao: boolean;
  aceitaPix: boolean;
  chavePix: string;
  tipoPix: string;
  taxaServico: number;
  qrCodePix: string;
}

// Configuração para indicar que esta página lida com conteúdo dinâmico
export const dynamic = 'force-dynamic';

// Código PIX estático para uso enquanto a geração dinâmica não funciona
const CODIGO_PIX_ESTATICO = "00020126330014BR.GOV.BCB.PIX0111444707018905204000053039865802BR5924Vinicius Souza Magalhaes6009SAO PAULO62140510i7ImBv3mlq6304F3B4";

export default function SolucaoPixPage() {
  const [carregando, setCarregando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [configPagamento, setConfigPagamento] = useState<ConfigPagamento | null>(null);

  // Simulação de carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setCarregando(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Carregar configurações de pagamento
  useEffect(() => {
    const carregarConfiguracoes = async () => {
      try {
        const response = await fetch('/api/configuracoes/publica');
        if (!response.ok) {
          throw new Error('Erro ao carregar configurações');
        }
        const data = await response.json();
        setConfigPagamento(data.configPagamento);
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };

    carregarConfiguracoes();
  }, []);

  const copiarCodigoPix = async () => {
    try {
      await navigator.clipboard.writeText(CODIGO_PIX_ESTATICO);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Solução PIX</h1>
      
      {carregando ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Carregando informações PIX...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status */}
          <div className="p-6 rounded-xl bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h2 className="text-lg font-semibold text-green-700">
                Código PIX pronto para uso
              </h2>
            </div>
            
            <ul className="list-disc pl-6 mt-3 space-y-1">
              <li className="text-green-700">Use o QR Code ou o código copia e cola para fazer o pagamento</li>
              <li className="text-green-700">O código PIX foi configurado com um valor de exemplo de R$ 1,00</li>
            </ul>
          </div>
          
          {/* Código PIX */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold">Código PIX</h2>
            </div>

            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center">
                <img
                  src={configPagamento?.qrCodePix}
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
                    value={CODIGO_PIX_ESTATICO}
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
          
          {/* Informações */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Informações</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                Este é um código PIX estático pré-configurado para demonstração. Para configurar 
                sua própria chave PIX no sistema, acesse as <a href="/configuracoes" className="text-primary-500 underline">Configurações</a>.
              </p>
              <p>
                O código PIX acima foi gerado uma única vez e pode ser usado para testes.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 