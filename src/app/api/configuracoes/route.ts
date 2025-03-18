import { NextResponse } from 'next/server';
import { withUserAuth } from '@/utils/api-helpers';
import { db } from '@/lib/db';

// Configuração para tornar a rota dinâmica
export const dynamic = 'force-dynamic';

export interface SystemConfig {
  id: string;
  key: string;
  value: string;
  userId: string | null;
}

interface PerfilIgreja {
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  telefone: string;
  email: string;
  responsavel: string;
}

interface ConfigPagamento {
  aceitaDinheiro: boolean;
  aceitaCartao: boolean;
  aceitaPix: boolean;
  chavePix: string;
  tipoPix: string;
  taxaServico: number;
  qrCodePix: string;
}

interface Configuracoes {
  perfilIgreja: PerfilIgreja;
  configPagamento: ConfigPagamento;
}

// Função para verificar se o perfil está completo
function isPerfilCompleto(perfil: PerfilIgreja): boolean {
  return Boolean(
    perfil.nome?.trim() &&
    perfil.cidade?.trim()
  );
}

// GET: Obter as configurações
export async function GET(request: Request) {
  return withUserAuth(request, async (userId) => {
    try {
      console.log(`GET /api/configuracoes - userId: ${userId}`);

      // Verificar se existe configuração antiga no SystemConfig e migrar para Church
      const oldPerfilConfig = await db.systemConfig.findFirst({
        where: { 
          userId: userId,
          key: 'perfilIgreja'
        }
      });
      
      // Se encontrar configuração antiga, verificar se precisa migrar
      if (oldPerfilConfig) {
        try {
          const churchProfile = await db.church.findUnique({
            where: { userId }
          });
          
          // Se não existir perfil de igreja ou se for mais antigo que a configuração
          if (!churchProfile || 
              (churchProfile.updatedAt < oldPerfilConfig.updatedAt)) {
            console.log('Migrando dados antigos do SystemConfig para o modelo Church');
            
            const perfilData = JSON.parse(oldPerfilConfig.value);
            const churchData = {
              name: perfilData.nome || '',
              address: perfilData.endereco || '',
              city: perfilData.cidade || '',
              state: perfilData.estado || '',
              phone: perfilData.telefone || '',
              description: perfilData.responsavel || '',
            };
            
            if (churchProfile) {
              // Atualizar perfil existente
              await db.church.update({
                where: { userId },
                data: churchData
              });
            } else {
              // Criar novo perfil
              await db.church.create({
                data: {
                  ...churchData,
                  userId
                }
              });
            }
          }
        } catch (e) {
          console.error('Erro ao migrar dados antigos:', e);
        }
      }

      // Valores padrão
      const defaultPerfilIgreja: PerfilIgreja = {
        nome: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        telefone: '',
        email: '',
        responsavel: '',
      };

      const defaultConfigPagamento: ConfigPagamento = {
        aceitaDinheiro: true,
        aceitaCartao: true,
        aceitaPix: true,
        chavePix: '',
        tipoPix: '',
        taxaServico: 0,
        qrCodePix: '',
      };

      // Inicializar com valores padrão
      const configuracoes: Configuracoes = {
        perfilIgreja: { ...defaultPerfilIgreja },
        configPagamento: { ...defaultConfigPagamento }
      };
      
      // Buscar configurações de pagamento do SystemConfig
      const configPagamento = await db.systemConfig.findFirst({
        where: { 
          userId: userId,
          key: 'configPagamento'
        }
      });
      
      // Atualizar configurações de pagamento se encontradas
      if (configPagamento) {
        try {
          const valor = JSON.parse(configPagamento.value);
          configuracoes.configPagamento = { ...defaultConfigPagamento, ...valor };
        } catch (e) {
          console.error(`Erro ao processar configuração de pagamento:`, e);
        }
      }
      
      // Buscar os dados do perfil da igreja diretamente do modelo Church
      const churchProfile = await db.church.findUnique({
        where: { userId }
      });
      
      console.log('Perfil da igreja encontrado:', churchProfile);
      
      // Se encontrar o perfil da igreja, atualizar os valores no objeto perfilIgreja
      if (churchProfile) {
        configuracoes.perfilIgreja = {
          ...configuracoes.perfilIgreja,
          nome: churchProfile.name || configuracoes.perfilIgreja.nome,
          endereco: churchProfile.address || configuracoes.perfilIgreja.endereco,
          cidade: churchProfile.city || configuracoes.perfilIgreja.cidade,
          estado: churchProfile.state || configuracoes.perfilIgreja.estado,
          telefone: churchProfile.phone || configuracoes.perfilIgreja.telefone,
          responsavel: churchProfile.description || configuracoes.perfilIgreja.responsavel,
        };
      }
      
      return NextResponse.json(configuracoes);
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar configurações' },
        { status: 500 }
      );
    }
  });
}

// POST: Salvar configurações
export async function POST(request: Request) {
  return withUserAuth(request, async (userId, req) => {
    try {
      const body = await req.json();
      const { tipo, dados } = body;
      
      console.log(`POST /api/configuracoes - userId: ${userId}, tipo: ${tipo}`);
      
      if (!tipo || !dados || (tipo !== 'perfilIgreja' && tipo !== 'configPagamento')) {
        return NextResponse.json(
          { error: 'Dados incompletos ou tipo inválido' },
          { status: 400 }
        );
      }
      
      try {
        // Tratamento específico para perfil da igreja
        if (tipo === 'perfilIgreja') {
          // Verificar se o perfil está completo para marcar o email como verificado
          if (isPerfilCompleto(dados)) {
            console.log('Perfil completo, verificando email automaticamente');
            await db.user.update({
              where: { id: userId },
              data: {
                emailVerified: new Date()
              }
            });
          }
          
          // Preparar dados para o modelo Church
          const churchData = {
            name: dados.nome,
            address: dados.endereco,
            city: dados.cidade,
            state: dados.estado,
            phone: dados.telefone,
            description: dados.responsavel || '',
          };
          
          // Verificar se já existe um perfil de igreja
          const existingChurch = await db.church.findUnique({
            where: { userId }
          });
          
          if (existingChurch) {
            // Atualizar o perfil da igreja existente
            console.log(`Atualizando perfil da igreja existente para usuário: ${userId}`);
            await db.church.update({
              where: { userId },
              data: churchData
            });
          } else {
            // Criar um novo perfil de igreja
            console.log(`Criando novo perfil de igreja para usuário: ${userId}`);
            await db.church.create({
              data: {
                ...churchData,
                userId
              }
            });
          }
        } else {
          // Para outros tipos de configuração, continuar usando SystemConfig
          // Verificar se a configuração já existe
          const existingConfig = await db.systemConfig.findFirst({
            where: {
              userId: userId,
              key: tipo
            }
          });
          
          if (existingConfig) {
            // Atualizar configuração existente
            console.log(`Atualizando configuração existente: ${existingConfig.id}`);
            await db.systemConfig.update({
              where: { id: existingConfig.id },
              data: { value: JSON.stringify(dados) }
            });
          } else {
            // Criar nova configuração
            console.log(`Criando nova configuração para usuário: ${userId}`);
            await db.systemConfig.create({
              data: {
                key: tipo,
                value: JSON.stringify(dados),
                userId: userId
              }
            });
          }
        }
      } catch (error) {
        console.error(`Erro ao salvar configuração ${tipo}:`, error);
        throw error;
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar configurações' },
        { status: 500 }
      );
    }
  });
} 