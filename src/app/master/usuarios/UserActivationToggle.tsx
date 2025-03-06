'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/Switch';

interface UserActivationToggleProps {
  userId: string;
  isActive: boolean;
}

export default function UserActivationToggle({ userId, isActive: initialIsActive }: UserActivationToggleProps) {
  const [isActiveState, setIsActiveState] = useState<boolean>(initialIsActive);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const toggleUserActivation = async () => {
    // Salvar o estado atual para poder revertê-lo em caso de erro
    const previousState = isActiveState;
    
    try {
      setIsLoading(true);
      
      // Alternar o estado localmente primeiro para melhor UX
      const newState = !isActiveState;
      setIsActiveState(newState);
      
      console.log(`Alterando status do usuário ${userId} para: ${newState ? 'Ativo' : 'Inativo'}`);
      
      const response = await fetch('/api/master/usuarios/toggle-activation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          isActive: newState
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao alterar status do usuário');
      }

      const data = await response.json();
      toast.success(newState 
        ? 'Usuário ativado com sucesso!' 
        : 'Usuário desativado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
      // Reverter ao estado anterior em caso de erro
      setIsActiveState(previousState);
      toast.error(`Erro ao alterar status do usuário: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isActiveState}
        onCheckedChange={toggleUserActivation}
        disabled={isLoading}
        className={isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      />
      <span className={isActiveState ? 'text-green-600' : 'text-red-600'}>
        {isActiveState ? 'Ativo' : 'Inativo'}
      </span>
    </div>
  );
} 