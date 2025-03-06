'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface UserContextType {
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  userEmail: null,
  userName: null,
  isAdmin: false,
  isLoading: true,
});

export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (session?.user) {
      console.log('[UserContext] Usuário autenticado:', session.user);
      setUserId(session.user.id as string);
      setUserEmail(session.user.email);
      setUserName(session.user.name || 'Usuário');
      setIsAdmin(session.user.role === 'ADMIN');
    } else {
      console.log('[UserContext] Usuário não autenticado');
      setUserId(null);
      setUserEmail(null);
      setUserName(null);
      setIsAdmin(false);
    }
    
    setIsLoading(false);
  }, [session, status]);

  return (
    <UserContext.Provider
      value={{
        userId,
        userEmail,
        userName,
        isAdmin,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
} 