import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { v2 as cloudinary } from 'cloudinary';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';

// Configurar o Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

    try {
      // Converter o arquivo para base64
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64Data = buffer.toString('base64');
      const mimeType = file.type;
      const dataURI = `data:${mimeType};base64,${base64Data}`;

      // Upload para o Cloudinary
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'ecclesia-food',
        resource_type: 'auto',
      });

      console.log('Upload para Cloudinary bem sucedido:', result.secure_url);

      // Retornar a URL segura da imagem
      return NextResponse.json(
        { url: result.secure_url },
        { status: 201 }
      );
    } catch (error) {
      console.error('Erro no upload para Cloudinary:', error);
      return NextResponse.json(
        { message: 'Erro ao fazer upload da imagem' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no upload de imagem:', error);
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 