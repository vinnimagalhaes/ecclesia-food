'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Save, Church, CreditCard, User, Settings, Bell } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigPagamento {
  aceitaDinheiro: boolean;
  aceitaCartao: boolean;
  aceitaPix: boolean;
  chavePix: string;
  tipoPix: string;
  nomeChavePix: string;
}

export default function ConfiguracoesPage() {
  // Estados para os formulários com valores iniciais vazios
  const [perfilIgreja, setPerfilIgreja] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    telefone: '',
    email: '',
    responsavel: '',
  });
  
  const defaultConfigPagamento: ConfigPagamento = {
    aceitaDinheiro: true,
    aceitaCartao: true,
    aceitaPix: true,
    chavePix: '',
    tipoPix: 'cpf',
    nomeChavePix: '',
  };

  const [configPagamento, setConfigPagamento] = useState(defaultConfigPagamento);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [perfilSalvoComSucesso, setPerfilSalvoComSucesso] = useState(false);

  // Carregar configurações da API ao iniciar
  useEffect(() => {
    async function carregarConfiguracoes() {
      try {
        setLoading(true);
        console.log('Carregando configurações...');
        const response = await fetch('/api/configuracoes');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Configurações carregadas:', data);
          if (data.perfilIgreja) {
            setPerfilIgreja(data.perfilIgreja);
          }
          if (data.configPagamento) {
            setConfigPagamento(data.configPagamento);
          }
        } else {
          console.error('Erro ao carregar configurações. Status:', response.status);
          const errorData = await response.json().catch(() => ({}));
          console.error('Detalhes do erro:', errorData);
          toast.error('Erro ao carregar configurações');
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      } finally {
        setLoading(false);
      }
    }

    carregarConfiguracoes();
  }, []);

  // Handlers para atualizar os estados
  const atualizarPerfilIgreja = (campo: string, valor: string) => {
    setPerfilIgreja(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const atualizarConfigPagamento = (campo: string, valor: string | boolean | number) => {
    setConfigPagamento(prev => ({
      ...prev,
      [campo]: valor
    }));
  };
  
  const salvarConfiguracoes = async (tipo: string) => {
    try {
      let dados;
      setSalvando(true);
      setPerfilSalvoComSucesso(false);
      
      if (tipo === 'perfil da igreja') {
        dados = perfilIgreja;
      } else if (tipo === 'pagamento') {
        dados = configPagamento;
      } else {
        toast.info('Funcionalidade não implementada completamente');
        setSalvando(false);
        return;
      }
      
      console.log(`Salvando configurações de ${tipo}:`, dados);
      
      const response = await fetch('/api/configuracoes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tipo: tipo === 'perfil da igreja' ? 'perfilIgreja' : 'configPagamento',
          dados 
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Resposta do servidor:', result);
        toast.success(`Configurações de ${tipo} salvas com sucesso!`);
        
        if (tipo === 'perfil da igreja') {
          setPerfilSalvoComSucesso(true);
        }
      } else {
        const error = await response.json();
        console.error('Erro ao salvar configurações:', error);
        toast.error(`Erro ao salvar: ${error.error || 'Tente novamente'}`);
      }
    } catch (error) {
      console.error(`Erro ao salvar configurações de ${tipo}:`, error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      {/* Seções de Configurações */}
      <div className="grid grid-cols-1 gap-6">
        {/* Perfil da Igreja */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex flex-wrap justify-between items-center mb-6">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <Church className="h-5 w-5 text-gray-700" />
              <h2 className="text-lg font-semibold">Perfil da Igreja</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button 
                onClick={() => salvarConfiguracoes('perfil da igreja')}
                disabled={salvando}
                className="flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Salvar Perfil</span>
                  </>
                )}
              </Button>
              
              {perfilSalvoComSucesso && (
                <Button 
                  variant="secondary"
                  className="flex items-center gap-2"
                  onClick={() => window.location.href = '/catalogo/igrejas'}
                >
                  <span>Ver no Catálogo</span>
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da Igreja
              </label>
              <input
                type="text"
                value={perfilIgreja.nome}
                onChange={(e) => atualizarPerfilIgreja('nome', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsável
              </label>
              <input
                type="text"
                value={perfilIgreja.responsavel}
                onChange={(e) => atualizarPerfilIgreja('responsavel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={perfilIgreja.endereco}
                onChange={(e) => atualizarPerfilIgreja('endereco', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={perfilIgreja.cidade}
                  onChange={(e) => atualizarPerfilIgreja('cidade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <input
                  type="text"
                  value={perfilIgreja.estado}
                  onChange={(e) => atualizarPerfilIgreja('estado', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CEP
              </label>
              <input
                type="text"
                value={perfilIgreja.cep}
                onChange={(e) => atualizarPerfilIgreja('cep', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                value={perfilIgreja.telefone}
                onChange={(e) => atualizarPerfilIgreja('telefone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={perfilIgreja.email}
                onChange={(e) => atualizarPerfilIgreja('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
        
        {/* Configurações de Pagamento */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-semibold">Configurações de Pagamento</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Métodos de Pagamento Aceitos</h3>
              
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configPagamento.aceitaDinheiro}
                    onChange={(e) => atualizarConfigPagamento('aceitaDinheiro', e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>Dinheiro</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configPagamento.aceitaCartao}
                    onChange={(e) => atualizarConfigPagamento('aceitaCartao', e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>Cartão (Crédito/Débito)</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={configPagamento.aceitaPix}
                    onChange={(e) => atualizarConfigPagamento('aceitaPix', e.target.checked)}
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>PIX</span>
                </label>
              </div>
            </div>
            
            {/* Chave PIX (condicional) */}
            {configPagamento.aceitaPix && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo da Chave PIX
                  </label>
                  <select
                    value={configPagamento.tipoPix}
                    onChange={(e) => atualizarConfigPagamento('tipoPix', e.target.value)}
                    className="w-[250px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="telefone">Telefone</option>
                    <option value="aleatoria">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chave PIX
                  </label>
                  <input
                    type="text"
                    value={configPagamento.chavePix}
                    onChange={(e) => atualizarConfigPagamento('chavePix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={
                      configPagamento.tipoPix === 'cpf' ? '000.000.000-00' :
                      configPagamento.tipoPix === 'cnpj' ? '00.000.000/0001-00' :
                      configPagamento.tipoPix === 'email' ? 'exemplo@email.com' :
                      configPagamento.tipoPix === 'telefone' ? '+55 (00) 00000-0000' :
                      'Chave aleatória gerada pelo banco'
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome cadastrado da Chave PIX
                  </label>
                  <input
                    type="text"
                    value={configPagamento.nomeChavePix}
                    onChange={(e) => atualizarConfigPagamento('nomeChavePix', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nome completo do titular da chave"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo da Chave PIX
              </label>
              <select
                value={configPagamento.tipoPix}
                onChange={(e) => atualizarConfigPagamento('tipoPix', e.target.value)}
                className="w-[250px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="telefone">Telefone</option>
                <option value="aleatoria">Chave Aleatória</option>
              </select>
            </div>
          </div>
          
          <div>
            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => salvarConfiguracoes('pagamento')}
            >
              <Save size={16} />
              <span>Salvar Configurações de Pagamento</span>
            </Button>
          </div>
        </div>
        
        {/* Configurações do Sistema */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-semibold">Configurações do Sistema</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Notificações */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-5 w-5 text-primary-500" />
                <h3 className="font-medium">Notificações</h3>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>Enviar notificações por e-mail</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>Enviar notificações por WhatsApp</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>Notificar sobre novas vendas</span>
                </label>
              </div>
            </div>
            
            {/* Privacidade */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-primary-500" />
                <h3 className="font-medium">Privacidade</h3>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>Solicitar login para compras</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span>Mostrar detalhes de contato</span>
                </label>
              </div>
            </div>
            
            {/* Backups */}
            <div className="md:col-span-2 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-5 w-5 text-primary-500" />
                <h3 className="font-medium">Backup e Restauração</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span>Realizar backups automáticos</span>
                  </label>
                  
                  <select 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    defaultValue="daily"
                  >
                    <option value="daily">Diariamente</option>
                    <option value="weekly">Semanalmente</option>
                    <option value="monthly">Mensalmente</option>
                  </select>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="secondary">
                    Fazer Backup Manual
                  </Button>
                  
                  <Button variant="secondary">
                    Restaurar Backup
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => salvarConfiguracoes('sistema')}
            >
              <Save size={16} />
              <span>Salvar Configurações do Sistema</span>
            </Button>
          </div>
        </div>
        
        {/* Gerenciamento de Usuários */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-semibold">Usuários e Permissões</h2>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600">
              Gerencie usuários do sistema e suas permissões. Adicione administradores e operadores.
            </p>
          </div>
          
          <div>
            <Button
              variant="primary"
              className="flex items-center gap-2"
              onClick={() => salvarConfiguracoes('usuários')}
            >
              <User size={16} />
              <span>Gerenciar Usuários</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 