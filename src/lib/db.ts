import { PrismaClient } from '@prisma/client';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import ws from 'ws';

// Configuração necessária para Neon Serverless
neonConfig.webSocketConstructor = ws;

declare global {
  var prisma: PrismaClient | undefined;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ ERRO CRÍTICO: DATABASE_URL não definida');
}

const pool = new Pool({ connectionString });
// Cast para any para resolver conflito de tipos entre versões do driver
const adapter = new PrismaNeon(pool as any);

export const db = global.prisma || new PrismaClient({ 
  adapter,
  log: ['query', 'error', 'warn'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = db;
}
