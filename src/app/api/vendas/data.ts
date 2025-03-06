// Tipos
export type Venda = {
  id: string;
  cliente: string;
  tipo: 'evento' | 'rifa';
  total: number;
  status: 'PENDENTE' | 'FINALIZADA' | 'CANCELADA';
  data: string;
  dataFinalizacao?: string;
  email?: string;
  telefone?: string;
  formaPagamento?: 'dinheiro' | 'cartao' | 'pix';
  evento?: {
    id: string;
    nome: string;
  };
  itens: {
    id: string;
    nome: string;
    quantidade: number;
    precoUnitario: number;
  }[];
  origem?: 'usuario_final' | 'admin';
};

// Simulação de banco de dados (em produção, isso seria substituído por um banco de dados real)
// Inicialmente vazio, será preenchido com as vendas dos usuários
const vendas: Venda[] = [];

export default vendas; 