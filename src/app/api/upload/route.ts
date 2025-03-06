import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { v4 as uuidv4 } from 'uuid';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// Função para receber um upload de imagem
export async function POST(req: Request) {
  try {
    console.log('POST /api/upload - Iniciando');
    
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log('Usuário não autenticado');
      return NextResponse.json(
        { message: 'Usuário não autenticado' },
        { status: 401 }
      );
    }
    
    // Receber a imagem via formData
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('Nenhum arquivo enviado');
      return NextResponse.json(
        { message: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }
    
    // Verificar o tipo do arquivo
    if (!file.type.startsWith('image/')) {
      console.log('Tipo de arquivo inválido', file.type);
      return NextResponse.json(
        { message: 'Apenas imagens são permitidas' },
        { status: 400 }
      );
    }
    
    // Gerar um nome único para o arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Criar um nome único para o arquivo
    const fileExtension = file.name.split('.').pop() || 'png';
    const fileName = `${uuidv4()}.${fileExtension}`;
    
    // Definir o caminho onde a imagem será salva
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadDir, fileName);
    
    // Garantir que o diretório de uploads exista
    try {
      await writeFile(filePath, buffer);
      console.log('Arquivo salvo com sucesso em', filePath);
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      return NextResponse.json(
        { message: 'Erro ao salvar o arquivo' },
        { status: 500 }
      );
    }
    
    // Retornar o caminho público da imagem
    const publicPath = `/uploads/${fileName}`;
    return NextResponse.json(
      { url: publicPath },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 