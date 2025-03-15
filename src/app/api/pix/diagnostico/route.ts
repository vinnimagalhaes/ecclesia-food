import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';

// GET: Diagnóstico das configurações de PIX
export async function GET() {
  try {
    console.log('Iniciando diagnóstico PIX');

    // Resultados do diagnóstico
    const diagnostico: {
      adminEncontrado: boolean;
      configPagamentoEncontrada: boolean;
      chavePix: string | null;
      tipoPix: string | null;
      aceitaPix: boolean | null;
      sugestoes: string[];
    } = {
      adminEncontrado: false,
      configPagamentoEncontrada: false,
      chavePix: null,
      tipoPix: null,
      aceitaPix: null,
      sugestoes: []
    };

    // Buscar o primeiro usuário ativo (admin da igreja)
    const admin = await db.user.findFirst({
      where: {
        role: 'ADMIN',
        isActive: true
      }
    });

    if (!admin) {
      console.log('Admin não encontrado');
      diagnostico.sugestoes.push("Não foi encontrado um usuário administrador ativo. Verifique se há um usuário com o papel de ADMIN e que esteja ativo.");
      return NextResponse.json(diagnostico);
    }
    
    diagnostico.adminEncontrado = true;
    console.log('Admin encontrado:', admin.id);

    // Buscar configurações de pagamento do SystemConfig
    console.log(`Buscando configurações de pagamento para userId=${admin.id}`);
    const configPagamento = await db.systemConfig.findFirst({
      where: { 
        userId: admin.id,
        key: 'configPagamento'
      }
    });

    if (!configPagamento) {
      console.log('Configuração de pagamento não encontrada');
      diagnostico.sugestoes.push("Não foram encontradas configurações de pagamento. Acesse a página de configurações e configure as opções de pagamento.");
      return NextResponse.json(diagnostico);
    }

    diagnostico.configPagamentoEncontrada = true;
    console.log('Configuração obtida do banco:', configPagamento.id);

    // Tentar parsear o valor da configuração
    try {
      const valor = JSON.parse(configPagamento.value);
      console.log('Valor JSON obtido da configuração:', JSON.stringify(valor, null, 2));
      
      // Verificar e registrar as configurações PIX
      diagnostico.aceitaPix = valor.aceitaPix;
      diagnostico.chavePix = valor.chavePix || null;
      diagnostico.tipoPix = valor.tipoPix || null;
      
      if (!valor.aceitaPix) {
        diagnostico.sugestoes.push("A opção 'Aceitar PIX' está desativada. Ative esta opção nas configurações de pagamento.");
      }
      
      if (!valor.chavePix || valor.chavePix.trim() === '') {
        diagnostico.sugestoes.push("A chave PIX não está configurada. Configure uma chave PIX válida nas configurações de pagamento.");
      }
      
      if (!valor.tipoPix || valor.tipoPix.trim() === '') {
        diagnostico.sugestoes.push("O tipo de chave PIX não está selecionado. Selecione o tipo correto da sua chave (CPF, Email, Telefone, etc).");
      }
      
      // Se tudo estiver configurado corretamente
      if (valor.aceitaPix && valor.chavePix && valor.chavePix.trim() !== '' && valor.tipoPix && valor.tipoPix.trim() !== '') {
        diagnostico.sugestoes.push("As configurações de PIX parecem estar corretas. Se ainda estiver tendo problemas, verifique se a chave PIX é válida e está no formato correto.");
      }
    } catch (e) {
      console.error('Erro ao processar configuração de pagamento:', e);
      diagnostico.sugestoes.push("Erro ao processar as configurações de pagamento. O formato dos dados pode estar corrompido. Tente reconfigurar as opções de pagamento.");
    }

    return NextResponse.json(diagnostico);
  } catch (error) {
    console.error('Erro no diagnóstico PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao realizar diagnóstico PIX', detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 