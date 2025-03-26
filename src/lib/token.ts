import crypto from 'crypto';

/**
 * Gera um token aleatório para ser usado em verificação de email ou reset de senha
 * @returns string - Token aleatorio gerado
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
} 