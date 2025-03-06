#!/usr/bin/env node

/**
 * Script de Diagnóstico para Ecclesia Food
 * 
 * Este script verifica a configuração do ambiente e identifica possíveis problemas.
 * Para executar: node scripts/diagnostico.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import os from 'os';

// Carregar variáveis de ambiente
dotenv.config();
console.log('🔍 Iniciando diagnóstico do ambiente Ecclesia Food...\n');

// Verificar Node.js
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Erro ao verificar versão do Node.js:', error.message);
}

// Verificar NPM
try {
  const npmVersion = execSync('npm -v').toString().trim();
  console.log(`✅ NPM: ${npmVersion}`);
} catch (error) {
  console.error('❌ Erro ao verificar versão do NPM:', error.message);
}

// Verificar Next.js
try {
  const packageJson = JSON.parse(fs.readFileSync(path.resolve('./package.json'), 'utf8'));
  const nextVersion = packageJson.dependencies.next;
  console.log(`✅ Next.js: ${nextVersion}`);
} catch (error) {
  console.error('❌ Erro ao verificar versão do Next.js:', error.message);
}

// Verificar variáveis de ambiente
console.log('\n📋 Verificando variáveis de ambiente:');

// DATABASE_URL
if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL: Configurada');
  
  // Verificar formato da string de conexão
  const dbUrlPattern = /^(postgres|postgresql):\/\/.+:.+@.+:\d+\/.+(\?.*)?$/;
  if (dbUrlPattern.test(process.env.DATABASE_URL)) {
    console.log('   └─ O formato parece válido');
  } else {
    console.log('   └─ ⚠️ Aviso: O formato da URL pode estar incorreto');
  }
} else {
  console.error('❌ DATABASE_URL: Não configurada');
}

// NEXTAUTH_SECRET
if (process.env.NEXTAUTH_SECRET) {
  console.log('✅ NEXTAUTH_SECRET: Configurada');
  
  if (process.env.NEXTAUTH_SECRET.length < 10) {
    console.log('   └─ ⚠️ Aviso: A secret parece muito curta (recomendamos pelo menos 32 caracteres)');
  }
} else {
  console.error('❌ NEXTAUTH_SECRET: Não configurada');
}

// NEXTAUTH_URL
if (process.env.NEXTAUTH_URL) {
  console.log('✅ NEXTAUTH_URL: Configurada');
  
  try {
    new URL(process.env.NEXTAUTH_URL);
    console.log('   └─ URL válida');
  } catch {
    console.log('   └─ ⚠️ Aviso: A URL parece inválida');
  }
} else {
  console.error('❌ NEXTAUTH_URL: Não configurada');
}

// Verificar se .env existe
console.log('\n📋 Verificando arquivos de configuração:');
if (fs.existsSync(path.resolve('./.env'))) {
  console.log('✅ Arquivo .env: Encontrado');
} else {
  console.error('❌ Arquivo .env: Não encontrado');
}

// Verificar se .env.local existe
if (fs.existsSync(path.resolve('./.env.local'))) {
  console.log('✅ Arquivo .env.local: Encontrado');
} else {
  console.log('ℹ️ Arquivo .env.local: Não encontrado (mas não é obrigatório)');
}

// Verificar pasta node_modules
if (fs.existsSync(path.resolve('./node_modules'))) {
  console.log('✅ node_modules: Encontrado');
} else {
  console.error('❌ node_modules: Não encontrado. Execute "npm install"');
}

// Verificar se o Prisma Client está gerado
if (fs.existsSync(path.resolve('./node_modules/.prisma'))) {
  console.log('✅ Prisma Client: Gerado');
} else {
  console.error('❌ Prisma Client: Não gerado. Execute "npx prisma generate"');
}

// Verificar sistema operacional
console.log('\n📋 Informações do sistema:');
console.log(`✅ Sistema Operacional: ${os.type()} ${os.release()}`);
console.log(`✅ Arquitetura: ${os.arch()}`);
console.log(`✅ Memória total: ${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`);
console.log(`✅ Memória livre: ${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`);

// Verificar conectividade com o banco de dados (sem expor credenciais)
console.log('\n📋 Tentando conectar ao banco de dados:');
try {
  // Não incluiremos código real de conexão para evitar dependências adicionais
  console.log('ℹ️ Teste de conexão com o banco de dados não implementado neste script');
  console.log('   └─ Para testar a conexão com o banco de dados, execute: npx prisma db pull');
} catch (error) {
  console.error('❌ Erro ao conectar com o banco de dados');
}

console.log('\n✅ Diagnóstico concluído!');
console.log('\nSe você encontrou problemas, consulte a documentação em:');
console.log('https://github.com/seu-usuario/ecclesia-food#troubleshooting');
console.log('\nOu consulte o arquivo DEPLOY.md para instruções de deploy.'); 