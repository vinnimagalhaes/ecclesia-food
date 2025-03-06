import { NextResponse } from 'next/server';
import { withUserAuth } from '@/utils/api-helpers';
import { db } from '@/lib/db';

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
  taxaServico: number;
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

      // Buscar configurações do usuário atual
      const configs = await db.systemConfig.findMany({
        where: { 
          userId: userId,
          key: {
            in: ['perfilIgreja', 'configPagamento']
          }
        }
      });
      
      console.log(`Configurações encontradas: ${configs.length}`);
      
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
        taxaServico: 0,
      };

      // Inicializar com valores padrão
      const configuracoes: Configuracoes = {
        perfilIgreja: { ...defaultPerfilIgreja },
        configPagamento: { ...defaultConfigPagamento }
      };
      
      // Atualizar com valores do banco de dados
      configs.forEach((config) => {
        try {
          const valor = JSON.parse(config.value);
          if (config.key === 'perfilIgreja') {
            configuracoes.perfilIgreja = { ...defaultPerfilIgreja, ...valor };
          } else if (config.key === 'configPagamento') {
            configuracoes.configPagamento = { ...defaultConfigPagamento, ...valor };
          }
        } catch (e) {
          console.error(`Erro ao processar configuração ${config.key}:`, e);
        }
      });
      
      // Buscar os dados do perfil da igreja do modelo Church
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
      
      // Salvar configuração como um único objeto
      try {
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

        // Se for perfil da igreja e estiver completo, verificar o email automaticamente
        if (tipo === 'perfilIgreja' && isPerfilCompleto(dados)) {
          console.log('Perfil completo, verificando email automaticamente');
          await db.user.update({
            where: { id: userId },
            data: {
              emailVerified: new Date()
            }
          });
          
          // Atualizar também o modelo Church
          const churchData = {
            name: dados.nome,
            address: dados.endereco,
            city: dados.cidade,
            state: dados.estado,
            phone: dados.telefone,
            description: '',
          };
          
          // Verificar se já existe um perfil de igreja
          const existingChurch = await db.church.findUnique({
            where: { userId }
          });
          
          if (existingChurch) {
            // Atualizar o perfil da igreja existente
            await db.church.update({
              where: { userId },
              data: churchData
            });
          } else {
            // Criar um novo perfil de igreja
            await db.church.create({
              data: {
                ...churchData,
                userId
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