import { exec } from 'child_process';
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
  
  const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);
  
  try {
    // Obter URL do banco de dados da env
    const dbUrl = new URL(process.env.DATABASE_URL);
    const host = dbUrl.hostname;
    const user = dbUrl.username;
    const password = dbUrl.password;
    const database = dbUrl.pathname.substring(1);
    const port = dbUrl.port || '5432';
    
    console.log(`Iniciando backup do banco ${database} em ${host}...`);
    
    // Executar pg_dump
    exec(
      `PGPASSWORD=${password} pg_dump -h ${host} -p ${port} -U ${user} -d ${database} -f ${backupFile}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Erro ao criar backup: ${error.message}`);
          return;
        }
        console.log(`Backup criado com sucesso: ${backupFile}`);
        
        // Manter apenas os últimos 7 backups
        const files = fs.readdirSync(backupDir)
          .filter(file => file.startsWith('backup-'))
          .map(file => path.join(backupDir, file));
        
        if (files.length > 7) {
          files.sort((a, b) => fs.statSync(a).mtime.getTime() - fs.statSync(b).mtime.getTime());
          
          // Remover backups mais antigos
          for (let i = 0; i < files.length - 7; i++) {
            fs.unlinkSync(files[i]);
            console.log(`Backup antigo removido: ${files[i]}`);
          }
        }
      }
    );
  } catch (error) {
    console.error('Erro ao realizar backup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backupDatabase(); 