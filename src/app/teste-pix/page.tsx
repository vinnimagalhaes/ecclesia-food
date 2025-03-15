'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { QrCode, Copy, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TestePixPage() {
  const [chave, setChave] = useState('');
  const [valor, setValor] = useState('1.00');
  const [carregando, setCarregando] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [pixCopiaECola, setPixCopiaECola] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

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
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Teste de Geração PIX</h1>
      
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="chavePix" className="block text-sm font-medium text-gray-700 mb-1">
              Sua Chave PIX
            </label>
            <input
              id="chavePix"
              type="text"
              value={chave}
              onChange={(e) => setChave(e.target.value)}
              placeholder="CPF, telefone, email ou chave aleatória"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
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
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <Link href="/diagnostico-pix" className="text-primary-500 hover:underline">
          Voltar para Diagnóstico PIX
        </Link>
      </div>
    </div>
  );
} 