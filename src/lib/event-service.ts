import { EventPaymentData, EventQueue } from './events';

// Fila de eventos para cada transação
export const eventQueues: Record<string, EventQueue> = {};

// Limpar filas antigas a cada 15 minutos (quando o servidor estiver rodando)
if (typeof window === 'undefined') {
  setInterval(() => {
    const now = Date.now();
    console.log(`[EventService] Verificando filas inativas. Total de filas: ${Object.keys(eventQueues).length}`);
    
    Object.keys(eventQueues).forEach(key => {
      const queue = eventQueues[key];
      // Remove filas inativas por mais de 30 minutos
      if (now - queue.lastUsed > 30 * 60 * 1000) {
        console.log(`[EventService] Removendo fila inativa: ${key}, última atividade: ${new Date(queue.lastUsed).toISOString()}`);
        delete eventQueues[key];
      }
    });
    
    console.log(`[EventService] Verificação concluída. Filas restantes: ${Object.keys(eventQueues).length}`);
  }, 15 * 60 * 1000);
}

// Função para publicar um evento de pagamento
export async function publishPaymentEvent(transactionId: string, orderId: string, status: string) {
  console.log(`[EventService] Publicando evento de pagamento: transactionId=${transactionId}, orderId=${orderId}, status=${status}`);
  
  // Usar tanto o transactionId quanto o orderId como identificadores para a fila
  const transactionQueue = transactionId ? eventQueues[transactionId] : undefined;
  const orderQueue = orderId ? eventQueues[orderId] : undefined;
  
  // Se ambas as filas existirem, usar a mais ativa
  let queue: EventQueue | undefined;
  if (transactionQueue && orderQueue) {
    queue = transactionQueue.lastUsed > orderQueue.lastUsed ? transactionQueue : orderQueue;
    console.log(`[EventService] Encontradas filas para transactionId e orderId. Usando a mais recente: ${transactionQueue.lastUsed > orderQueue.lastUsed ? 'transactionId' : 'orderId'}`);
  } else {
    queue = transactionQueue || orderQueue;
    console.log(`[EventService] Usando fila existente: ${transactionQueue ? 'transactionId' : (orderQueue ? 'orderId' : 'nenhuma')}`);
  }
  
  // Se nenhuma fila existir, criar uma nova
  if (!queue) {
    console.log(`[EventService] Criando nova fila de eventos`);
    queue = {
      listeners: [],
      events: [],
      lastUsed: Date.now()
    };
  }
  
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
  
  console.log(`[EventService] Criado evento: ${JSON.stringify(event)}`);
  
  // Adicionar à fila de eventos
  queue.events.push(event);
  
  // Manter apenas os 10 eventos mais recentes
  if (queue.events.length > 10) {
    queue.events.shift();
  }
  
  // Armazenar a fila
  if (transactionId) {
    eventQueues[transactionId] = queue;
  }
  
  if (orderId) {
    eventQueues[orderId] = queue;
  }
  
  // Verificar se há listeners para enviar o evento
  const listenersCount = queue.listeners.length;
  console.log(`[EventService] Enviando evento para ${listenersCount} listeners`);
  
  // Enviar para todos os listeners
  const sendPromises = queue.listeners.map(async (listener, index) => {
    try {
      const message = `data: ${JSON.stringify(event)}\n\n`;
      console.log(`[EventService] Enviando para listener ${index + 1}/${listenersCount}`);
      await listener.writer.write(listener.encoder.encode(message));
      listener.lastSent = Date.now();
      console.log(`[EventService] Enviado com sucesso para listener ${index + 1}/${listenersCount}`);
      return true;
    } catch (error) {
      console.error(`[EventService] Erro ao enviar evento para listener ${index + 1}/${listenersCount}:`, error);
      return false;
    }
  });
  
  // Aguardar envio para todos os listeners
  try {
    const results = await Promise.all(sendPromises);
    const successCount = results.filter(Boolean).length;
    console.log(`[EventService] Evento enviado com sucesso para ${successCount}/${listenersCount} listeners`);
  } catch (error) {
    console.error('[EventService] Erro ao enviar eventos:', error);
  }
  
  // Remover listeners inativos
  const now = Date.now();
  const oldListenersCount = queue.listeners.length;
  queue.listeners = queue.listeners.filter(listener => {
    // Manter apenas listeners que receberam dados nos últimos 2 minutos
    return now - listener.lastSent < 2 * 60 * 1000;
  });
  
  const removedCount = oldListenersCount - queue.listeners.length;
  if (removedCount > 0) {
    console.log(`[EventService] Removidos ${removedCount} listeners inativos`);
  }
  
  return true;
} 