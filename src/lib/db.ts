import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configuração necessária para Neon Serverless em ambientes Edge/Node
neonConfig.webSocketConstructor = ws;

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

// Debug para ver se a string está chegando
if (!connectionString) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL não está definida!');
}

// Configuração do pool para o Neon
const pool = new Pool({ connectionString });

// Adapter com cast explícito se necessário, mas primeiro vamos tentar a inicialização padrão
// O erro anterior reclamava de compatibilidade de tipos, então vamos simplificar a instanciação
const adapter = new PrismaNeon(pool);

export const db = global.prisma || new PrismaClient({ 
  adapter,
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}
