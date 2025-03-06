import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';

// Caminho para o arquivo de backup
const DATA_FILE_PATH = path.join(process.cwd(), 'vendas-backup.json');

// GET /api/vendas/[id] - Obter uma venda específica
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`GET /api/vendas/${params.id} - Iniciando`);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Buscar a venda no banco de dados
    const venda = await db.sale.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        event: true
      }
    });
    
    if (!venda) {
      console.log('Venda não encontrada');
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }
    
    console.log('Venda encontrada:', venda.id);
    return NextResponse.json(venda);
  } catch (error) {
    console.error(`Erro ao buscar venda ${params.id}:`, error);
    
    // Tentar buscar no backup como fallback
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const dadosArquivo = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        const vendasBackup = JSON.parse(dadosArquivo);
        const vendaBackup = vendasBackup.find((v: any) => v.id === params.id);
        
        if (vendaBackup) {
          console.log('Venda encontrada no backup:', vendaBackup.id);
          return NextResponse.json(vendaBackup);
        }
      }
    } catch (backupError) {
      console.error('Erro ao ler backup:', backupError);
    }
    
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PATCH /api/vendas/[id] - Atualizar status de uma venda
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`PATCH /api/vendas/${params.id} - Iniciando`);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    const dados = await request.json();
    console.log('Dados recebidos:', dados);
    
    // Verificar se a venda existe
    const vendaExistente = await db.sale.findUnique({
      where: { id: params.id }
    });
    
    if (!vendaExistente) {
      console.log('Venda não encontrada');
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }
    
    // Atualizar a venda no banco de dados
    const vendaAtualizada = await db.sale.update({
      where: { id: params.id },
      data: {
        status: dados.status,
        dataFinalizacao: dados.status === 'FINALIZADA' ? new Date() : vendaExistente.dataFinalizacao,
        // Outros campos que podem ser atualizados
        formaPagamento: dados.formaPagamento || vendaExistente.formaPagamento
      },
      include: {
        items: true,
        event: true
      }
    });
    
    console.log('Venda atualizada:', vendaAtualizada.id);
    
    // Atualizar o backup também
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const dadosArquivo = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        let vendasBackup = JSON.parse(dadosArquivo);
        
        // Atualizar a venda no backup
        vendasBackup = vendasBackup.map((v: any) => {
          if (v.id === params.id) {
            return {
              ...v,
              status: dados.status,
              dataFinalizacao: dados.status === 'FINALIZADA' ? new Date().toISOString() : v.dataFinalizacao
            };
          }
          return v;
        });
        
        // Salvar o backup atualizado
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(vendasBackup, null, 2), 'utf8');
        console.log('Backup atualizado com sucesso');
      }
    } catch (backupError) {
      console.error('Erro ao atualizar backup:', backupError);
    }
    
    return NextResponse.json(vendaAtualizada);
  } catch (error) {
    console.error(`Erro ao atualizar venda ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/vendas/[id] - Excluir uma venda
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/vendas/${params.id} - Iniciando`);
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar se a venda existe
    const vendaExistente = await db.sale.findUnique({
      where: { id: params.id },
      include: { items: true }
    });
    
    if (!vendaExistente) {
      console.log('Venda não encontrada');
      return NextResponse.json(
        { error: 'Venda não encontrada' },
        { status: 404 }
      );
    }
    
    // Excluir os itens da venda primeiro (para evitar erros de integridade referencial)
    if (vendaExistente.items.length > 0) {
      await db.saleItem.deleteMany({
        where: {
          saleId: params.id
        }
      });
    }
    
    // Excluir a venda
    const vendaRemovida = await db.sale.delete({
      where: { id: params.id }
    });
    
    console.log('Venda removida:', vendaRemovida.id);
    
    // Atualizar o backup também
    try {
      if (fs.existsSync(DATA_FILE_PATH)) {
        const dadosArquivo = fs.readFileSync(DATA_FILE_PATH, 'utf8');
        let vendasBackup = JSON.parse(dadosArquivo);
        
        // Remover a venda do backup
        vendasBackup = vendasBackup.filter((v: any) => v.id !== params.id);
        
        // Salvar o backup atualizado
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(vendasBackup, null, 2), 'utf8');
        console.log('Backup atualizado com sucesso');
      }
    } catch (backupError) {
      console.error('Erro ao atualizar backup:', backupError);
    }
    
    return NextResponse.json({
      message: 'Venda removida com sucesso',
      venda: vendaRemovida
    });
  } catch (error) {
    console.error(`Erro ao remover venda ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Erro ao processar a requisição', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 