import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PixUtils } from '@/utils/PixUtils';

export async function POST(request: Request) {
  try {
    const { valor, chavePix, nomeChavePix, cidadeChavePix } = await request.json();

    // Validar os dados recebidos
    if (!valor || !chavePix || !nomeChavePix || !cidadeChavePix) {
      return NextResponse.json(
        { error: 'Dados incompletos para gerar o PIX' },
        { status: 400 }
      );
    }

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

    // Gerar o QR Code
    const qrcode = await QRCode.toDataURL(brcode);

    return NextResponse.json({
      brcode,
      qrcode,
    });
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar o código PIX' },
      { status: 500 }
    );
  }
} 