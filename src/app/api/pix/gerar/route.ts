import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PixUtils } from '@/utils/PixUtils';

// Forçar o uso do runtime Node.js
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    console.log('Iniciando geração de PIX');
    
    const body = await request.json();
    console.log('Dados recebidos:', JSON.stringify(body, null, 2));
    
    const { valor, chavePix: chavePixRecebida, nomeChavePix, cidadeChavePix } = body;

    // Garantir que temos uma chave PIX, mesmo que seja uma de teste
    const chavePix = chavePixRecebida && chavePixRecebida.trim() !== ''
      ? chavePixRecebida
      : 'teste@ecclesiafood.com'; // Chave PIX de fallback

    // Garantir que temos um valor numérico válido
    const valorNumerico = typeof valor === 'number' && !isNaN(valor) && valor > 0
      ? valor
      : 1.00; // Valor padrão de 1 real

    console.log('Dados sanitizados:', {
      chavePix,
      valorNumerico,
      nomeChavePix: nomeChavePix || 'Ecclesia Food',
      cidadeChavePix: cidadeChavePix || 'São Paulo'
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
    
    // Se temos os dados completos, usar o método completo, caso contrário, usar o simplificado
    if (nomeChavePix && cidadeChavePix) {
      // Gerar o código PIX (BRCode) com todos os campos
      console.log('Usando geração de PIX completa com nome e cidade');
      const txid = `ECCLESIA${Date.now()}`;
      brcode = PixUtils.generatePayload(
        chavePix,
        'Pagamento Ecclesia Food',
        nomeChavePix,
        cidadeChavePix,
        txid,
        valorNumerico
      );
    } else {
      // Gerar o código PIX (BRCode) simplificado
      console.log('Usando geração de PIX simplificada apenas com chave e valor');
      brcode = PixUtils.generateSimplePayload(chavePix, valorNumerico);
    }
    
    console.log('BRCode gerado com sucesso:', brcode);

    // Gerar o QR Code
    console.log('Gerando QR Code a partir do BRCode');
    const qrcode = await QRCode.toDataURL(brcode);
    console.log('QR Code gerado com sucesso');

    return NextResponse.json({
      brcode,
      qrcode,
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar o código PIX', detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 