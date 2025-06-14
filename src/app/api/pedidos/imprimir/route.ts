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

// Configuração da impressora
const printerConfig: PrinterConfig = {
  type: PrinterTypes.EPSON, // Tomate MDK081 é compatível com comandos EPSON
  interface: process.env.PRINTER_INTERFACE || '/dev/usb/lp0', // USB por padrão
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

    // Inicializar impressora
    const printer = new ThermalPrinter(printerConfig);

    // Verificar se a impressora está conectada
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.error('Impressora não conectada');
      return NextResponse.json(
        { error: 'Impressora não conectada. Verifique a conexão.' },
        { status: 500 }
      );
    }

    // Preparar dados da impressão
    const dataAtual = new Date().toLocaleString('pt-BR');
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

    console.log(`Imprimindo ${itensParaImprimir.length} tickets para o pedido ${pedidoId}`);

    // Imprimir cada item separadamente
    for (let i = 0; i < itensParaImprimir.length; i++) {
      const item = itensParaImprimir[i];
      
      try {
        // Limpar buffer da impressora
        printer.clear();
        
        // Configurar alinhamento
        printer.alignCenter();
        
        // Cabeçalho
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println('ECCLESIA FOOD');
        printer.bold(false);
        printer.println(nomeEvento);
        printer.drawLine();
        
        // Informações do pedido
        printer.alignLeft();
        printer.setTextSize(0, 0);
        printer.println(`Pedido: ${sale.id}`);
        printer.println(`Cliente: ${sale.cliente}`);
        printer.println(`Data: ${dataAtual}`);
        printer.drawLine();
        
        // Item (cada ticket tem apenas 1 item)
        printer.alignCenter();
        printer.setTextSize(1, 1);
        printer.bold(true);
        printer.println(item.nome);
        printer.bold(false);
        
        // Preço
        printer.setTextSize(0, 1);
        printer.println(`R$ ${item.preco.toFixed(2)}`);
        
        // Informação de quantidade se necessário
        if (item.totalItens > 1) {
          printer.setTextSize(0, 0);
          printer.println(`Item ${item.numeroItem} de ${item.totalItens}`);
        }
        
        printer.drawLine();
        
        // Rodapé
        printer.alignCenter();
        printer.setTextSize(0, 0);
        printer.println('Obrigado pela preferencia!');
        printer.println('Ecclesia Food - Alimentando com amor');
        
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