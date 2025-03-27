import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * GET - Busca horários de missa de uma igreja específica
 */
export async function GET(req: Request) {
  try {
    // Obter churchId da URL
    const { searchParams } = new URL(req.url);
    const churchId = searchParams.get('churchId');

    console.log('GET /api/igrejas/mass-schedules - churchId:', churchId);

    if (!churchId) {
      console.error('ID da igreja não informado');
      return NextResponse.json(
        { error: 'ID da igreja não informado' },
        { status: 400 }
      );
    }

    // Verificar se a igreja existe
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });

    console.log('Igreja encontrada:', church);

    if (!church) {
      console.error('Igreja não encontrada:', churchId);
      return NextResponse.json(
        { error: 'Igreja não encontrada' },
        { status: 404 }
      );
    }

    // Buscar horários de missa da igreja
    const massSchedules = await prisma.massSchedule.findMany({
      where: { churchId },
      orderBy: [
        { dayOfWeek: 'asc' },
        { time: 'asc' }
      ]
    });

    console.log('Horários encontrados:', massSchedules);

    return NextResponse.json({ massSchedules });
  } catch (error) {
    console.error('Erro ao obter horários de missa:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar horários de missa' },
      { status: 500 }
    );
  }
}

/**
 * POST - Adiciona um novo horário de missa para uma igreja
 * Requer autenticação de administrador da igreja
 */
export async function POST(req: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const { churchId, dayOfWeek, time, notes } = await req.json();
    console.log('POST /api/igrejas/mass-schedules - Dados recebidos:', { churchId, dayOfWeek, time, notes });

    if (!churchId || !dayOfWeek || !time) {
      console.error('Dados obrigatórios não informados:', { churchId, dayOfWeek, time });
      return NextResponse.json(
        { error: 'Dados obrigatórios não informados' },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem permissão para gerenciar esta igreja
    const church = await prisma.church.findUnique({
      where: { id: churchId },
    });

    console.log('Igreja encontrada:', church);

    if (!church) {
      console.error('Igreja não encontrada:', churchId);
      return NextResponse.json(
        { error: 'Igreja não encontrada' },
        { status: 404 }
      );
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && church.userId !== session.user.id) {
      console.error('Usuário não autorizado a gerenciar esta igreja:', {
        userId: session.user.id,
        churchUserId: church.userId,
        userRole: session.user.role
      });
      return NextResponse.json(
        { error: 'Não autorizado a gerenciar esta igreja' },
        { status: 403 }
      );
    }

    // Adicionar horário de missa
    const massSchedule = await prisma.massSchedule.create({
      data: {
        dayOfWeek,
        time,
        notes,
        churchId
      }
    });

    console.log('Horário criado com sucesso:', massSchedule);

    return NextResponse.json({ massSchedule });
  } catch (error) {
    console.error('Erro ao adicionar horário de missa:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar horário de missa' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove um horário de missa
 * Requer autenticação de administrador da igreja
 */
export async function DELETE(req: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.error('Usuário não autenticado');
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter ID do horário a ser excluído
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    console.log('DELETE /api/igrejas/mass-schedules - id:', id);

    if (!id) {
      console.error('ID do horário não informado');
      return NextResponse.json(
        { error: 'ID do horário não informado' },
        { status: 400 }
      );
    }

    // Buscar horário para verificar a igreja
    const massSchedule = await prisma.massSchedule.findUnique({
      where: { id },
      include: { church: true }
    });

    console.log('Horário encontrado:', massSchedule);

    if (!massSchedule) {
      console.error('Horário não encontrado:', id);
      return NextResponse.json(
        { error: 'Horário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar permissão
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN' && massSchedule.church.userId !== session.user.id) {
      console.error('Usuário não autorizado a gerenciar esta igreja:', {
        userId: session.user.id,
        churchUserId: massSchedule.church.userId,
        userRole: session.user.role
      });
      return NextResponse.json(
        { error: 'Não autorizado a gerenciar esta igreja' },
        { status: 403 }
      );
    }

    // Excluir horário
    await prisma.massSchedule.delete({
      where: { id }
    });

    console.log('Horário excluído com sucesso:', id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir horário de missa:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir horário de missa' },
      { status: 500 }
    );
  }
} 