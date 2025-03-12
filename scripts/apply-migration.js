// Script para aplicar a migração manualmente usando Prisma Client
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Lê o arquivo .env.local e obtém o DATABASE_URL
const envPath = path.join(__dirname, '../.env.local');
let databaseUrl = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const matches = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (matches && matches[1]) {
    databaseUrl = matches[1];
    console.log('URL do banco de dados encontrada no arquivo .env.local');
  }
} catch (error) {
  console.error('Erro ao ler o arquivo .env.local:', error);
}

if (!databaseUrl) {
  console.error('DATABASE_URL não encontrada. Não é possível continuar.');
  process.exit(1);
}

// Cria uma instância do Prisma Client com a URL obtida
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

async function main() {
  console.log('Iniciando aplicação da migração...');
  
  try {
    console.log('Aplicando migração: Adicionando campo metadata à tabela Sale');
    
    // Executar diretamente o comando SQL
    const result = await prisma.$executeRawUnsafe('ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT \'{}\' NOT NULL');
    
    console.log('Migração aplicada com sucesso!');
    console.log('Resultado:', result);
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('Processo concluído.');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Erro no processo:', e);
    process.exit(1);
  }); 