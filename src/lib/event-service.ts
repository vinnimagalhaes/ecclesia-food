import { EventData, EventListener, EventPaymentData, EventQueue } from './events';

// Fila de eventos para cada transação
export const eventQueues: Record<string, EventQueue> = {};

// Limpar filas antigas a cada 30 minutos (quando o servidor estiver rodando)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Object.keys(eventQueues).forEach(key => {
      const queue = eventQueues[key];
      // Remove filas inativas por mais de 1 hora
      if (now - queue.lastUsed > 60 * 60 * 1000) {
        delete eventQueues[key];
      }
    });
  }, 30 * 60 * 1000);
}

// Função para publicar um evento de pagamento
export async function publishPaymentEvent(transactionId: string, orderId: string, status: string) {
  const queueId = transactionId || orderId;
  if (!queueId) return;

  const queue = eventQueues[queueId] || {
    listeners: [],
    events: [],
    lastUsed: Date.now()
  };
  
  // Atualizar a hora de último uso
  queue.lastUsed = Date.now();
  
  // Criar o evento
  const event: EventPaymentData = {
    type: 'payment_update',
    data: {
      transactionId,
      orderId,
      status,
      timestamp: new Date().toISOString()
    }
  };
  
  // Adicionar à fila de eventos
  queue.events.push(event);
  
  // Manter apenas os 10 eventos mais recentes
  if (queue.events.length > 10) {
    queue.events.shift();
  }
  
  // Armazenar a fila se não existir
  if (!eventQueues[queueId]) {
    eventQueues[queueId] = queue;
  }
  
  // Enviar para todos os listeners
  for (const listener of queue.listeners) {
    try {
      const message = `data: ${JSON.stringify(event)}\n\n`;
      listener.writer.write(listener.encoder.encode(message));
      listener.lastSent = Date.now();
    } catch (error) {
      console.error('Erro ao enviar evento para listener:', error);
    }
  }
  
  // Remover listeners inativos
  const now = Date.now();
  queue.listeners = queue.listeners.filter(listener => {
    // Manter apenas listeners que receberam dados nos últimos 2 minutos
    return now - listener.lastSent < 2 * 60 * 1000;
  });
} 