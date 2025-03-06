import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('[CHURCH_POST] Session:', session);
    
    if (!session?.user?.id) {
      console.log('[CHURCH_POST] Unauthorized - No session or user ID');
      return new NextResponse('Unauthorized - No session or user ID', { status: 401 });
    }

    const body = await req.json();
    console.log('[CHURCH_POST] Request body:', body);
    
    const { name, address, city, state, phone, description } = body;

    // Validar campos obrigatórios
    if (!name || !city || !state) {
      console.log('[CHURCH_POST] Missing required fields');
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Verificar se já existe uma igreja para este usuário
    const existingChurch = await db.church.findUnique({
      where: { userId: session.user.id },
    });

    if (existingChurch) {
      console.log('[CHURCH_POST] Church already exists for user');
      return new NextResponse('Igreja já cadastrada para este usuário', { status: 400 });
    }

    console.log('[CHURCH_POST] Creating church for user:', session.user.id);

    // Criar o perfil da igreja
    const church = await db.church.create({
      data: {
        name,
        address: address || '',
        city,
        state,
        phone: phone || '',
        description: description || '',
        userId: session.user.id,
      },
    });

    console.log('[CHURCH_POST] Church created successfully:', church);
    return NextResponse.json(church);
  } catch (error) {
    console.error('[CHURCH_POST] Error:', error);
    
    if (error instanceof Error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error('[CHURCH_POST] Prisma error code:', error.code);
        return new NextResponse(`Database error: ${error.message}`, { status: 500 });
      }
      
      if (error instanceof Prisma.PrismaClientValidationError) {
        console.error('[CHURCH_POST] Prisma validation error');
        return new NextResponse(`Validation error: ${error.message}`, { status: 400 });
      }
      
      return new NextResponse(
        JSON.stringify({ 
          error: 'Internal Server Error', 
          message: error.message
        }), 
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    return new NextResponse(
      JSON.stringify({ 
        error: 'Internal Server Error', 
        message: 'Unknown error'
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 