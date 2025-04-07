import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.password) {
          throw new Error('Usuário não encontrado ou sem senha');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error('Senha inválida');
        }
        
        if (user.isActive === false) {
          throw new Error('Usuário inativo');
        }
        
        // Verificar se o email foi confirmado
        if (!user.emailVerified) {
          throw new Error('Email não verificado. Por favor, verifique seu email antes de fazer login.');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive ?? true,
          emailVerified: user.emailVerified
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Quando o usuário faz login
      if (user) {
        token.role = user.role || "MEMBER"; // Definir papel padrão para login com Google
        token.isActive = user.isActive !== false; // Consideramos ativo por padrão
        token.emailVerified = user.emailVerified || new Date(); // Google já verifica o email

        // Se for login com Google
        if (account?.provider === 'google') {
          // Buscar ou criar o usuário no banco de dados
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email as string },
          });

          if (existingUser) {
            // Usuário já existe, atualizamos os dados se necessário
            token.role = existingUser.role;
            token.isActive = existingUser.isActive !== false;
          } else {
            // Criar novo usuário
            const newUser = await prisma.user.create({
              data: {
                email: user.email as string,
                name: user.name as string,
                emailVerified: new Date(),
                role: "MEMBER",
                isActive: true,
              },
            });
            token.role = newUser.role;
            token.isActive = newUser.isActive !== false;
          }
        }
      }
      return token;
    },
    
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as "MEMBER" | "ADMIN" | "SUPER_ADMIN";
        session.user.isActive = token.isActive as boolean;
        session.user.emailVerified = token.emailVerified as Date | null;
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Verificar se a URL está tentando redirecionar para o login
      if (url.includes('/login')) {
        // Redirecionar para o dashboard em vez disso
        return `${baseUrl}/dashboard`;
      }
      
      // Redirecionar para URL padrão se estiver no mesmo domínio
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Caso contrário, redirecione para o baseUrl
      return baseUrl;
    },
    
    async signIn({ account }) {
      // Permitir login para qualquer provedor que estamos usando
      if (account?.provider === 'google') {
        return true;
      }
      
      // Para credenciais, já temos verificações no authorize
      if (account?.provider === 'credentials') {
        return true;
      }
      
      return false;
    }
  }
}; 