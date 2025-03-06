import { UserRole } from '@prisma/client';
import { compare } from 'bcrypt';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';

declare module 'next-auth' {
  interface User {
    id: string;
    role: UserRole;
    isActive: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      isActive: boolean;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Buscar usuário pelo email
          const user = await db.user.findUnique({
            where: { email: credentials.email }
          });

          // Verificar se o usuário existe e tem senha
          if (!user || !user.password) {
            console.log(`[Auth] Usuário não encontrado ou sem senha: ${credentials.email}`);
            return null;
          }

          // Verificar se a senha é válida
          const passwordMatch = await compare(credentials.password, user.password);
          if (!passwordMatch) {
            console.log(`[Auth] Senha inválida para usuário: ${user.email}`);
            return null;
          }

          // Verificar se o usuário está ativo
          if (user.isActive === false) {
            console.log(`[Auth] Usuário inativo: ${user.email}`);
            return null;
          }

          // Retornar os dados do usuário para o token
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          };
        } catch (error) {
          console.error('[Auth Error]', error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isActive = token.isActive as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET
}; 