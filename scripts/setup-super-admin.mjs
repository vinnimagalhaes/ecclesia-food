import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function setupSuperAdmin() {
  try {
    console.log('=== Configuração de Super Administrador ===');
    
    // Solicitar o email do usuário
    const email = await new Promise((resolve) => {
      rl.question('Digite o email do usuário que será configurado como SUPER_ADMIN: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!email) {
      console.error('Email não fornecido. Operação cancelada.');
      return;
    }
    
    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error(`Usuário com email ${email} não encontrado.`);
      return;
    }
    
    // Atualizar o usuário para SUPER_ADMIN
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'SUPER_ADMIN',
        isActive: true
      }
    });
    
    console.log(`\n✅ Usuário ${updatedUser.email} configurado com sucesso como SUPER_ADMIN!`);
    console.log('Este usuário agora tem acesso a todas as funcionalidades do sistema, incluindo o painel master.');
    
  } catch (error) {
    console.error('Erro ao configurar SUPER_ADMIN:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

setupSuperAdmin(); 