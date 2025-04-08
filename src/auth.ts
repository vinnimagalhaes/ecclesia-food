import { UserRole } from '@prisma/client';
import { NextAuthOptions } from 'next-auth';
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
    signIn: '/auth/login',
    error: '/auth/login'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 dias
  },
  secret: process.env.NEXTAUTH_SECRET
}; 