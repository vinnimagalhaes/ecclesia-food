import { exec } from 'child_process';
import { PrismaClient } from '@prisma/client';
import readline from 'readline';
import path from 'path';

async function restoreDatabase(backupFile) {
  if (!backupFile) {
    console.error('Arquivo de backup não especificado');
    console.error('Uso: npm run restore backups/nome-do-arquivo.sql');
    process.exit(1);
  }
  
  const prisma = new PrismaClient();
  
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    const host = dbUrl.hostname;
    const user = dbUrl.username;
    const password = dbUrl.password;
    const database = dbUrl.pathname.substring(1);
    const port = dbUrl.port || '5432';
    
    // Confirmar restauração usando readline
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log(`\n⚠️  ATENÇÃO: Você está prestes a restaurar o banco de dados a partir de ${backupFile}`);
    console.log('⚠️  Isso substituirá TODOS os dados no banco atual. Esse processo não pode ser desfeito.');
    
    rl.question('Para continuar, digite "CONFIRMAR": ', (answer) => {
      if (answer.trim() === 'CONFIRMAR') {
        console.log('Iniciando restauração...');
        
        // Primeiro limpar o schema
        exec(
          `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${user} -d ${database} -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`,
          (error) => {
            if (error) {
              console.error(`Erro ao limpar banco de dados: ${error.message}`);
              rl.close();
              return;
            }
            
            // Depois restaurar o backup
            exec(
              `PGPASSWORD=${password} psql -h ${host} -p ${port} -U ${user} -d ${database} -f ${backupFile}`,
              (error, stdout, stderr) => {
                if (error) {
                  console.error(`Erro ao restaurar backup: ${error.message}`);
                  rl.close();
                  return;
                }
                console.log('✅ Banco de dados restaurado com sucesso!');
                rl.close();
                process.exit(0);
              }
            );
          }
        );
      } else {
        console.log('Restauração cancelada.');
        rl.close();
        process.exit(0);
      }
    });
  } catch (error) {
    console.error('Erro ao restaurar banco de dados:', error);
    process.exit(1);
  }
}

// Pegar o arquivo de backup da linha de comando
const backupFile = process.argv[2];
restoreDatabase(backupFile); 