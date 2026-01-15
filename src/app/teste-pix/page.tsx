'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { QrCode, Copy, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function TestePixPage() {
  const [chave, setChave] = useState('');
  const [tipoPix, setTipoPix] = useState('cpf');
  const [valor, setValor] = useState('1.00');
  const [carregando, setCarregando] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixCopiaECola, setPixCopiaECola] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ajudaVisivel, setAjudaVisivel] = useState(false);

  const gerarCodigoPix = async () => {
    if (!chave.trim()) {
      setErro('Por favor, informe uma chave PIX válida');
      return;
    }

    const valorNumerico = parseFloat(valor);
    if (isNaN(valorNumerico) || valorNumerico <= 0) {
      setErro('Por favor, informe um valor válido');
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      
      const response = await fetch('/api/pix/teste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chavePix: chave,
          tipoPix,
          valor: valorNumerico
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Erro ao gerar código PIX (${response.status})`);
      }

      setQrCodeUrl(data.qrcode);
      setPixCopiaECola(data.brcode);
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      setErro(error instanceof Error ? error.message : 'Erro ao gerar código PIX');
    } finally {
      setCarregando(false);
    }
  };

  const copiarCodigoPix = async () => {
    try {
      await navigator.clipboard.writeText(pixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar código PIX:', error);
      setErro('Não foi possível copiar o código PIX');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader title="Teste de PIX" showBackButton={true} backUrl="/diagnostico-pix" />
      <div className="flex-1 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
            <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="chavePix" className="block text-sm font-medium text-gray-700">
                Sua Chave PIX
              </label>
              <button 
                type="button" 
                onClick={() => setAjudaVisivel(!ajudaVisivel)}
                className="text-primary-500 text-sm flex items-center"
              >
                <Info size={16} className="mr-1" />
                {ajudaVisivel ? 'Ocultar ajuda' : 'Mostrar ajuda'}
              </button>
            </div>
            
            {ajudaVisivel && (
              <div className="bg-blue-50 p-4 rounded-md mb-2 text-sm text-blue-800">
                <p className="font-semibold mb-2">Formatos corretos para chaves PIX:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>CPF:</strong> 12345678900 (apenas números)</li>
                  <li><strong>Telefone:</strong> 11912345678 (DDD + número, sem 0, sem +55)</li>
                  <li><strong>Email:</strong> seuemail@dominio.com</li>
                  <li><strong>Chave aleatória:</strong> 123e4567-e89b-12d3-a456-426655440000</li>
                </ul>
                <p className="mt-2">O sistema automaticamente formatará a chave de acordo com o tipo selecionado.</p>
              </div>
            )}
            
            <input
              id="chavePix"
              type="text"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder={
                tipoPix === 'cpf' ? '12345678900' :
                tipoPix === 'telefone' ? '11912345678' :
                tipoPix === 'email' ? 'seuemail@dominio.com' :
                '123e4567-e89b-12d3-a456-426655440000'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <div>
            <label htmlFor="tipoPix" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo da Chave
            </label>
            <select
              id="tipoPix"
              value={tipoPix}
              onChange={(e) => setTipoPix(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md"
            >
              <option value="cpf">CPF</option>
              <option value="telefone">Telefone</option>
              <option value="email">Email</option>
              <option value="aleatoria">Chave Aleatória</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-gray-700 mb-1">
              Valor (R$)
            </label>
            <input
              id="valor"
              type="text"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="1.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          
          <Button 
            onClick={gerarCodigoPix}
            className="w-full"
            disabled={carregando}
          >
            {carregando ? 'Gerando...' : 'Gerar Código PIX'}
          </Button>
        </div>
      </div>
      
          {erro && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <p className="text-red-700">{erro}</p>
            </div>
          )}
          
          {qrCodeUrl && (
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-semibold">Código PIX Gerado</h2>
              </div>

              <div className="space-y-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <img
                    src={qrCodeUrl}
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
                      value={pixCopiaECola}
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

                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Se este código PIX não funcionar no seu aplicativo bancário, tente usando uma chave PIX de outro tipo ou verifique se o formato está correto.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <Link href="/diagnostico-pix" className="text-primary-500 hover:underline">
              Voltar para Diagnóstico PIX
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 