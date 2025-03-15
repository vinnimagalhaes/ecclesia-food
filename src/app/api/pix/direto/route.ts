import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PixUtils } from '@/utils/PixUtils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';

// Configuração para tornar a rota explicitamente dinâmica
export const dynamic = 'force-dynamic';

// Função para formatar a chave PIX com base no tipo
function formatarChavePix(chavePix: string, tipoPix: string): string {
  console.log(`Formatando chave PIX: ${chavePix} do tipo: ${tipoPix}`);
  
  if (!chavePix) return '';
  
  // Remove espaços e caracteres especiais
  let chaveFormatada = chavePix.trim();
  
  switch (tipoPix.toLowerCase()) {
    case 'cpf':
      // Remove caracteres não numéricos
      chaveFormatada = chaveFormatada.replace(/\D/g, '');
      // Verifica se tem 11 dígitos
      if (chaveFormatada.length !== 11) {
        console.log('CPF inválido: não tem 11 dígitos');
      }
      
      // Alguns bancos podem requerer o CPF em formato específico
      // Teste ambos os formatos se necessário
      console.log('Usando CPF como chave PIX sem formatação');
      break;
      
    case 'cnpj':
      // Remove caracteres não numéricos
      chaveFormatada = chaveFormatada.replace(/\D/g, '');
      // Verifica se tem 14 dígitos
      if (chaveFormatada.length !== 14) {
        console.log('CNPJ inválido: não tem 14 dígitos');
      }
      break;
      
    case 'telefone':
      // Remove caracteres não numéricos
      chaveFormatada = chaveFormatada.replace(/\D/g, '');
      
      // Formato recomendado para telefone no PIX é +5511999999999
      if (!chaveFormatada.startsWith('+')) {
        // Se começar com 55, garantir que tem o +
        if (chaveFormatada.startsWith('55')) {
          chaveFormatada = '+' + chaveFormatada;
        } else {
          // Se não começar com 55, adicionar o prefixo completo
          chaveFormatada = '+55' + chaveFormatada;
        }
      }
      break;
      
    case 'email':
      // Email deve estar em minúsculas conforme recomendação do BACEN
      chaveFormatada = chaveFormatada.toLowerCase();
      break;
      
    case 'aleatoria':
      // Chaves aleatórias devem ser usadas exatamente como estão
      break;
      
    default:
      console.log(`Tipo de chave PIX desconhecido: ${tipoPix}`);
  }
  
  console.log(`Chave PIX formatada: ${chaveFormatada}`);
  return chaveFormatada;
}

export async function GET() {
  console.log('Iniciando diagnóstico direto do PIX');
  
  try {
    // Resultado que será retornado
    const resultado: any = {
      temErro: false,
      mensagem: '',
      instrucoes: [],
      timestamp: new Date().toISOString(),
    };
    
    // 1. Buscar usuário admin ativo
    console.log('Buscando usuário admin ativo...');
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('Usuário não autenticado');
      resultado.temErro = true;
      resultado.mensagem = 'Usuário não autenticado';
      resultado.instrucoes.push('Faça login como administrador para acessar esta página');
      return NextResponse.json(resultado);
    }
    
    const user = await prisma.user.findFirst({
      where: {
        email: session.user.email,
        role: 'ADMIN',
        isActive: true,
      },
    });
    
    if (!user) {
      console.log('Usuário admin não encontrado');
      resultado.temErro = true;
      resultado.mensagem = 'Usuário admin não encontrado';
      resultado.instrucoes.push('Verifique se você está logado como administrador');
      return NextResponse.json(resultado);
    }
    
    console.log(`Usuário admin encontrado: ${user.id}`);
    resultado.userId = user.id;
    
    // 2. Buscar todas as configurações do usuário
    console.log(`Buscando configurações para o usuário ${user.id}...`);
    const configuracoes = await prisma.systemConfig.findMany({
      where: {
        userId: user.id,
      },
    });
    
    console.log(`Encontradas ${configuracoes.length} configurações`);
    resultado.configuracoes = configuracoes.map(config => ({
      id: config.id,
      key: config.key,
      value: config.value,
    }));
    
    // 3. Verificar configuração de pagamento
    console.log('Verificando configuração de pagamento...');
    const configPagamento = configuracoes.find(config => config.key === 'configPagamento');
    
    if (!configPagamento) {
      console.log('Configuração de pagamento não encontrada');
      resultado.temErro = true;
      resultado.mensagem = 'Configuração de pagamento não encontrada';
      resultado.instrucoes.push('Acesse a página de configurações e salve as configurações de pagamento');
      return NextResponse.json(resultado);
    }
    
    console.log('Configuração de pagamento encontrada, analisando...');
    
    // 4. Analisar configuração de pagamento
    let configPagamentoObj;
    try {
      configPagamentoObj = JSON.parse(configPagamento.value);
      console.log('Configuração de pagamento parseada com sucesso:', configPagamentoObj);
    } catch (error) {
      console.error('Erro ao parsear configuração de pagamento:', error);
      resultado.temErro = true;
      resultado.mensagem = 'Erro ao parsear configuração de pagamento';
      resultado.instrucoes.push('A configuração de pagamento está corrompida. Acesse a página de configurações e salve novamente');
      return NextResponse.json(resultado);
    }
    
    // 5. Verificar configuração de PIX
    console.log('Verificando configuração de PIX...');
    const diagnostico = {
      aceitaPix: configPagamentoObj.aceitaPix === true,
      chavePix: configPagamentoObj.chavePix || '',
      tipoPix: configPagamentoObj.tipoPix || '',
    };
    
    resultado.diagnostico = diagnostico;
    
    if (!diagnostico.aceitaPix) {
      console.log('PIX não está habilitado nas configurações');
      resultado.temErro = true;
      resultado.mensagem = 'PIX não está habilitado';
      resultado.instrucoes.push('Acesse a página de configurações e ative a opção "Aceitar PIX"');
      return NextResponse.json(resultado);
    }
    
    if (!diagnostico.chavePix) {
      console.log('Chave PIX não configurada');
      resultado.temErro = true;
      resultado.mensagem = 'Chave PIX não configurada';
      resultado.instrucoes.push('Acesse a página de configurações e preencha sua chave PIX');
      return NextResponse.json(resultado);
    }
    
    if (!diagnostico.tipoPix) {
      console.log('Tipo de chave PIX não selecionado');
      resultado.temErro = true;
      resultado.mensagem = 'Tipo de chave PIX não selecionado';
      resultado.instrucoes.push('Acesse a página de configurações e selecione o tipo de chave PIX');
      return NextResponse.json(resultado);
    }
    
    // 6. Tentar gerar código PIX
    console.log('Tentando gerar código PIX...');
    
    // Formatar a chave PIX com base no tipo
    const chaveFormatada = formatarChavePix(diagnostico.chavePix, diagnostico.tipoPix);
    
    try {
      // Gerar payload PIX
      const payload = PixUtils.generateSimplePayload(
        chaveFormatada,
        1.00 // Valor de teste: R$ 1,00
      );
      
      console.log('Payload PIX gerado com sucesso:', payload);
      
      // Gerar QR Code
      const qrcode = await QRCode.toDataURL(payload);
      console.log('QR Code gerado com sucesso');
      
      resultado.pixGerado = {
        brcode: payload,
        qrcode: qrcode,
        chavePix: chaveFormatada,
        tipoPix: diagnostico.tipoPix,
      };
      
      resultado.mensagem = 'Diagnóstico concluído com sucesso';
      resultado.instrucoes.push('O código PIX foi gerado com sucesso');
      resultado.instrucoes.push('Teste o pagamento com o QR Code ou código copia e cola');
    } catch (error) {
      console.error('Erro ao gerar código PIX:', error);
      resultado.temErro = true;
      resultado.mensagem = 'Erro ao gerar código PIX';
      resultado.instrucoes.push('Verifique se a chave PIX está no formato correto para o tipo selecionado');
      resultado.instrucoes.push('Se o problema persistir, tente outro tipo de chave PIX');
      
      // Adicionar detalhes do erro para debug
      resultado.erro = {
        mensagem: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : null,
      };
    }
    
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro no diagnóstico direto do PIX:', error);
    return NextResponse.json({
      temErro: true,
      mensagem: 'Erro interno no servidor',
      instrucoes: ['Ocorreu um erro interno. Tente novamente mais tarde.'],
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
    });
  }
} 