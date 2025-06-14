import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import chromium from '@sparticuz/chromium';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const evento = searchParams.get('evento') || 'Festa Paroquial';
    const igreja = searchParams.get('igreja') || '';
    const codigo = searchParams.get('codigo') || 'PED1234';
    const itens = searchParams.get('itens') || 'DOCINHO';
    const autoImprimir = searchParams.get('imprimir') === 'true'; // Novo parâmetro

    // Dividir os itens por vírgula
    const listaItens = itens.split(',').map(item => item.trim().toUpperCase());

    console.log('Gerando etiquetas:', { evento, igreja, codigo, listaItens, autoImprimir });

    // HTML com CSS embutido para as etiquetas
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page {
            size: 80mm 200mm;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background: white;
            font-family: Arial, sans-serif;
          }
          .page {
            width: 70mm;
            min-height: 40mm;
            border: 5px solid black;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
            page-break-after: always;
            padding: 4mm;
          }
          .page:last-child {
            page-break-after: avoid;
          }
          .evento {
            font-size: 14px;
            margin-bottom: 8px;
            text-align: center;
            word-wrap: break-word;
            hyphens: auto;
            max-width: 100%;
            line-height: 1.2;
          }
          .produto {
            font-size: 32px;
            font-weight: bold;
            margin: 8px 0;
            text-align: center;
            line-height: 1.1;
            word-wrap: break-word;
            hyphens: auto;
            max-width: 100%;
          }
          .codigo {
            font-size: 12px;
            margin-bottom: 8px;
            text-align: center;
          }
          .logo {
            font-size: 11px;
            text-align: center;
            margin-top: 4px;
          }
        </style>
      </head>
      <body>
        ${listaItens
          .map(
            (produto) => {
              // Calcular tamanho da fonte baseado no comprimento do texto
              let fontSize = 32;
              if (produto.length > 15) fontSize = 24;
              if (produto.length > 25) fontSize = 20;
              if (produto.length > 35) fontSize = 18;
              
              // Montar texto do evento com igreja
              const eventoCompleto = igreja ? `${evento} - ${igreja}` : evento;
              
              return `
          <div class="page">
            <div class="evento">${eventoCompleto}</div>
            <div class="produto" style="font-size: ${fontSize}px;">${produto}</div>
            <div class="codigo">${codigo}</div>
            <div class="logo">ECCLESIA FOOD</div>
          </div>
        `;
            }
          )
          .join('')}
      </body>
      </html>
    `;

    // Configurar Puppeteer (compatível com Vercel)
    const isProduction = process.env.NODE_ENV === 'production';
    
    const browser = await puppeteer.launch({
      args: isProduction ? chromium.args : [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      executablePath: isProduction ? await chromium.executablePath() : puppeteer.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // Definir conteúdo HTML
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    // Gerar PDF
    const pdfBuffer = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      format: undefined // Usar o tamanho definido no CSS
    });

    await browser.close();

    console.log(`PDF gerado com sucesso: ${listaItens.length} etiquetas`);

    // 🖨️ IMPRESSÃO AUTOMÁTICA
    if (autoImprimir) {
      try {
        console.log('🖨️ Iniciando impressão automática...');
        
        // Salvar PDF temporariamente
        const tempDir = '/tmp';
        const tempFileName = `etiquetas_${Date.now()}.pdf`;
        const tempFilePath = path.join(tempDir, tempFileName);
        
        fs.writeFileSync(tempFilePath, pdfBuffer);
        console.log(`📄 PDF salvo temporariamente: ${tempFilePath}`);

        // Detectar impressoras disponíveis
        const { stdout: printers } = await execAsync('lpstat -p');
        console.log('🖨️ Impressoras disponíveis:', printers);

        // Procurar por impressoras térmicas comuns
        const thermalPrinters = [
          'Printer_POS_80',
          'POS-80',
          'Thermal',
          'Receipt',
          'Tomate'
        ];

        let printerName = null;
        for (const thermal of thermalPrinters) {
          if (printers.includes(thermal)) {
            printerName = thermal;
            break;
          }
        }

        // Se não encontrou impressora específica, usar a padrão
        if (!printerName) {
          try {
            const { stdout: defaultPrinter } = await execAsync('lpstat -d');
            const match = defaultPrinter.match(/destination: (.+)/);
            if (match) {
              printerName = match[1];
            }
          } catch (error) {
            console.log('⚠️ Não foi possível detectar impressora padrão');
          }
        }

        if (printerName) {
          console.log(`🖨️ Imprimindo na impressora: ${printerName}`);
          
          // Comando de impressão otimizado para impressora térmica
          const printCommand = `lp -d "${printerName}" -o media=Custom.80x200mm -o fit-to-page "${tempFilePath}"`;
          
          await execAsync(printCommand);
          console.log('✅ Impressão enviada com sucesso!');
          
          // Limpar arquivo temporário após 5 segundos
          setTimeout(() => {
            try {
              fs.unlinkSync(tempFilePath);
              console.log('🗑️ Arquivo temporário removido');
            } catch (error) {
              console.log('⚠️ Erro ao remover arquivo temporário:', error);
            }
          }, 5000);

          // Retornar resposta de sucesso com impressão
          return NextResponse.json({
            success: true,
            message: `Etiquetas geradas e impressas com sucesso! ${listaItens.length} tickets enviados para ${printerName}`,
            etiquetas: listaItens.length,
            impressora: printerName
          });

        } else {
          console.log('⚠️ Nenhuma impressora encontrada - retornando apenas PDF');
          
          // Limpar arquivo temporário
          fs.unlinkSync(tempFilePath);
          
          // Retornar PDF normalmente se não conseguir imprimir
          return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'inline; filename=etiquetas.pdf',
              'Cache-Control': 'no-cache',
              'X-Print-Status': 'no-printer-found'
            }
          });
        }

      } catch (printError) {
        console.error('❌ Erro na impressão automática:', printError);
        
        // Se der erro na impressão, retorna o PDF normalmente
        return new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename=etiquetas.pdf',
            'Cache-Control': 'no-cache',
            'X-Print-Error': 'true'
          }
        });
      }
    }

    // Retornar PDF normalmente (sem impressão automática)
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename=etiquetas.pdf',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar etiquetas',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 