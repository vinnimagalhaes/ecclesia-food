import { UserRole } from '@prisma/client';
import { compare } from 'bcrypt';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from '@/lib/db';

declare module 'next-auth' {
  interface User {
    id: string;
    name: string | null;
    email: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: Date | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      isActive: boolean;
      emailVerified: Date | null;
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    isActive: boolean;
    emailVerified: Date | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'USER' as UserRole,
          isActive: true,
          emailVerified: new Date()
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error('Usuário não encontrado ou sem senha');
        }

        const isPasswordValid = await compare(
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
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      console.log('[Auth] JWT Callback:', {
        hasUser: !!user,
        hasAccount: !!account,
        accountProvider: account?.provider,
        userRole: user?.role,
        userEmailVerified: user?.emailVerified
      });

      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        token.emailVerified = user.emailVerified;
        
        if (account && account.provider === 'google') {
          console.log('[Auth] Login com Google detectado');
          if (!user.emailVerified) {
            console.log('[Auth] Atualizando emailVerified para usuário do Google');
            await db.user.update({
              where: { id: user.id },
              data: { emailVerified: new Date() }
            });
            token.emailVerified = new Date();
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.isActive = token.isActive as boolean;
        session.user.emailVerified = token.emailVerified as Date | null;
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