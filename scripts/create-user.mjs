import { PrismaClient } from '@prisma/client';
import readline from 'readline';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createUser() {
  try {
    console.log('=== Criação de Usuário ===');
    
    // Solicitar dados do usuário
    const name = await new Promise((resolve) => {
      rl.question('Nome: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    const email = await new Promise((resolve) => {
      rl.question('Email: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    const password = await new Promise((resolve) => {
      rl.question('Senha: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!email || !password) {
      console.error('Email e senha são obrigatórios. Operação cancelada.');
      return;
    }
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.error(`Usuário com email ${email} já existe.`);
      return;
    }
    
    // Criar o usuário
    const hashedPassword = await hash(password, 10);
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'MEMBER',
        isActive: true
      }
    });
    
    console.log(`\n✅ Usuário ${newUser.email} criado com sucesso!`);
    
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createUser(); 