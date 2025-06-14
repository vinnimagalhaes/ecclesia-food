/**
 * Gerador de códigos únicos de 6 caracteres
 * Base 20: 0-9, A-J
 * Capacidade: 64 milhões de códigos únicos
 */

const CARACTERES = '0123456789ABCDEFGHIJ';
const BASE = CARACTERES.length; // 20
const TAMANHO_CODIGO = 6;

/**
 * Gera um código aleatório de 6 caracteres
 * @returns string - Código no formato "A3B7F2"
 */
export function gerarCodigoPedido(): string {
  let codigo = '';
  
  for (let i = 0; i < TAMANHO_CODIGO; i++) {
    const indiceAleatorio = Math.floor(Math.random() * BASE);
    codigo += CARACTERES[indiceAleatorio];
  }
  
  return codigo;
}

/**
 * Valida se um código está no formato correto
 * @param codigo - Código a ser validado
 * @returns boolean - true se válido
 */
export function validarCodigoPedido(codigo: string): boolean {
  if (!codigo || codigo.length !== TAMANHO_CODIGO) {
    return false;
  }
  
  // Verificar se todos os caracteres são válidos
  for (const char of codigo.toUpperCase()) {
    if (!CARACTERES.includes(char)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normaliza um código (converte para maiúsculo e remove caracteres inválidos)
 * @param codigo - Código a ser normalizado
 * @returns string - Código normalizado
 */
export function normalizarCodigoPedido(codigo: string): string {
  return codigo
    .toUpperCase()
    .replace(/[^0-9A-J]/g, '')
    .substring(0, TAMANHO_CODIGO);
}

/**
 * Estatísticas do sistema de códigos
 */
export const ESTATISTICAS_CODIGO = {
  base: BASE,
  tamanho: TAMANHO_CODIGO,
  capacidadeTotal: Math.pow(BASE, TAMANHO_CODIGO), // 64.000.000
  caracteres: CARACTERES,
  exemplo: 'A3B7F2'
} as const; 