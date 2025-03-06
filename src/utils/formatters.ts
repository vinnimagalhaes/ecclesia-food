/**
 * Formata uma data string para o formato dd/mm/yyyy
 * @param dateString - String de data (formato ISO ou outro compatível com Date)
 * @returns String formatada no padrão brasileiro dd/mm/yyyy
 */
export function formatarData(dateString?: string): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      return 'Data inválida';
    }
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Erro';
  }
}

/**
 * Formata um número para valor monetário em reais
 * @param valor - Número a ser formatado
 * @returns String formatada como valor monetário (R$ X,XX)
 */
export function formatarMoeda(valor?: number): string {
  if (valor === undefined || valor === null) return 'R$ 0,00';
  
  try {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  } catch (error) {
    console.error('Erro ao formatar moeda:', error);
    return 'R$ 0,00';
  }
}

/**
 * Formata um número como porcentagem
 * @param valor - Número a ser formatado (ex: 0.25 para 25%)
 * @returns String formatada como porcentagem (XX%)
 */
export function formatarPorcentagem(valor?: number): string {
  if (valor === undefined || valor === null) return '0%';
  
  try {
    return valor.toLocaleString('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  } catch (error) {
    console.error('Erro ao formatar porcentagem:', error);
    return '0%';
  }
} 