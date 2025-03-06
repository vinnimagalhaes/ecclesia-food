import { NextResponse } from 'next/server';
import { withUserAuth } from '@/utils/api-helpers';
import { db } from '@/lib/db';

// GET: Obter dados do dashboard para o usuário atual
export async function GET(request: Request) {
  return withUserAuth(request, async (userId) => {
    try {
      // Obter a data atual menos 30 dias para filtrar vendas do mês
      const dataInicial = new Date();
      dataInicial.setDate(dataInicial.getDate() - 30);
      
      // Obter eventos do usuário atual
      const eventos = await db.event.findMany({
        where: {
          creatorId: userId
        },
        orderBy: {
          data: 'desc'
        },
        take: 5
      });
      
      // Obter produtos dos eventos do usuário atual
      const produtos = await db.product.findMany({
        where: {
          creatorId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 5
      });
      
      // Obter vendas associadas a eventos do usuário atual
      const vendas = await db.sale.findMany({
        where: {
          event: {
            creatorId: userId
          },
          createdAt: {
            gte: dataInicial
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Calcular total de vendas do mês
      const totalVendasMes = vendas.reduce((total: number, venda) => total + venda.total, 0);
      
      // Calcular número de vendas por status
      const vendasPendentes = vendas.filter(v => v.status === 'PENDENTE').length;
      const vendasFinalizadas = vendas.filter(v => v.status === 'FINALIZADA').length;
      
      // Atividades recentes (combinação de eventos, produtos e vendas)
      const atividades = [
        ...eventos.map(e => ({
          id: e.id,
          tipo: 'evento' as const,
          nome: e.nome,
          data: e.createdAt,
          descricao: `Novo evento criado: ${e.nome}`
        })),
        ...produtos.map(p => ({
          id: p.id,
          tipo: 'produto' as const,
          nome: p.nome,
          data: p.createdAt,
          descricao: `Novo produto adicionado: ${p.nome}`
        })),
        ...vendas.map(v => ({
          id: v.id,
          tipo: 'venda' as const,
          nome: `Venda para ${v.cliente}`,
          data: v.createdAt,
          descricao: `Nova venda de R$ ${v.total.toFixed(2)} para ${v.cliente}`
        }))
      ].sort((a, b) => b.data.getTime() - a.data.getTime()).slice(0, 10);
      
      return NextResponse.json({
        eventosRecentes: eventos,
        produtosRecentes: produtos,
        vendasRecentes: vendas.slice(0, 5),
        totalVendasMes,
        vendasPendentes,
        vendasFinalizadas,
        atividades
      });
    } catch (error) {
      console.error('Erro ao obter dados do dashboard:', error);
      return NextResponse.json(
        { error: 'Erro ao obter dados do dashboard' },
        { status: 500 }
      );
    }
  });
} 