'use client';

import { useState } from 'react';
import { Search, Printer, Check, X, ArrowLeft } from 'lucide-react';
import { normalizarCodigoPedido, validarCodigoPedido } from '@/lib/codigo-generator';

interface ItemPedido {
  id: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

interface Pedido {
  id: string;
  cliente: string;
  telefone: string;
  email?: string;
  total: number;
  status: 'PENDENTE' | 'FINALIZADA' | 'CANCELADA';
  formaPagamento?: string;
  createdAt: string;
  items: ItemPedido[];
  event?: {
    id: string;
    nome: string;
  };
}

export default function SeuPedidoPage() {
  const [codigo, setCodigo] = useState('');
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [imprimindo, setImprimindo] = useState(false);
  const [impressaoSucesso, setImpressaoSucesso] = useState(false);

  const buscarPedido = async () => {
    if (!codigo.trim()) {
      setErro('Digite o código do pedido');
      return;
    }

    setLoading(true);
    setErro('');
    setPedido(null);

    try {
      // Limpar o código removendo qualquer caractere especial como #
      const codigoLimpo = processarCodigo(codigo);
      
      console.log('Código original:', codigo);
      console.log('Código limpo:', codigoLimpo);
      
      const response = await fetch(`/api/pedidos/buscar?codigo=${encodeURIComponent(codigoLimpo)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro na API de busca:', errorData);
        
        if (response.status === 404) {
          setErro('Pedido não encontrado. Verifique o código digitado.');
        } else {
          setErro(`Erro ao buscar pedido: ${errorData.error || 'Tente novamente.'}`);
        }
        return;
      }

      const dados = await response.json();
      console.log('Pedido encontrado:', dados);
      setPedido(dados);
      
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const confirmarImpressao = async () => {
    if (!pedido) return;

    setImprimindo(true);
    setErro('');

    try {
      console.log('Iniciando impressão para pedido:', pedido.id);
      
      const response = await fetch('/api/pedidos/imprimir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pedidoId: pedido.id
        }),
      });

      const responseData = await response.json();
      console.log('Resposta da impressão:', responseData);

      if (!response.ok) {
        // Tratamento específico para impressora não conectada
        if (responseData.error && responseData.error.includes('não conectada')) {
          setErro('⚠️ Impressora não conectada. Verifique a conexão USB ou rede e tente novamente.');
        } else {
          setErro(`Erro ao imprimir: ${responseData.error || responseData.details || 'Tente novamente.'}`);
        }
        return;
      }

      console.log('Impressão realizada com sucesso!');
      setImpressaoSucesso(true);
      
      // Voltar para tela inicial após 3 segundos
      setTimeout(() => {
        voltarInicio();
      }, 3000);

    } catch (error) {
      console.error('Erro ao imprimir:', error);
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setImprimindo(false);
    }
  };

  const voltarInicio = () => {
    setCodigo('');
    setPedido(null);
    setErro('');
    setImpressaoSucesso(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscarPedido();
    }
  };

  // Caracteres do teclado virtual (números + letras A-J)
  const numeros = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const letras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  const adicionarCaractere = (char: string) => {
    if (codigo.length < 6) { // Limitar a 6 caracteres
      setCodigo(prev => prev + char);
    }
  };

  // Função para limpar e validar o código
  const processarCodigo = (codigoRaw: string) => {
    // Normalizar usando a biblioteca de códigos
    const codigoNormalizado = normalizarCodigoPedido(codigoRaw.trim().replace(/^#/, ''));
    
    // Validar formato
    if (!validarCodigoPedido(codigoNormalizado)) {
      console.warn('Código em formato inválido:', codigoNormalizado);
    }
    
    return codigoNormalizado;
  };

  const apagarUltimo = () => {
    setCodigo(prev => prev.slice(0, -1));
  };

  const limparTodoCodigo = () => {
    setCodigo('');
  };

  // Se impressão foi bem sucedida
  if (impressaoSucesso) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-2xl w-full">
          <div className="mb-8">
            <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <Check size={48} className="text-green-600" />
            </div>
            <h1 className="text-4xl font-bold text-green-600 mb-4">Impressão Realizada!</h1>
            <p className="text-xl text-gray-600">
              Seus itens foram enviados para impressão.
            </p>
            <p className="text-lg text-gray-500 mt-2">
              Retirando os tickets impressos...
            </p>
          </div>
          
          <div className="text-sm text-gray-400">
            Voltando ao início automaticamente...
          </div>
        </div>
      </div>
    );
  }

  // Se tem pedido carregado
  if (pedido) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Cabeçalho */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={voltarInicio}
                className="flex items-center gap-3 text-gray-600 hover:text-gray-800 text-xl"
              >
                <ArrowLeft size={24} />
                Voltar
              </button>
              <h1 className="text-3xl font-bold text-gray-800">Seu Pedido</h1>
              <div></div>
            </div>

            {/* Informações do pedido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">Dados do Cliente</h3>
                <p className="text-blue-700"><strong>Nome:</strong> {pedido.cliente}</p>
                <p className="text-blue-700"><strong>Telefone:</strong> {pedido.telefone}</p>
                {pedido.email && (
                  <p className="text-blue-700"><strong>Email:</strong> {pedido.email}</p>
                )}
              </div>

              <div className="bg-green-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Informações do Pedido</h3>
                <p className="text-green-700"><strong>Código:</strong> {pedido.id}</p>
                <p className="text-green-700"><strong>Status:</strong> {pedido.status}</p>
                <p className="text-green-700"><strong>Total:</strong> R$ {pedido.total.toFixed(2)}</p>
                {pedido.formaPagamento && (
                  <p className="text-green-700"><strong>Pagamento:</strong> {pedido.formaPagamento}</p>
                )}
              </div>
            </div>

            {/* Itens do pedido */}
            <div className="mb-8">
              <h3 className="text-2xl font-semibold mb-6">Itens do Pedido</h3>
              <div className="grid gap-4">
                {pedido.items.map((item) => (
                  <div key={item.id} className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xl font-semibold text-gray-800">{item.nome}</h4>
                        <p className="text-gray-600">
                          {item.quantidade}x R$ {item.precoUnitario.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">
                          R$ {(item.quantidade * item.precoUnitario).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informação sobre impressão individual */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">ℹ️ Como funciona a impressão:</h4>
              <p className="text-yellow-700">
                Cada item será impresso em um ticket separado. 
                {pedido.items.reduce((total, item) => total + item.quantidade, 0) > 1 && (
                  <span> Serão impressos <strong>{pedido.items.reduce((total, item) => total + item.quantidade, 0)} tickets</strong> no total.</span>
                )}
              </p>
            </div>

            {/* Erro */}
            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-700 text-center">{erro}</p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {/* Botão de Etiquetas com Impressão Automática */}
              <button
                onClick={async () => {
                  const evento = pedido.event?.nome || 'Festa Paroquial';
                  const igreja = 'Nossa Senhora Aparecida'; // Você pode pegar isso do banco de dados depois
                  const codigo = pedido.id;
                  const itens = pedido.items.flatMap(item => 
                    Array(item.quantidade).fill(item.nome)
                  ).join(',');
                  
                  try {
                    setImprimindo(true);
                    setErro('');
                    
                    // Chamar API com impressão automática
                    const url = `/api/etiqueta?evento=${encodeURIComponent(evento)}&igreja=${encodeURIComponent(igreja)}&codigo=${encodeURIComponent(codigo)}&itens=${encodeURIComponent(itens)}&imprimir=true`;
                    
                    const response = await fetch(url);
                    
                    if (response.headers.get('content-type')?.includes('application/json')) {
                      // Resposta JSON = impressão automática funcionou
                      const result = await response.json();
                      console.log('✅ Impressão automática:', result);
                      
                      setImpressaoSucesso(true);
                      setTimeout(() => {
                        voltarInicio();
                      }, 3000);
                      
                    } else {
                      // Resposta PDF = impressão falhou, abrir PDF
                      console.log('📄 Abrindo PDF (impressão não disponível)');
                      window.open(url.replace('&imprimir=true', ''), '_blank');
                    }
                    
                  } catch (error) {
                    console.error('❌ Erro:', error);
                    setErro('Erro ao processar etiquetas. Tente novamente.');
                  } finally {
                    setImprimindo(false);
                  }
                }}
                disabled={imprimindo}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-2xl text-xl font-bold flex items-center gap-3"
              >
                {imprimindo ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Gerando e Imprimindo...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir Etiquetas
                  </>
                )}
              </button>

              {/* Botão de impressão térmica */}
              <button
                onClick={confirmarImpressao}
                disabled={imprimindo}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-2xl text-xl font-bold flex items-center gap-3"
              >
                {imprimindo ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Imprimindo...
                  </>
                ) : (
                  <>
                    <Printer size={24} />
                    Impressão Térmica
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela inicial de busca
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Logo/Cabeçalho */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-indigo-600 mb-4">Ecclesia Food</h1>
          <h2 className="text-3xl text-gray-700">Retire seu Pedido</h2>
          <p className="text-xl text-gray-600 mt-4">
            Digite o código do seu pedido (6 caracteres: números + letras A-J)
          </p>
        </div>

        {/* Campo de busca */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
          <div className="mb-8">
            <label className="block text-2xl font-semibold text-gray-700 mb-4">
              Código do Pedido:
            </label>
            <div className="relative">
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: A3B7F2 (6 caracteres)"
                className="w-full px-8 py-6 text-4xl text-center border-4 border-gray-300 rounded-2xl focus:border-indigo-500 focus:outline-none"
                autoFocus
              />
              <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={32} />
            </div>
          </div>

          {/* Teclado Virtual - Números */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {numeros.map((num) => (
              <button
                key={num}
                onClick={() => adicionarCaractere(num)}
                className="bg-gray-100 hover:bg-gray-200 text-3xl font-bold py-6 rounded-xl border-2 border-gray-300 transition-colors"
              >
                {num}
              </button>
            ))}
          </div>

          {/* Teclado Virtual - Letras A-J */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {letras.map((letra) => (
              <button
                key={letra}
                onClick={() => adicionarCaractere(letra)}
                className="bg-blue-100 hover:bg-blue-200 text-3xl font-bold py-6 rounded-xl border-2 border-blue-300 transition-colors text-blue-800"
              >
                {letra}
              </button>
            ))}
          </div>

          {/* Botões de controle */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button
              onClick={apagarUltimo}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <X size={24} />
              Apagar
            </button>
            
            <button
              onClick={buscarPedido}
              disabled={loading || !codigo.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-xl font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  Buscando...
                </>
              ) : (
                <>
                  <Search size={24} />
                  Buscar
                </>
              )}
            </button>
            
            <button
              onClick={limparTodoCodigo}
              className="bg-red-500 hover:bg-red-600 text-white text-xl font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              <X size={24} />
              Limpar
            </button>
          </div>

          {/* Erro */}
          {erro && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-xl text-center font-semibold">{erro}</p>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="bg-white/80 rounded-2xl p-6 text-center">
          <p className="text-lg text-gray-600">
            <strong>Como usar:</strong> Digite o código que você recebeu quando fez o pedido e clique em "Buscar". 
            Depois confirme os dados e clique em "Imprimir" para retirar seus tickets.
          </p>
        </div>
      </div>
    </div>
  );
} 