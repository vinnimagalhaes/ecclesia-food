import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Substitua pelo email do seu usuário administrador
  const adminEmail = 'viniciusmagalhaes.vsm@gmail.com'; // Seu email aqui
  
  try {
    const updatedUser = await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN' },
    });
    
    console.log('Usuário atualizado com sucesso:');
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 