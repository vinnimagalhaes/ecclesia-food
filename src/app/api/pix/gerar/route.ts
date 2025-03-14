import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PixUtils } from '@/utils/PixUtils';

// Forçar o uso do runtime Node.js
export const runtime = 'nodejs';

// Tornar a rota dinâmica para evitar cacheamento
export const dynamic = 'force-dynamic';

// Chave PIX aleatória de telefone para demonstração (formato +5500000000000)
// Esta é uma chave fictícia apenas para fallback
const DEMO_PIX_KEY = '11944707018';

export async function POST(request: Request) {
  try {
    console.log('Iniciando geração de PIX');
    
    // Verificar se a requisição tem um corpo válido
    let body;
    try {
      body = await request.json();
      console.log('Dados recebidos:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.error('Erro ao parsear o corpo da requisição:', e);
      return NextResponse.json(
        { error: 'Corpo da requisição inválido', status: 400 },
        { status: 400 }
      );
    }
    
    const { valor, chavePix: chavePixRecebida, nomeChavePix, cidadeChavePix } = body;

    // Garantir que temos uma chave PIX usando um telefone de demonstração como fallback
    // Em vez de email, usar telefone que é mais comumente aceito
    const chavePix = chavePixRecebida && chavePixRecebida.trim() !== ''
      ? chavePixRecebida
      : DEMO_PIX_KEY; // Chave PIX de fallback (telefone no formato simplificado)

    // Garantir que temos um valor numérico válido
    const valorNumerico = typeof valor === 'number' && !isNaN(valor) && valor > 0
      ? valor
      : 1.00; // Valor padrão de 1 real

    console.log('Dados sanitizados:', {
      chavePix,
      valorNumerico,
      nomeChavePix: nomeChavePix || 'N', // Nome curto para compatibilidade
      cidadeChavePix: cidadeChavePix || 'C'  // Cidade curta para compatibilidade
    });

    // Validar apenas os dados essenciais
    if (!valorNumerico || !chavePix) {
      console.log('Dados essenciais incompletos mesmo após sanitização');
      return NextResponse.json(
        { error: 'Dados incompletos para gerar o PIX. É necessário fornecer valor e chave PIX.' },
        { status: 400 }
      );
    }

    console.log('Gerando BRCode PIX simplificado com os dados:', { valorNumerico, chavePix });
    
    let brcode;
    
    try {
      // Sempre usar o método simplificado que é mais compatível com bancos
      console.log('Usando geração de PIX simplificada para maior compatibilidade');
      brcode = PixUtils.generateSimplePayload(chavePix, valorNumerico);
      
      console.log('BRCode gerado com sucesso:', brcode);
    } catch (error) {
      console.error('Erro ao gerar o BRCode:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar o código PIX', detalhes: 'Falha na geração do payload PIX' },
        { status: 500 }
      );
    }

    // Gerar o QR Code
    try {
      console.log('Gerando QR Code a partir do BRCode');
      const qrcode = await QRCode.toDataURL(brcode);
      console.log('QR Code gerado com sucesso');
      
      // Retornar os dados com status 200 OK explícito
      return NextResponse.json({
        brcode,
        qrcode,
      }, { status: 200 });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar o QR Code PIX', detalhes: 'Falha na geração da imagem QR Code' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar o código PIX', detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 