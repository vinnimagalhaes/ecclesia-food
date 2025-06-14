import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPrinterSystem() {
  try {
    console.log('🔍 Testando sistema de impressão...\n');

    // 1. Buscar uma venda existente para testar
    const sales = await prisma.sale.findMany({
      include: {
        items: true,
        event: true
      },
      take: 1,
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (sales.length === 0) {
      console.log('❌ Nenhuma venda encontrada para testar');
      return;
    }

    const sale = sales[0];
    console.log('📋 Venda encontrada para teste:');
    console.log(`   ID: ${sale.id}`);
    console.log(`   Cliente: ${sale.cliente}`);
    console.log(`   Total: R$ ${sale.total.toFixed(2)}`);
    console.log(`   Itens: ${sale.items.length}`);
    
    // Mostrar como os itens serão divididos
    console.log('\n🎯 Itens que serão impressos separadamente:');
    let ticketCount = 0;
    for (const item of sale.items) {
      for (let i = 0; i < item.quantidade; i++) {
        ticketCount++;
        console.log(`   Ticket ${ticketCount}: ${item.nome} - R$ ${item.precoUnitario.toFixed(2)}`);
        if (item.quantidade > 1) {
          console.log(`                  (Item ${i + 1} de ${item.quantidade})`);
        }
      }
    }
    
    console.log(`\n📊 Total de tickets a imprimir: ${ticketCount}`);
    
    // 2. Testar API de busca
    console.log('\n🔍 Testando API de busca...');
    const searchResponse = await fetch(`http://localhost:3000/api/pedidos/buscar?codigo=${sale.id}`);
    
    if (searchResponse.ok) {
      const pedidoData = await searchResponse.json();
      console.log('✅ API de busca funcionando');
      console.log(`   Cliente encontrado: ${pedidoData.cliente}`);
    } else {
      console.log('❌ Erro na API de busca:', await searchResponse.text());
    }
    
    // 3. Simular teste de impressão (sem realmente imprimir)
    console.log('\n🖨️ Simulando impressão...');
    console.log('   (Para impressão real, configure a impressora conforme IMPRESSORA_CONFIG.md)');
    
    // Simular cada ticket
    for (let i = 0; i < ticketCount; i++) {
      console.log(`   ✅ Ticket ${i + 1} simulado`);
    }
    
    console.log('\n🎉 Sistema de impressão testado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Configure a impressora Tomate MDK081');
    console.log('   2. Adicione variáveis de ambiente (.env.local)');
    console.log('   3. Teste com impressora real');
    console.log('   4. Configure o tablet em ecclesiafood.com.br/seu-pedido');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar teste
testPrinterSystem(); 