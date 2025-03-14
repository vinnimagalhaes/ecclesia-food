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
      console.log('Admin não encontrado - retornando erro 404');
      return NextResponse.json(
        { error: 'Configurações não encontradas' },
        { status: 404 }
      );
    }
    
    console.log('Admin encontrado:', admin.id);

    // Valores padrão
    const defaultConfigPagamento = {
      aceitaDinheiro: true,
      aceitaCartao: true,
      aceitaPix: true,
      chavePix: '',
      tipoPix: '',
      taxaServico: 0,
    };

    // Buscar configurações de pagamento do SystemConfig
    console.log(`Buscando configurações de pagamento para userId=${admin.id}`);
    const configPagamento = await db.systemConfig.findFirst({
      where: { 
        userId: admin.id,
        key: 'configPagamento'
      }
    });
    console.log('Configuração obtida do banco:', configPagamento?.id || 'nenhuma');

    // Buscar os dados do perfil da igreja
    const churchProfile = await db.church.findUnique({
      where: { userId: admin.id }
    });
    console.log('Perfil da igreja:', churchProfile?.id || 'nenhum');

    // Preparar resposta
    const configuracoes = {
      perfilIgreja: {
        nome: churchProfile?.name || '',
        cidade: churchProfile?.city || '',
      },
      configPagamento: defaultConfigPagamento
    };

    // Adicionar flag para debug
    configuracoes.configPagamento.chavePix = configuracoes.configPagamento.chavePix || '';
    console.log('chavePix inicial:', JSON.stringify(configuracoes.configPagamento.chavePix));

    // Atualizar configurações de pagamento se encontradas
    if (configPagamento) {
      try {
        const valor = JSON.parse(configPagamento.value);
        console.log('Valor JSON obtido da configuração:', JSON.stringify(valor, null, 2));
        
        // Verificar se a chave PIX está presente
        if (valor.chavePix) {
          console.log(`Chave PIX encontrada: "${valor.chavePix}" (${typeof valor.chavePix})`);
        } else {
          console.log('Chave PIX não encontrada ou vazia na configuração');
        }
        
        configuracoes.configPagamento = { ...defaultConfigPagamento, ...valor };
        
        // Log após a fusão das configurações
        console.log(`chavePix após processamento: "${configuracoes.configPagamento.chavePix}" (${typeof configuracoes.configPagamento.chavePix})`);
        console.log(`aceitaPix: ${configuracoes.configPagamento.aceitaPix}`);
        console.log(`tipoPix: ${configuracoes.configPagamento.tipoPix}`);
      } catch (e) {
        console.error('Erro ao processar configuração de pagamento:', e);
      }
    } else {
      console.log('Nenhuma configuração de pagamento encontrada no banco de dados');
    }
    
    // Verificação final (sanitização)
    configuracoes.configPagamento.chavePix = configuracoes.configPagamento.chavePix || '';
    
    console.log('Configurações completas a serem retornadas:', JSON.stringify(configuracoes, null, 2));

    return NextResponse.json(configuracoes);
  } catch (error) {
    console.error('Erro ao buscar configurações públicas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
} 