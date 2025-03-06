'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { CheckCircle, Home, Clipboard } from 'lucide-react';

export default function SucessoPage() {
  const router = useRouter();
  const [pedidoId, setPedidoId] = useState<string | null>(null);

  // Verificar se o usuário chegou aqui após um checkout
  useEffect(() => {
    // Obter ID do pedido do localStorage, se disponível
    const pedidoInfo = localStorage.getItem('ultimoPedido');
    
    if (pedidoInfo) {
      try {
        const info = JSON.parse(pedidoInfo);
        setPedidoId(info.id);
        console.log('Informações do pedido recuperadas:', info);
      } catch (err) {
        console.error('Erro ao processar informações do pedido:', err);
      }
    }
    
    // Se não houver registro de pedido recente, redirecionar para a página inicial
    const pedidoFinalizado = localStorage.getItem('pedidoFinalizado');
    
    if (!pedidoFinalizado) {
      // Marcar que o pedido foi finalizado
      localStorage.setItem('pedidoFinalizado', 'true');
    }
    
    // Limpar o registro após 5 minutos
    const timer = setTimeout(() => {
      localStorage.removeItem('pedidoFinalizado');
      // Mantemos o ultimoPedido para referência
    }, 5 * 60 * 1000);
    
    return () => clearTimeout(timer);
  }, [router]);

  // Função para copiar ID do pedido para o clipboard
  const copiarPedidoId = () => {
    if (pedidoId) {
      navigator.clipboard.writeText(pedidoId)
        .then(() => alert('ID do pedido copiado para a área de transferência!'))
        .catch(err => console.error('Erro ao copiar:', err));
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-8 text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle size={64} className="text-green-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Pedido Realizado com Sucesso!</h1>
      
      <p className="text-gray-600 mb-4">
        Seu pedido foi recebido e está sendo processado. Em breve você receberá um e-mail com os detalhes da sua compra.
      </p>
      
      {pedidoId && (
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <p className="text-sm text-gray-500 mb-1">Número do pedido:</p>
          <div className="flex items-center justify-center gap-2">
            <p className="font-mono text-gray-800 font-medium">{pedidoId}</p>
            <button 
              onClick={copiarPedidoId}
              className="text-primary-500 hover:text-primary-600"
              title="Copiar código do pedido"
            >
              <Clipboard size={16} />
            </button>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <Link href="/catalogo/eventos">
          <Button variant="primary" className="w-full">
            Continuar Comprando
          </Button>
        </Link>
        
        <Link href="/">
          <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
            <Home size={18} />
            <span>Voltar para a Página Inicial</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}