'use client';

import { useState } from 'react';
import { gerarCodigoPedido, validarCodigoPedido, normalizarCodigoPedido, ESTATISTICAS_CODIGO } from '@/lib/codigo-generator';

export default function TesteCodigosPage() {
  const [codigoGerado, setCodigoGerado] = useState('');
  const [codigoTeste, setCodigoTeste] = useState('');
  const [resultadoValidacao, setResultadoValidacao] = useState<{
    valido: boolean;
    normalizado: string;
  } | null>(null);

  const gerarNovoCodigo = () => {
    const novoCodigo = gerarCodigoPedido();
    setCodigoGerado(novoCodigo);
  };

  const testarCodigo = () => {
    const normalizado = normalizarCodigoPedido(codigoTeste);
    const valido = validarCodigoPedido(normalizado);
    
    setResultadoValidacao({
      valido,
      normalizado
    });
  };

  const gerarMultiplosCodigos = () => {
    const codigos = [];
    for (let i = 0; i < 10; i++) {
      codigos.push(gerarCodigoPedido());
    }
    return codigos;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            🔢 Sistema de Códigos - Teste
          </h1>

          {/* Estatísticas do Sistema */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold text-blue-800 mb-4">
              📊 Especificações do Sistema
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{ESTATISTICAS_CODIGO.tamanho}</div>
                <div className="text-sm text-blue-700">Caracteres</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{ESTATISTICAS_CODIGO.base}</div>
                <div className="text-sm text-blue-700">Base</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {(ESTATISTICAS_CODIGO.capacidadeTotal / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-blue-700">Códigos Únicos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{ESTATISTICAS_CODIGO.exemplo}</div>
                <div className="text-sm text-blue-700">Exemplo</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm text-blue-700">
                <strong>Caracteres válidos:</strong> {ESTATISTICAS_CODIGO.caracteres}
              </div>
            </div>
          </div>

          {/* Gerador de Códigos */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">
                🎲 Gerador de Códigos
              </h3>
              
              <button
                onClick={gerarNovoCodigo}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-bold mb-4"
              >
                Gerar Novo Código
              </button>
              
              {codigoGerado && (
                <div className="bg-white border-2 border-green-300 rounded-lg p-4 text-center">
                  <div className="text-3xl font-mono font-bold text-green-700 mb-2">
                    {codigoGerado}
                  </div>
                  <div className="text-sm text-green-600">
                    Código gerado com sucesso!
                  </div>
                </div>
              )}
            </div>

            {/* Validador de Códigos */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-orange-800 mb-4">
                ✅ Validador de Códigos
              </h3>
              
              <input
                type="text"
                value={codigoTeste}
                onChange={(e) => setCodigoTeste(e.target.value)}
                placeholder="Digite um código para testar"
                className="w-full px-4 py-3 border border-orange-300 rounded-lg mb-4 text-center font-mono text-lg"
                maxLength={10}
              />
              
              <button
                onClick={testarCodigo}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold mb-4"
              >
                Validar Código
              </button>
              
              {resultadoValidacao && (
                <div className={`border-2 rounded-lg p-4 text-center ${
                  resultadoValidacao.valido 
                    ? 'bg-green-100 border-green-300' 
                    : 'bg-red-100 border-red-300'
                }`}>
                  <div className={`text-lg font-bold mb-2 ${
                    resultadoValidacao.valido ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {resultadoValidacao.valido ? '✅ Válido' : '❌ Inválido'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Normalizado:</strong> {resultadoValidacao.normalizado || 'N/A'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exemplos de Códigos */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📝 Exemplos de Códigos Gerados
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {gerarMultiplosCodigos().map((codigo, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-300 rounded-lg p-3 text-center"
                >
                  <div className="font-mono font-bold text-gray-700">
                    {codigo}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instruções */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              📋 Como Funciona:
            </h3>
            <ul className="text-yellow-700 space-y-2">
              <li>• <strong>6 caracteres:</strong> Formato compacto e fácil de digitar</li>
              <li>• <strong>Base 20:</strong> Números (0-9) + Letras (A-J)</li>
              <li>• <strong>64 milhões:</strong> Códigos únicos possíveis</li>
              <li>• <strong>Aleatório:</strong> Geração segura e imprevisível</li>
              <li>• <strong>Validação:</strong> Verificação automática de formato</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 