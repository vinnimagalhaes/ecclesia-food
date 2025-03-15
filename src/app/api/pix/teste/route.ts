import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { PixUtils } from '@/utils/PixUtils';

// Forçar o uso do runtime Node.js
export const runtime = 'nodejs';

// Tornar a rota dinâmica para evitar cacheamento
export const dynamic = 'force-dynamic';

/**
 * Formata a chave PIX de acordo com o tipo
 * @param {string} chavePix - A chave PIX
 * @param {string} tipoPix - O tipo da chave PIX (cpf, email, telefone, aleatoria)
 * @returns {string} - A chave PIX formatada
 */
function formatarChavePix(chavePix: string, tipoPix: string): string {
  // Se não houver tipo, retornar a chave como está
  if (!tipoPix) return chavePix.trim();
  
  const chave = chavePix.trim();
  
  switch (tipoPix.toLowerCase()) {
    case 'cpf':
      // Remove tudo que não for dígito
      return chave.replace(/\D/g, '');
    case 'telefone':
      // Remove tudo que não for dígito e garante formato correto para telefone
      const apenasDigitos = chave.replace(/\D/g, '');
      // Remove o + e o código do país, se houver
      const semCodigoPais = apenasDigitos.replace(/^55/, '');
      // Se começar com 0, remove (alguns apps adicionam 0 antes do DDD)
      return semCodigoPais.replace(/^0/, '');
    case 'email':
      // Email é usado como está, apenas garantindo lowercase
      return chave.toLowerCase();
    case 'aleatoria':
    default:
      // Chave aleatória é usada como está
      return chave;
  }
}

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
    
    const { valor, chavePix, tipoPix = 'cpf' } = body;

    // Verificar se há uma chave PIX válida
    if (!chavePix || chavePix.trim() === '') {
      return NextResponse.json(
        { error: 'Chave PIX não informada' },
        { status: 400 }
      );
    }

    // Formatar a chave PIX de acordo com o tipo
    const chavePixFormatada = formatarChavePix(chavePix, tipoPix);
    console.log(`Chave PIX formatada (${tipoPix}): "${chavePixFormatada}"`);

    // Garantir que temos um valor numérico válido
    const valorNumerico = typeof valor === 'number' && !isNaN(valor) && valor > 0
      ? valor
      : 1.00; // Valor padrão de 1 real

    console.log('Gerando BRCode PIX simplificado com os dados:', { 
      valorNumerico, 
      chavePixOriginal: chavePix,
      chavePixFormatada,
      tipoPix 
    });
    
    let brcode;
    
    try {
      // Usar o método simplificado que é mais compatível com bancos
      console.log('Usando geração de PIX simplificada para maior compatibilidade');
      brcode = PixUtils.generateSimplePayload(chavePixFormatada, valorNumerico);
      
      console.log('BRCode gerado com sucesso:', brcode);
      
      // Analisar o brcode para debugging
      console.log('Análise do BRCode:');
      const pixKeyPart = brcode.match(/26\d{2}0014BR\.GOV\.BCB\.PIX01\d{2}(.*?)(?:\d{2}|$)/);
      if (pixKeyPart && pixKeyPart[1]) {
        console.log(`- Chave PIX extraída do BRCode: "${pixKeyPart[1]}"`);
      }
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
        chavePix: chavePixFormatada,
        tipoPix,
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