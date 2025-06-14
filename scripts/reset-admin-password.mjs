import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetAdminPassword() {
  try {
    console.log('=== RESET DE SENHA DE ADMINISTRADOR ===\n');
    
    // Mostrar admins disponíveis
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    console.log('Administradores disponíveis:');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.email} (${admin.name}) - ${admin.role}`);
    });
    console.log('');
    
    // Solicitar email
    const email = await new Promise((resolve) => {
      rl.question('Digite o EMAIL do admin para resetar a senha: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!email) {
      console.error('❌ Email não fornecido. Operação cancelada.');
      return;
    }
    
    // Verificar se o admin existe
    const admin = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!admin) {
      console.error(`❌ Usuário com email ${email} não encontrado.`);
      return;
    }
    
    if (!['ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
      console.error(`❌ Usuário ${email} não é administrador.`);
      return;
    }
    
    // Solicitar nova senha
    const newPassword = await new Promise((resolve) => {
      rl.question('Digite a NOVA SENHA: ', (answer) => {
        resolve(answer.trim());
      });
    });
    
    if (!newPassword || newPassword.length < 6) {
      console.error('❌ Senha deve ter pelo menos 6 caracteres. Operação cancelada.');
      return;
    }
    
    // Criptografar nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar no banco
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        emailVerified: new Date() // Garantir que o email está verificado
      }
    });
    
    console.log('\n✅ SUCESSO!');
    console.log(`📧 Admin: ${updatedUser.email}`);
    console.log(`🔑 Nova senha definida: ${newPassword}`);
    console.log(`🌐 Use em: https://admin.ecclesiafood.com.br/admin`);
    console.log(`📅 Email verificado: ${updatedUser.emailVerified}`);
    
  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

resetAdminPassword(); 