const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Dados do novo usuário admin
  const adminData = {
    name: 'Admin',
    email: 'viniciusmagalhaes.vsm@gmail.com',
    password: await bcrypt.hash('senha123', 10), // Troque para uma senha forte
    role: 'ADMIN',
    isActive: true,
  };
  
  try {
    // Verificar se já existe um usuário com este email
    const existingUser = await prisma.user.findUnique({
      where: { email: adminData.email }
    });
    
    if (existingUser) {
      // Atualizar para ADMIN se já existir
      const updatedUser = await prisma.user.update({
        where: { email: adminData.email },
        data: { 
          role: 'ADMIN',
          password: adminData.password
        },
      });
      
      console.log('Usuário existente atualizado para ADMIN:');
      console.log({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
      });
    } else {
      // Criar novo usuário admin
      const newUser = await prisma.user.create({
        data: adminData,
      });
      
      console.log('Novo usuário ADMIN criado:');
      console.log({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
      });
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 