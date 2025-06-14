import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Importação da biblioteca de impressão térmica
// @ts-ignore - A biblioteca não tem tipos TypeScript
const ThermalPrinter = require('node-thermal-printer').printer;
const PrinterTypes = require('node-thermal-printer').types;

interface PrinterConfig {
  type: string;
  interface: string;
  characterSet?: string;
  removeSpecialCharacters?: boolean;
  lineCharacter?: string;
  options?: {
    timeout?: number;
  };
}

// Função para detectar o sistema operacional e configurar interface
function getPrinterInterface() {
  // Se definido manualmente nas variáveis de ambiente, use
  if (process.env.PRINTER_INTERFACE) {
    return process.env.PRINTER_INTERFACE;
  }
  
  // Se IP for definido, use TCP
  if (process.env.PRINTER_IP) {
    return `tcp://${process.env.PRINTER_IP}:${process.env.PRINTER_PORT || 9100}`;
  }
  
  // Detectar SO automaticamente
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS - Tentar diferentes interfaces
    // Primeiro tentar o nome da impressora, depois fallback para USB
    return process.env.PRINTER_INTERFACE || '/dev/usb/lp0';
  } else if (platform === 'linux') {
    return '/dev/usb/lp0';
  } else if (platform === 'win32') {
    return 'LPT1';
  }
  
  // Fallback
  return '/dev/usb/lp0';
}

// Configuração da impressora
const printerConfig: PrinterConfig = {
  type: PrinterTypes.EPSON, // Tomate MDK081 é compatível com comandos EPSON
  interface: getPrinterInterface(),
  removeSpecialCharacters: true,
  lineCharacter: '=',
  options: {
    timeout: 5000,
  },
};

// Se usar rede, configurar IP
if (process.env.PRINTER_IP) {
  printerConfig.interface = `tcp://${process.env.PRINTER_IP}:9100`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pedidoId } = body;

    if (!pedidoId) {
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar venda com itens
    const sale = await db.sale.findUnique({
      where: {
        id: pedidoId
      },
      include: {
        items: true,
        event: {
          select: {
            id: true,
            nome: true,
          }
        }
      }
    });

    if (!sale) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Log da configuração
    console.log('Configuração da impressora:', {
      platform: process.platform,
      interface: printerConfig.interface,
      type: printerConfig.type
    });

    // Preparar dados da impressão primeiro
    const nomeEvento = sale.event?.nome || 'Evento';
    
    // Expandir itens para impressão individual
    const itensParaImprimir = [];
    for (const item of sale.items) {
      // Criar uma entrada para cada unidade do item
      for (let i = 0; i < item.quantidade; i++) {
        itensParaImprimir.push({
          nome: item.nome,
          preco: item.precoUnitario,
          numeroItem: i + 1,
          totalItens: item.quantidade,
        });
      }
    }

    console.log(`Preparando impressão de ${itensParaImprimir.length} tickets para o pedido ${pedidoId}`);

    // Tentar diferentes interfaces para macOS
    const possibleInterfaces = process.platform === 'darwin' 
      ? ['Printer_POS_80', '/dev/usb/lp0', '/dev/tty.usbserial', 'printer']
      : [printerConfig.interface];

    let printer = null;
    let isConnected = false;
    let workingInterface = null;

    console.log('Testando conexão com diferentes interfaces...');
    
    for (const testInterface of possibleInterfaces) {
      try {
        console.log(`Tentando interface: ${testInterface}`);
        
        const testConfig = {
          ...printerConfig,
          interface: testInterface
        };
        
        const testPrinter = new ThermalPrinter(testConfig);
        const connected = await testPrinter.isPrinterConnected();
        
        console.log(`Interface ${testInterface}: ${connected ? 'CONECTADA' : 'não conectada'}`);
        
        if (connected) {
          printer = testPrinter;
          isConnected = true;
          workingInterface = testInterface;
          break;
        }
      } catch (error) {
        console.log(`Erro ao testar interface ${testInterface}:`, error instanceof Error ? error.message : String(error));
      }
    }

    console.log('Resultado final:', { isConnected, workingInterface });
    
    // Se não estiver conectada, tentar impressão direta via sistema (macOS)
    if (!isConnected && process.platform === 'darwin') {
      console.log('🖨️ Tentando impressão direta via sistema macOS...');
      
      try {
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        // Verificar se a impressora está disponível no sistema
        const { stdout } = await execAsync('lpstat -p Printer_POS_80');
        
        if (stdout.includes('ociosa') || stdout.includes('idle')) {
          console.log('✅ Impressora detectada via sistema - usando impressão direta');
          
          // Imprimir cada ticket via comando do sistema
          for (let i = 0; i < itensParaImprimir.length; i++) {
            const item = itensParaImprimir[i];
            
                        // Criar nome do item GRANDE com espaçamento entre letras
            const nomeItem = item.nome.toUpperCase();
            const nomeGrande = nomeItem.split('').join(' ');
            
            const ticketContent = `

(${nomeEvento})



${nomeGrande}

(${sale.id})



ECCLESIA FOOD


`;
            
            // Enviar para impressora via lp
            await execAsync(`echo "${ticketContent}" | lp -d Printer_POS_80`);
            console.log(`✅ Ticket ${i + 1}/${itensParaImprimir.length} enviado via sistema: ${item.nome}`);
            
            // Pausa entre impressões
            if (i < itensParaImprimir.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
          
          // Atualizar status do pedido
          if (sale.status === 'PENDENTE') {
            await db.sale.update({
              where: { id: pedidoId },
              data: { 
                status: 'FINALIZADA',
                dataFinalizacao: new Date()
              }
            });
          }
          
          return NextResponse.json({
            success: true,
            mode: 'system_direct',
            message: `✅ ${itensParaImprimir.length} tickets impressos via sistema!`,
            ticketsImpressos: itensParaImprimir.length,
            pedidoId: pedidoId,
            method: 'macOS lp command'
          });
        }
      } catch (systemError) {
        console.log('❌ Erro na impressão direta via sistema:', systemError instanceof Error ? systemError.message : String(systemError));
      }
    }
    
    // Se não estiver conectada, usar modo simulação apenas em desenvolvimento
    if (!isConnected) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎭 IMPRESSORA NÃO CONECTADA - Ativando modo simulação');
        
        // Simular a impressão
        console.log(`📄 Simulando impressão de ${itensParaImprimir.length} tickets...`);
        for (let i = 0; i < itensParaImprimir.length; i++) {
          const item = itensParaImprimir[i];
          console.log(`🎫 Ticket ${i + 1}/${itensParaImprimir.length}: ${item.nome} - R$ ${item.preco.toFixed(2)}`);
        }
        
        // Atualizar status do pedido
        if (sale.status === 'PENDENTE') {
          await db.sale.update({
            where: { id: pedidoId },
            data: { 
              status: 'FINALIZADA',
              dataFinalizacao: new Date()
            }
          });
        }
        
        return NextResponse.json({
          success: true,
          mode: 'simulation',
          message: `✅ ${itensParaImprimir.length} tickets simulados com sucesso! (Impressora não conectada)`,
          ticketsImpressos: itensParaImprimir.length,
          pedidoId: pedidoId,
          items: itensParaImprimir.map((item, i) => `Ticket ${i+1}: ${item.nome}`)
        });
      } else {
        console.error('Impressora não conectada. Interface configurada:', printerConfig.interface);
        return NextResponse.json(
          { 
            error: 'Impressora não conectada. Verifique a conexão.',
            interface: printerConfig.interface,
            platform: process.platform,
            suggestion: process.platform === 'darwin' 
              ? 'Para macOS: Tente definir PRINTER_INTERFACE=Printer_POS_80 no .env.local'
              : 'Verifique a conexão USB ou configure PRINTER_IP no .env.local'
          },
          { status: 500 }
        );
      }
    }

    console.log(`Imprimindo ${itensParaImprimir.length} tickets para o pedido ${pedidoId}`);

    // Imprimir cada item separadamente
    for (let i = 0; i < itensParaImprimir.length; i++) {
      const item = itensParaImprimir[i];
      
      try {
        // Limpar buffer da impressora
        printer.clear();
        
        // Tudo centralizado
        printer.alignCenter();
        
        // Espaço inicial
        printer.newLine();
        
        // Nome do evento (entre parênteses)
        printer.setTextSize(0, 0);
        printer.println(`(${nomeEvento})`);
        
        // Espaços
        printer.newLine();
        printer.newLine();
        printer.newLine();
        
        // Nome do item (fonte maior e negrito) - usando comandos diretos
        const nomeItemBiblioteca = item.nome.toUpperCase();
        const nomeEspacado = nomeItemBiblioteca.split('').join(' ');
        
        printer.setTextSize(2, 2); // Tamanho ainda maior
        printer.bold(true);
        printer.println(nomeEspacado);
        printer.bold(false);
        printer.setTextSize(0, 0); // Voltar ao normal
        
        // Espaço
        printer.newLine();
        
        // Código do pedido (entre parênteses)
        printer.setTextSize(0, 0);
        printer.println(`(${sale.id})`);
        
        // Espaços
        printer.newLine();
        printer.newLine();
        printer.newLine();
        
        // Logo/Rodapé
        printer.setTextSize(0, 0);
        printer.println('ECCLESIA FOOD');
        
        // Espaçamento final
        printer.newLine();
        printer.newLine();
        printer.newLine();
        
        // Cortar papel
        printer.cut();
        
        // Enviar para impressora
        await printer.execute();
        
        console.log(`Ticket ${i + 1}/${itensParaImprimir.length} impresso: ${item.nome}`);
        
        // Pequena pausa entre impressões para evitar problemas
        if (i < itensParaImprimir.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (printError) {
        console.error(`Erro ao imprimir ticket ${i + 1}:`, printError);
        // Continuar com os próximos tickets mesmo se um falhar
      }
    }

    // Atualizar status do pedido se estava pendente
    if (sale.status === 'PENDENTE') {
      await db.sale.update({
        where: { id: pedidoId },
        data: { 
          status: 'FINALIZADA',
          dataFinalizacao: new Date()
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `${itensParaImprimir.length} tickets impressos com sucesso`,
      ticketsImpressos: itensParaImprimir.length,
      pedidoId: pedidoId
    });

  } catch (error) {
    console.error('Erro ao imprimir pedido:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao imprimir pedido',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 