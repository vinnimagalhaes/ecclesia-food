import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PixUtils } from '@/utils/PixUtils';

// Forçar o uso do runtime Node.js
export const runtime = 'nodejs';

// Tornar a rota dinâmica para evitar cacheamento
export const dynamic = 'force-dynamic';

// Removida a chave PIX de demonstração hardcoded

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

    // Verificar se há uma chave PIX válida
    // Não usar fallback - se não houver chave, retornar erro
    if (!chavePixRecebida || chavePixRecebida.trim() === '') {
      console.error('Chave PIX não fornecida ou vazia');
      return NextResponse.json(
        { error: 'Chave PIX não configurada. Configure uma chave PIX nas configurações do sistema.' },
        { status: 400 }
      );
    }

    const chavePix = chavePixRecebida.trim();

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
    if (!valorNumerico) {
      console.log('Valor inválido ou não fornecido');
      return NextResponse.json(
        { error: 'Valor inválido para gerar o PIX.' },
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