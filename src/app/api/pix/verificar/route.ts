import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('GET /api/pix/verificar - Verificando configuração do PIX');

    // Buscar o primeiro usuário ativo (admin da igreja)
    const admin = await db.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true
      }
    });

    if (!admin) {
      console.log('Admin não encontrado');
      return NextResponse.json(
        { error: 'Configurações não encontradas', status: 'ERROR' },
        { status: 404 }
      );
    }

    // Buscar configurações de pagamento do SystemConfig
    const configPagamento = await db.systemConfig.findFirst({
      where: { 
        userId: admin.id,
        key: 'configPagamento'
      }
    });

    if (!configPagamento) {
      console.log('Configuração de pagamento não encontrada');
      return NextResponse.json(
        { 
          error: 'Configuração de pagamento não encontrada',
          status: 'ERROR',
          configExiste: false
        }
      );
    }

    try {
      const configuracao = JSON.parse(configPagamento.value);
      console.log('Configuração PIX encontrada:', configuracao);

      // Verificar se aceita PIX e se tem chave configurada
      if (!configuracao.aceitaPix) {
        return NextResponse.json({
          status: 'WARNING',
          configExiste: true,
          aceitaPix: false,
          message: 'Pagamento PIX não está habilitado nas configurações'
        });
      }

      // Verificar se a chave PIX está configurada
      if (!configuracao.chavePix || configuracao.chavePix.trim() === '') {
        return NextResponse.json({
          status: 'ERROR',
          configExiste: true,
          aceitaPix: true,
          chaveConfigured: false,
          message: 'Chave PIX não configurada'
        });
      }

      // Verificar nome e cidade
      const nomeOK = configuracao.nomeChavePix && configuracao.nomeChavePix.trim() !== '';
      const cidadeOK = configuracao.cidadeChavePix && configuracao.cidadeChavePix.trim() !== '';

      if (!nomeOK || !cidadeOK) {
        return NextResponse.json({
          status: 'ERROR',
          configExiste: true,
          aceitaPix: true,
          chaveConfigured: true,
          nomeConfigured: nomeOK,
          cidadeConfigured: cidadeOK,
          message: 'Configuração PIX incompleta: ' + 
            (!nomeOK ? 'Nome do beneficiário não configurado. ' : '') +
            (!cidadeOK ? 'Cidade do beneficiário não configurada.' : '')
        });
      }

      // Tudo OK
      return NextResponse.json({
        status: 'OK',
        configExiste: true,
        aceitaPix: true,
        chaveConfigured: true,
        nomeConfigured: true,
        cidadeConfigured: true,
        message: 'Configuração PIX completa',
        tipo: configuracao.tipoPix,
        // Não retornamos a chave PIX completa por questões de segurança
        chavePartes: `${configuracao.chavePix.substring(0, 5)}...${configuracao.chavePix.substring(configuracao.chavePix.length - 4)}`
      });

    } catch (e) {
      console.error('Erro ao processar configuração de pagamento:', e);
      return NextResponse.json(
        { 
          error: 'Erro ao processar configuração de pagamento',
          status: 'ERROR',
          configExiste: true,
          parseError: true
        }
      );
    }

  } catch (error) {
    console.error('Erro ao verificar configuração PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar configuração PIX', status: 'ERROR' },
      { status: 500 }
    );
  }
} 