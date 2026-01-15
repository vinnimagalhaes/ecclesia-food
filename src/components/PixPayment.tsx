'use client';

import { useState } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

export default function PixPayment() {
  const [copiado, setCopiado] = useState(false);

  const chavePix = "00020126330014BR.GOV.BCB.PIX011112345678900520400005303986540510.005802BR5913Ecclesia Food6008Brasilia6207050300063041234";

  const copiarCodigo = () => {
    navigator.clipboard.writeText(chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Pagamento via PIX</h3>
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 bg-gray-200 mb-4 flex items-center justify-center text-gray-500 text-sm">
          QR Code PIX
        </div>
        <p className="text-sm text-gray-500 mb-2">Escaneie o QR Code ou copie o código abaixo:</p>
        <div className="flex w-full gap-2">
          <input 
            type="text" 
            readOnly 
            value={chavePix}
            className="flex-1 bg-gray-50 border border-gray-300 rounded px-3 py-2 text-sm text-gray-600 truncate"
          />
          <button
            onClick={copiarCodigo}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            {copiado ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
}
