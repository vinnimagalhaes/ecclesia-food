import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

async function backupDatabase() {
  const prisma = new PrismaClient();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  
  // Criar diretório de backups se não existir
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  try {
    console.log('Iniciando backup do banco de dados...');
    
    // Buscar todos os dados das tabelas principais
    const users = await prisma.user.findMany();
    const events = await prisma.event.findMany();
    const products = await prisma.product.findMany();
    const productImages = await prisma.productImage.findMany();
    const sales = await prisma.sale.findMany();
    const saleItems = await prisma.saleItem.findMany();
    const systemConfigs = await prisma.systemConfig.findMany();
    const churches = await prisma.church.findMany();
    
    // Criar objeto de backup
    const backupData = {
      timestamp: new Date().toISOString(),
      data: {
        users,
        events,
        products,
        productImages,
        sales,
        saleItems,
        systemConfigs,
        churches
      }
    };
    
    // Salvar backup como JSON
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`Backup criado com sucesso: ${backupFile}`);
    
    // Manter apenas os últimos 7 backups
    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => path.join(backupDir, file));
    
    if (files.length > 7) {
      files.sort((a, b) => fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime());
      
      // Remover backups mais antigos
      for (let i = 0; i < files.length - 7; i++) {
        fs.unlinkSync(files[i]);
        console.log(`Backup antigo removido: ${files[i]}`);
      }
    }
  } catch (error) {
    console.error('Erro ao realizar backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase(); 