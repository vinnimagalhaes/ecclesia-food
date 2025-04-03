// Tipos para o sistema de eventos de pagamento

export interface EventListener {
  id: string;
  writer: WritableStreamDefaultWriter<any>;
  encoder: TextEncoder;
  lastSent: number;
}

export interface EventQueue {
  listeners: EventListener[];
  events: EventData[];
  lastUsed: number;
}

export interface EventData {
  type: string;
  data: Record<string, any>;
}

export interface EventPaymentData extends EventData {
  type: 'payment_update';
  data: {
    transactionId: string;
    orderId: string;
    status: string;
    timestamp: string;
  };
}

export interface EventStatusData extends EventData {
  type: 'status';
  data: {
    status: string;
    timestamp: string;
  };
}

export interface EventPingData extends EventData {
  type: 'ping';
  timestamp: number;
}

export interface EventConnectedData extends EventData {
  type: 'connected';
} 