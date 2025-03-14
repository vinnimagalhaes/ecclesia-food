import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';

// GET: Obter as configurações públicas
export async function GET() {
  try {
    console.log('GET /api/configuracoes/publica - Buscando configurações públicas');

    // Buscar o primeiro usuário ativo (admin da igreja)
    const admin = await db.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true
      }
    });

    if (!admin) {
      return NextResponse.json(
        { error: 'Configurações não encontradas' },
        { status: 404 }
      );
    }

    // Valores padrão
    const defaultConfigPagamento = {
      aceitaDinheiro: true,
      aceitaCartao: true,
      aceitaPix: true,
      chavePix: '',
      tipoPix: '',
      nomeChavePix: '',
      cidadeChavePix: '',
      taxaServico: 0,
    };

    // Buscar configurações de pagamento do SystemConfig
    const configPagamento = await db.systemConfig.findFirst({
      where: { 
        userId: admin.id,
        key: 'configPagamento'
      }
    });

    // Buscar os dados do perfil da igreja
    const churchProfile = await db.church.findUnique({
      where: { userId: admin.id }
    });

    // Preparar resposta
    const configuracoes = {
      perfilIgreja: {
        nome: churchProfile?.name || '',
        cidade: churchProfile?.city || '',
      },
      configPagamento: defaultConfigPagamento
    };

    // Atualizar configurações de pagamento se encontradas
    if (configPagamento) {
      try {
        const valor = JSON.parse(configPagamento.value);
        console.log('Configuração de pagamento encontrada:', valor);
        
        // Verificar se a chave PIX está presente
        if (valor.chavePix) {
          console.log('Chave PIX encontrada:', valor.chavePix);
        } else {
          console.log('Chave PIX não encontrada na configuração');
        }
        
        configuracoes.configPagamento = { ...defaultConfigPagamento, ...valor };
      } catch (e) {
        console.error('Erro ao processar configuração de pagamento:', e);
      }
    } else {
      console.log('Nenhuma configuração de pagamento encontrada no banco de dados');
    }
    
    console.log('Configurações completas a serem retornadas:', configuracoes);

    return NextResponse.json(configuracoes);
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
} 