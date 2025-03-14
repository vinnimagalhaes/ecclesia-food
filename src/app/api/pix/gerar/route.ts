import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PixUtils } from '@/utils/PixUtils';

// Forçar o uso do runtime Node.js
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    console.log('Iniciando geração de PIX');
    
    const body = await request.json();
    console.log('Dados recebidos:', JSON.stringify(body));
    
    const { valor, chavePix, nomeChavePix, cidadeChavePix } = body;

    // Validar os dados recebidos
    if (!valor || !chavePix || !nomeChavePix || !cidadeChavePix) {
      console.log('Dados incompletos:', { valor, chavePix, nomeChavePix, cidadeChavePix });
      return NextResponse.json(
        { error: 'Dados incompletos para gerar o PIX' },
        { status: 400 }
      );
    }

    console.log('Gerando BRCode PIX com os dados:', { valor, chavePix, nomeChavePix, cidadeChavePix });
    
    // Gerar o código PIX (BRCode)
    const txid = `ECCLESIA${Date.now()}`;
    const brcode = PixUtils.generatePayload(
      chavePix,
      'Pagamento Ecclesia Food',
      nomeChavePix,
      cidadeChavePix,
      txid,
      valor
    );
    
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