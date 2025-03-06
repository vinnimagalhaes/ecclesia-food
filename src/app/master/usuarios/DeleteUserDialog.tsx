'use client';

import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteUserDialogProps {
  userId: string;
  userName: string;
  userEmail: string;
  onUserDeleted: () => void;
}

export default function DeleteUserDialog({ 
  userId, 
  userName, 
  userEmail,
  onUserDeleted 
}: DeleteUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordPromptOpen, setIsPasswordPromptOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const openDialog = () => {
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setIsPasswordPromptOpen(false);
    setPassword('');
  };

  const handleConfirmDelete = () => {
    setIsPasswordPromptOpen(true);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Por favor, informe sua senha');
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/master/usuarios/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          adminPassword: password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Ocorreu um erro ao excluir o usuário');
      }
      
      toast.success('Usuário excluído com sucesso');
      closeDialog();
      onUserDeleted();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast.error(error.message || 'Erro ao excluir usuário');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openDialog}
        className="text-red-600 hover:text-red-800 transition-colors"
        title="Excluir usuário"
      >
        <Trash2 size={18} />
      </button>

      {/* Modal de Confirmação */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            {!isPasswordPromptOpen ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Confirmar Exclusão</h3>
                <p className="mb-6">
                  Você tem certeza que deseja excluir permanentemente o usuário <strong>{userName || userEmail}</strong>?
                </p>
                <p className="text-sm text-red-600 mb-6">
                  Esta ação não pode ser desfeita e todos os dados deste usuário serão removidos permanentemente.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={closeDialog}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                  >
                    Sim, excluir
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Confirmar com senha</h3>
                <p className="mb-4">
                  Para confirmar a exclusão do usuário <strong>{userName || userEmail}</strong>, 
                  por favor digite sua senha de administrador:
                </p>
                <form onSubmit={handleSubmitPassword}>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha de administrador"
                    className="w-full border border-gray-300 p-2 rounded-md mb-4"
                    required
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeDialog}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Processando...' : 'Confirmar exclusão'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 