'use client';

import { useState } from 'react';

export default function TesteEtiquetasPage() {
  const [evento, setEvento] = useState('Festa Junina');
  const [igreja, setIgreja] = useState('Nossa Senhora Aparecida');
  const [codigo, setCodigo] = useState('PED1234');
  const [itens, setItens] = useState('DOCINHO,COCA-COLA,SALGADO');

  const [imprimindo, setImprimindo] = useState(false);
  const [resultado, setResultado] = useState('');

  const gerarEtiquetas = async (comImpressao = false) => {
    try {
      setImprimindo(true);
      setResultado('');
      
      const url = `/api/etiqueta?evento=${encodeURIComponent(evento)}&igreja=${encodeURIComponent(igreja)}&codigo=${encodeURIComponent(codigo)}&itens=${encodeURIComponent(itens)}${comImpressao ? '&imprimir=true' : ''}`;
      
      const response = await fetch(url);
      
      if (comImpressao && response.headers.get('content-type')?.includes('application/json')) {
        // Impressão automática funcionou
        const result = await response.json();
        setResultado(`✅ ${result.message}`);
      } else {
        // Abrir PDF
        window.open(url, '_blank');
        setResultado(comImpressao ? '📄 PDF aberto (impressão não disponível)' : '📄 PDF gerado com sucesso!');
      }
      
    } catch (error) {
      setResultado('❌ Erro ao processar etiquetas');
      console.error(error);
    } finally {
      setImprimindo(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🏷️ Teste de Etiquetas PDF
          </h1>

          <div className="grid gap-6 mb-8">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Nome do Evento:
              </label>
              <input
                type="text"
                value={evento}
                onChange={(e) => setEvento(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Ex: Festa Junina"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Nome da Igreja:
              </label>
              <input
                type="text"
                value={igreja}
                onChange={(e) => setIgreja(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Ex: Nossa Senhora Aparecida"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Código do Pedido:
              </label>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Ex: PED1234"
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Itens (separados por vírgula):
              </label>
              <textarea
                value={itens}
                onChange={(e) => setItens(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                rows={3}
                placeholder="Ex: DOCINHO,DOCINHO,COCA-COLA,SALGADO"
              />
              <p className="text-sm text-gray-500 mt-1">
                Cada item será uma página separada no PDF. Para múltiplas quantidades, repita o item.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* Botão apenas PDF */}
            <button
              onClick={() => gerarEtiquetas(false)}
              disabled={imprimindo}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl text-lg font-bold flex items-center gap-3"
            >
              {imprimindo ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Gerando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Apenas PDF
                </>
              )}
            </button>

            {/* Botão com impressão automática */}
            <button
              onClick={() => gerarEtiquetas(true)}
              disabled={imprimindo}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl text-lg font-bold flex items-center gap-3"
            >
              {imprimindo ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Imprimindo...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Gerar e Imprimir
                </>
              )}
            </button>
          </div>

          {/* Resultado */}
          {resultado && (
            <div className="mt-6 p-4 bg-gray-100 rounded-xl text-center">
              <p className="text-lg font-semibold">{resultado}</p>
            </div>
          )}

          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              📋 Como funciona:
            </h3>
            <ul className="text-yellow-700 space-y-2">
              <li>• Cada item gera uma página separada no PDF</li>
              <li>• A impressora térmica corta automaticamente entre páginas</li>
              <li>• Layout otimizado para bobinas de 80mm x 60mm</li>
              <li>• Formato: (Evento - Igreja) → PRODUTO → (Código) → ECCLESIA FOOD</li>
            </ul>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              🔗 URL da API:
            </h3>
            <code className="text-sm text-blue-700 bg-blue-100 p-2 rounded block break-all">
              /api/etiqueta?evento={encodeURIComponent(evento)}&igreja={encodeURIComponent(igreja)}&codigo={encodeURIComponent(codigo)}&itens={encodeURIComponent(itens)}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
} 