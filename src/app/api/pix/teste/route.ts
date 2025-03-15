import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PixUtils } from '@/utils/PixUtils';

// Forçar o uso do runtime Node.js
export const runtime = 'nodejs';

// Tornar a rota dinâmica para evitar cacheamento
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    console.log('Iniciando geração de PIX de teste');
    
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
    
    const { valor, chavePix } = body;

    // Verificar se há uma chave PIX válida
    const chavePixFinal = chavePix?.trim() || 'use-sua-chave-aqui'; // Coloque aqui sua chave PIX real para teste

    console.log('Usando chave PIX de teste:', chavePixFinal);

    // Garantir que temos um valor numérico válido
    const valorNumerico = typeof valor === 'number' && !isNaN(valor) && valor > 0
      ? valor
      : 1.00; // Valor padrão de 1 real

    console.log('Gerando BRCode PIX simplificado com os dados:', { valorNumerico, chavePix: chavePixFinal });
    
    let brcode;
    
    try {
      // Sempre usar o método simplificado que é mais compatível com bancos
      console.log('Usando geração de PIX simplificada para maior compatibilidade');
      brcode = PixUtils.generateSimplePayload(chavePixFinal, valorNumerico);
      
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
        chavePix: chavePixFinal, // Retornar a chave usada para referência
        valor: valorNumerico
      }, { status: 200 });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return NextResponse.json(
        { error: 'Erro ao gerar o QR Code PIX', detalhes: 'Falha na geração da imagem QR Code' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao gerar PIX de teste:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar o código PIX de teste', detalhes: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
} 