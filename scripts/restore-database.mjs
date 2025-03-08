import { PrismaClient } from '@prisma/client';
import readline from 'readline';
import fs from 'fs';
import path from 'path';

async function restoreDatabase(backupFile) {
  if (!backupFile) {
    console.error('Arquivo de backup não especificado');
    console.error('Uso: npm run restore backups/nome-do-arquivo.json');
    process.exit(1);
  }
  
  if (!fs.existsSync(backupFile)) {
    console.error(`Arquivo de backup não encontrado: ${backupFile}`);
    process.exit(1);
  }
  
  const prisma = new PrismaClient();
  
  try {
    // Confirmar restauração usando readline
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log(`\n⚠️  ATENÇÃO: Você está prestes a restaurar o banco de dados a partir de ${backupFile}`);
    console.log('⚠️  Isso substituirá TODOS os dados no banco atual. Esse processo não pode ser desfeito.');
    
    rl.question('Para continuar, digite "CONFIRMAR": ', async (answer) => {
      if (answer.trim() === 'CONFIRMAR') {
        console.log('Iniciando restauração...');
        
        try {
          // Ler o arquivo de backup
          const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
          
          // Limpar todas as tabelas
          console.log('Limpando tabelas existentes...');
          await prisma.saleItem.deleteMany({});
          await prisma.sale.deleteMany({});
          await prisma.productImage.deleteMany({});
          await prisma.product.deleteMany({});
          await prisma.event.deleteMany({});
          await prisma.church.deleteMany({});
          await prisma.systemConfig.deleteMany({});
          // Não excluímos usuários para manter a segurança
          
          // Restaurar dados
          console.log('Restaurando dados...');
          
          // Restaurar igrejas
          if (backupData.data.churches && backupData.data.churches.length > 0) {
            for (const church of backupData.data.churches) {
              await prisma.church.create({
                data: {
                  id: church.id,
                  nome: church.nome,
                  cidade: church.cidade,
                  endereco: church.endereco,
                  telefone: church.telefone,
                  email: church.email,
                  logo: church.logo,
                  createdAt: new Date(church.createdAt),
                  updatedAt: new Date(church.updatedAt)
                }
              });
            }
            console.log(`✅ Restauradas ${backupData.data.churches.length} igrejas`);
          }
          
          // Restaurar configurações do sistema
          if (backupData.data.systemConfigs && backupData.data.systemConfigs.length > 0) {
            for (const config of backupData.data.systemConfigs) {
              await prisma.systemConfig.create({
                data: {
                  id: config.id,
                  key: config.key,
                  value: config.value,
                  createdAt: new Date(config.createdAt),
                  updatedAt: new Date(config.updatedAt)
                }
              });
            }
            console.log(`✅ Restauradas ${backupData.data.systemConfigs.length} configurações`);
          }
          
          // Restaurar eventos
          if (backupData.data.events && backupData.data.events.length > 0) {
            for (const event of backupData.data.events) {
              await prisma.event.create({
                data: {
                  id: event.id,
                  nome: event.nome,
                  descricao: event.descricao,
                  data: new Date(event.data),
                  local: event.local,
                  imagem: event.imagem,
                  userId: event.userId,
                  createdAt: new Date(event.createdAt),
                  updatedAt: new Date(event.updatedAt),
                  churchId: event.churchId
                }
              });
            }
            console.log(`✅ Restaurados ${backupData.data.events.length} eventos`);
          }
          
          // Restaurar produtos
          if (backupData.data.products && backupData.data.products.length > 0) {
            for (const product of backupData.data.products) {
              await prisma.product.create({
                data: {
                  id: product.id,
                  nome: product.nome,
                  descricao: product.descricao,
                  preco: product.preco,
                  eventId: product.eventId,
                  createdAt: new Date(product.createdAt),
                  updatedAt: new Date(product.updatedAt),
                  categoria: product.categoria
                }
              });
            }
            console.log(`✅ Restaurados ${backupData.data.products.length} produtos`);
          }
          
          // Restaurar imagens de produtos
          if (backupData.data.productImages && backupData.data.productImages.length > 0) {
            for (const image of backupData.data.productImages) {
              await prisma.productImage.create({
                data: {
                  id: image.id,
                  url: image.url,
                  productId: image.productId,
                  createdAt: new Date(image.createdAt),
                  updatedAt: new Date(image.updatedAt)
                }
              });
            }
            console.log(`✅ Restauradas ${backupData.data.productImages.length} imagens de produtos`);
          }
          
          // Restaurar vendas
          if (backupData.data.sales && backupData.data.sales.length > 0) {
            for (const sale of backupData.data.sales) {
              await prisma.sale.create({
                data: {
                  id: sale.id,
                  cliente: sale.cliente,
                  email: sale.email,
                  telefone: sale.telefone,
                  total: sale.total,
                  status: sale.status,
                  formaPagamento: sale.formaPagamento,
                  tipo: sale.tipo,
                  origem: sale.origem,
                  userId: sale.userId,
                  eventId: sale.eventId,
                  createdAt: new Date(sale.createdAt),
                  updatedAt: new Date(sale.updatedAt),
                  metadata: sale.metadata
                }
              });
            }
            console.log(`✅ Restauradas ${backupData.data.sales.length} vendas`);
          }
          
          // Restaurar itens de venda
          if (backupData.data.saleItems && backupData.data.saleItems.length > 0) {
            for (const item of backupData.data.saleItems) {
              await prisma.saleItem.create({
                data: {
                  id: item.id,
                  quantidade: item.quantidade,
                  precoUnitario: item.precoUnitario,
                  subtotal: item.subtotal,
                  productId: item.productId,
                  saleId: item.saleId,
                  createdAt: new Date(item.createdAt),
                  updatedAt: new Date(item.updatedAt)
                }
              });
            }
            console.log(`✅ Restaurados ${backupData.data.saleItems.length} itens de venda`);
          }
          
          console.log('\n✅ Banco de dados restaurado com sucesso!');
        } catch (error) {
          console.error('Erro durante a restauração:', error);
        }
        
        rl.close();
        await prisma.$disconnect();
        process.exit(0);
      } else {
        console.log('Restauração cancelada.');
        rl.close();
        await prisma.$disconnect();
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Erro ao restaurar banco de dados:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Pegar o arquivo de backup da linha de comando
const backupFile = process.argv[2];
restoreDatabase(backupFile); 