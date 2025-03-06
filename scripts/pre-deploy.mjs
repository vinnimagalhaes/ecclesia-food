#!/usr/bin/env node

/**
 * Script de Preparação para Deploy do Ecclesia Food
 * 
 * Este script prepara o aplicativo para deploy em produção.
 * Para executar: node scripts/pre-deploy.mjs
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Preparando Ecclesia Food para deploy em produção...\n');

// Função para perguntar
function pergunta(questao) {
  return new Promise((resolve) => {
    rl.question(questao, (resposta) => {
      resolve(resposta);
    });
  });
}

async function main() {
  try {
    // Verificar dependências
    console.log('📦 Verificando dependências...');
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependências instaladas\n');

    // Verificar se .env existe e criar se não
    const envPath = path.resolve('./.env');
    if (!fs.existsSync(envPath)) {
      console.log('⚠️ Arquivo .env não encontrado. Vamos criar um:');
      
      const databaseUrl = await pergunta('DATABASE_URL (postgres://...): ');
      const nextAuthUrl = await pergunta('NEXTAUTH_URL (https://...): ');
      
      // Gerar NEXTAUTH_SECRET aleatório
      const crypto = await import('crypto');
      const nextAuthSecret = crypto.randomBytes(32).toString('hex');
      
      const envContent = `DATABASE_URL="${databaseUrl}"\nNEXTAUTH_URL="${nextAuthUrl}"\nNEXTAUTH_SECRET="${nextAuthSecret}"\n`;
      fs.writeFileSync(envPath, envContent);
      
      console.log('✅ Arquivo .env criado\n');
    } else {
      console.log('✅ Arquivo .env existente\n');
    }

    // Gerar Prisma Client
    console.log('🔄 Gerando Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Prisma Client gerado\n');

    // Verificar build
    console.log('🏗️ Construindo aplicativo para verificar erros...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build concluído com sucesso\n');
    } catch (error) {
      console.error('❌ Erro no build. Corrija os erros antes de fazer deploy.\n');
      process.exit(1);
    }

    // Criar arquivo vercel.json se não existir
    const vercelJsonPath = path.resolve('./vercel.json');
    if (!fs.existsSync(vercelJsonPath)) {
      const vercelConfig = {
        "version": 2,
        "buildCommand": "npm run build",
        "installCommand": "npm install",
        "framework": "nextjs"
      };
      
      fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelConfig, null, 2));
      console.log('✅ Arquivo vercel.json criado\n');
    }

    // Instruções finais
    console.log('🎉 Preparação concluída! Siga os passos abaixo para deploy:');
    console.log('\n1. Envie seu código para um repositório Git (GitHub, GitLab, etc)');
    console.log('2. Acesse https://vercel.com e conecte seu repositório');
    console.log('3. Configure as mesmas variáveis de ambiente do arquivo .env');
    console.log('4. Clique em "Deploy"\n');
    
    const criarRepo = await pergunta('Deseja criar um repositório Git local agora? (s/n): ');
    
    if (criarRepo.toLowerCase() === 's') {
      try {
        if (!fs.existsSync(path.resolve('./.git'))) {
          console.log('\n📝 Criando repositório Git...');
          execSync('git init', { stdio: 'inherit' });
          
          // Criar .gitignore se não existir
          const gitignorePath = path.resolve('./.gitignore');
          if (!fs.existsSync(gitignorePath)) {
            const gitignoreContent = "node_modules\n.env\n.env.local\n.next\n";
            fs.writeFileSync(gitignorePath, gitignoreContent);
          }
          
          console.log('✅ Repositório Git criado\n');
        } else {
          console.log('✅ Repositório Git já existe\n');
        }
        
        // Perguntar se deseja adicionar e comitar arquivos
        const comitar = await pergunta('Deseja adicionar e comitar os arquivos? (s/n): ');
        
        if (comitar.toLowerCase() === 's') {
          const mensagem = await pergunta('Mensagem do commit: ');
          console.log('\n📝 Adicionando e commitando arquivos...');
          execSync('git add .', { stdio: 'inherit' });
          execSync(`git commit -m "${mensagem || 'Preparando para deploy'}"`, { stdio: 'inherit' });
          console.log('✅ Arquivos commitados\n');
        }
      } catch (error) {
        console.error('❌ Erro ao configurar Git:', error.message);
      }
    }
    
    console.log('📘 Para instruções completas de deploy, consulte o arquivo DEPLOY.md');
    
  } catch (error) {
    console.error('❌ Erro durante a preparação:', error);
  } finally {
    rl.close();
  }
}

main(); 