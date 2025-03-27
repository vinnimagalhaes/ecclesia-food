'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Save, Church, CreditCard, User, Settings, Bell, Clock, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigPagamento {
  aceitaDinheiro: boolean;
  aceitaCartao: boolean;
  aceitaPix: boolean;
  chavePix: string;
  tipoPix: string;
}

// Interface para horário de missa
interface HorarioMissa {
  id?: string;
  dayOfWeek: 'DOMINGO' | 'SEGUNDA' | 'TERCA' | 'QUARTA' | 'QUINTA' | 'SEXTA' | 'SABADO' | 'FERIADO';
  time: string;
  notes?: string;
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
  };

  const [configPagamento, setConfigPagamento] = useState(defaultConfigPagamento);

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [perfilSalvoComSucesso, setPerfilSalvoComSucesso] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  // Estado para horários de missa
  const [horariosMissa, setHorariosMissa] = useState<HorarioMissa[]>([]);
  const [novoHorario, setNovoHorario] = useState<HorarioMissa>({
    dayOfWeek: 'DOMINGO',
    time: '10:00',
    notes: ''
  });
  const [editandoHorarioId, setEditandoHorarioId] = useState<string | null>(null);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [salvandoHorario, setSalvandoHorario] = useState(false);

  // Mapeamento para os nomes dos dias da semana
  const diasSemana = {
    DOMINGO: 'Domingo',
    SEGUNDA: 'Segunda-feira',
    TERCA: 'Terça-feira',
    QUARTA: 'Quarta-feira',
    QUINTA: 'Quinta-feira',
    SEXTA: 'Sexta-feira',
    SABADO: 'Sábado',
    FERIADO: 'Feriados'
  };

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

  // Carregar horários de missa
  useEffect(() => {
    async function carregarHorariosMissa() {
      if (!perfilIgreja.nome) return; // Só carrega se tiver perfil
      
      try {
        setCarregandoHorarios(true);
        // Obtém o ID da igreja a partir da API para buscar os horários
        const perfilResponse = await fetch('/api/igrejas/current');
        
        if (!perfilResponse.ok) {
          throw new Error('Erro ao obter perfil da igreja');
        }
        
        const perfilData = await perfilResponse.json();
        const churchId = perfilData.church?.id;
        
        if (!churchId) {
          console.log('Perfil de igreja não encontrado');
          return;
        }
        
        const response = await fetch(`/api/igrejas/mass-schedules?churchId=${churchId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao carregar horários de missa');
        }
        
        const data = await response.json();
        setHorariosMissa(data.massSchedules || []);
      } catch (error) {
        console.error('Erro ao carregar horários de missa:', error);
        toast.error('Erro ao carregar horários de missa');
      } finally {
        setCarregandoHorarios(false);
      }
    }
    
    carregarHorariosMissa();
  }, [perfilIgreja.nome]);

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
  
  // Função para formatar CPF: 000.000.000-00
  const formatarCPF = (valor: string) => {
    // Remove tudo que não for dígito
    const apenasDigitos = valor.replace(/\D/g, '');
    
    // Aplica a máscara
    return apenasDigitos
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .slice(0, 14); // Limita ao tamanho máximo de um CPF formatado
  };
  
  // Função para formatar CNPJ: 00.000.000/0001-00
  const formatarCNPJ = (valor: string) => {
    // Remove tudo que não for dígito
    const apenasDigitos = valor.replace(/\D/g, '');
    
    // Aplica a máscara
    return apenasDigitos
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .slice(0, 18); // Limita ao tamanho máximo de um CNPJ formatado
  };
  
  // Função para formatar telefone: +55 (00) 00000-0000
  const formatarTelefone = (valor: string) => {
    // Remove tudo que não for dígito
    const apenasDigitos = valor.replace(/\D/g, '');
    
    // Aplica a máscara
    if (apenasDigitos.length <= 2) {
      return apenasDigitos;
    }
    if (apenasDigitos.length <= 4) {
      return `+${apenasDigitos.slice(0, 2)} (${apenasDigitos.slice(2)}`;
    }
    if (apenasDigitos.length <= 6) {
      return `+${apenasDigitos.slice(0, 2)} (${apenasDigitos.slice(2, 4)}) ${apenasDigitos.slice(4)}`;
    }
    if (apenasDigitos.length <= 11) {
      return `+${apenasDigitos.slice(0, 2)} (${apenasDigitos.slice(2, 4)}) ${apenasDigitos.slice(4, 9)}-${apenasDigitos.slice(9)}`;
    }
    return `+${apenasDigitos.slice(0, 2)} (${apenasDigitos.slice(2, 4)}) ${apenasDigitos.slice(4, 9)}-${apenasDigitos.slice(9, 13)}`;
  };
  
  // Função para validar email
  const validarEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };
  
  // Função para atualizar a chave PIX com formatação adequada
  const atualizarChavePix = (valor: string) => {
    let valorFormatado = valor;
    
    switch (configPagamento.tipoPix) {
      case 'cpf':
        valorFormatado = formatarCPF(valor);
        break;
      case 'cnpj':
        valorFormatado = formatarCNPJ(valor);
        break;
      case 'telefone':
        valorFormatado = formatarTelefone(valor);
        break;
      case 'email':
        // Email não precisa de formatação especial, mas podemos limitar caracteres inválidos
        valorFormatado = valor.replace(/\s/g, ''); // Remove espaços
        break;
      case 'aleatoria':
        // Chave aleatória geralmente é alfanumérica e não tem formatação especial
        break;
    }
    
    setConfigPagamento(prev => ({
      ...prev,
      chavePix: valorFormatado
    }));
  };
  
  // Verificar validade da chave PIX antes de salvar
  const verificarChavePixValida = () => {
    if (!configPagamento.aceitaPix || !configPagamento.chavePix) {
      return true; // Não precisa validar se PIX não for aceito ou se a chave estiver vazia
    }
    
    switch (configPagamento.tipoPix) {
      case 'cpf':
        return configPagamento.chavePix.length === 14; // 000.000.000-00
      case 'cnpj':
        return configPagamento.chavePix.length === 18; // 00.000.000/0001-00
      case 'telefone':
        return configPagamento.chavePix.length >= 19; // +55 (00) 00000-0000
      case 'email':
        return validarEmail(configPagamento.chavePix);
      case 'aleatoria':
        return configPagamento.chavePix.length > 0;
      default:
        return true;
    }
  };
  
  const salvarConfiguracoes = async (tipo: string) => {
    try {
      let dados;
      setSalvando(true);
      setPerfilSalvoComSucesso(false);
      
      if (tipo === 'perfil da igreja') {
        dados = perfilIgreja;
      } else if (tipo === 'pagamento') {
        // Validar chave PIX antes de salvar
        if (configPagamento.aceitaPix && configPagamento.chavePix && !verificarChavePixValida()) {
          setSalvando(false);
          toast.error(`Chave PIX inválida. Verifique o formato para o tipo ${configPagamento.tipoPix.toUpperCase()}.`);
          return;
        }
        
        dados = configPagamento;
        
        // Verificar dados críticos da configuração PIX
        if (configPagamento.aceitaPix) {
          console.log('Validando configuração PIX antes de enviar:', {
            chavePix: configPagamento.chavePix,
            tipoPix: configPagamento.tipoPix
          });
          
          if (!configPagamento.chavePix || configPagamento.chavePix.trim() === '') {
            setSalvando(false);
            toast.error('A chave PIX não pode estar vazia.');
            return;
          }
        }
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

  // Função para alterar a senha do usuário
  const alterarSenha = async () => {
    try {
      // Validações
      if (!senhaAtual) {
        toast.error('A senha atual é obrigatória');
        return;
      }
      
      if (!novaSenha) {
        toast.error('A nova senha é obrigatória');
        return;
      }
      
      if (novaSenha !== confirmarSenha) {
        toast.error('As senhas não coincidem');
        return;
      }
      
      if (novaSenha.length < 6) {
        toast.error('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }
      
      setAlterandoSenha(true);
      
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: senhaAtual,
          newPassword: novaSenha,
        }),
      });
      
      if (response.ok) {
        toast.success('Senha alterada com sucesso!');
        // Limpar os campos
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao alterar senha');
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      toast.error('Ocorreu um erro ao alterar a senha');
    } finally {
      setAlterandoSenha(false);
    }
  };

  // Função para encerrar outras sessões
  const encerrarOutrasSessoes = async () => {
    try {
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success('Todas as outras sessões foram encerradas');
      } else {
        toast.error('Erro ao encerrar sessões');
      }
    } catch (error) {
      console.error('Erro ao encerrar sessões:', error);
      toast.error('Ocorreu um erro ao encerrar sessões');
    }
  };

  // Função para adicionar/atualizar horário de missa
  const salvarHorarioMissa = async () => {
    try {
      setSalvandoHorario(true);
      
      // Validações básicas
      if (!novoHorario.time) {
        toast.error('O horário é obrigatório');
        return;
      }
      
      // Obter o ID da igreja
      const perfilResponse = await fetch('/api/igrejas/current');
      if (!perfilResponse.ok) {
        throw new Error('Erro ao obter perfil da igreja');
      }
      
      const perfilData = await perfilResponse.json();
      const churchId = perfilData.church?.id;
      
      if (!churchId) {
        toast.error('Perfil de igreja não encontrado');
        return;
      }
      
      if (editandoHorarioId) {
        // Atualizar horário existente - essa API ainda precisa ser implementada
        toast.error('Edição de horários ainda não está disponível');
        // Limpar estado de edição
        setEditandoHorarioId(null);
      } else {
        // Adicionar novo horário
        const response = await fetch('/api/igrejas/mass-schedules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...novoHorario,
            churchId
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao adicionar horário');
        }
        
        const data = await response.json();
        
        // Adicionar o novo horário à lista
        setHorariosMissa(prev => [...prev, data.massSchedule]);
        
        // Resetar o formulário
        setNovoHorario({
          dayOfWeek: 'DOMINGO',
          time: '10:00',
          notes: ''
        });
        
        toast.success('Horário adicionado com sucesso');
      }
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar horário');
    } finally {
      setSalvandoHorario(false);
    }
  };

  // Função para excluir horário de missa
  const excluirHorarioMissa = async (id: string) => {
    try {
      const response = await fetch(`/api/igrejas/mass-schedules?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Erro ao excluir horário');
      }
      
      // Remover o horário da lista
      setHorariosMissa(prev => prev.filter(horario => horario.id !== id));
      toast.success('Horário excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  // Função para preparar edição de horário
  const prepararEditarHorario = (horario: HorarioMissa) => {
    setNovoHorario({
      dayOfWeek: horario.dayOfWeek,
      time: horario.time,
      notes: horario.notes || ''
    });
    // Garantir que o id não seja undefined
    if (horario.id) {
      setEditandoHorarioId(horario.id);
    }
  };

  // Função para cancelar edição
  const cancelarEdicao = () => {
    setEditandoHorarioId(null);
    setNovoHorario({
      dayOfWeek: 'DOMINGO',
      time: '10:00',
      notes: ''
    });
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
                    onChange={(e) => {
                      // Limpar a chave PIX ao mudar o tipo para evitar formatos inválidos
                      setConfigPagamento(prev => ({
                        ...prev,
                        tipoPix: e.target.value,
                        chavePix: ''
                      }));
                    }}
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
                    type={configPagamento.tipoPix === 'email' ? 'email' : 'text'}
                    value={configPagamento.chavePix}
                    onChange={(e) => atualizarChavePix(e.target.value)}
                    className={`w-full px-3 py-2 border ${
                      configPagamento.chavePix && !verificarChavePixValida() 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-primary-500'
                    } rounded-md focus:outline-none focus:ring-2`}
                    placeholder={
                      configPagamento.tipoPix === 'cpf' ? '000.000.000-00' :
                      configPagamento.tipoPix === 'cnpj' ? '00.000.000/0001-00' :
                      configPagamento.tipoPix === 'email' ? 'exemplo@email.com' :
                      configPagamento.tipoPix === 'telefone' ? '+55 (00) 00000-0000' :
                      'Chave aleatória gerada pelo banco'
                    }
                  />
                  {configPagamento.chavePix && !verificarChavePixValida() && (
                    <p className="mt-1 text-sm text-red-500">
                      Formato inválido para {
                        configPagamento.tipoPix === 'cpf' ? 'CPF. Use: 000.000.000-00' :
                        configPagamento.tipoPix === 'cnpj' ? 'CNPJ. Use: 00.000.000/0001-00' :
                        configPagamento.tipoPix === 'email' ? 'e-mail. Use um e-mail válido' :
                        configPagamento.tipoPix === 'telefone' ? 'telefone. Use: +55 (00) 00000-0000' :
                        'chave aleatória'
                      }
                    </p>
                  )}
                </div>
              </>
            )}
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

        {/* Alteração de Senha */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-semibold">Segurança da Conta</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Alterar Senha</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div className="md:col-span-2 h-0 md:h-auto"></div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Button
                variant="primary"
                className="flex items-center gap-2"
                onClick={alterarSenha}
                disabled={alterandoSenha}
              >
                <Save size={16} />
                <span>Alterar Senha</span>
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium mb-4">Sessões Ativas</h3>
            
            <div className="mb-4">
              <p className="text-gray-600">
                Você está conectado neste dispositivo. Pode encerrar todas as outras sessões clicando no botão abaixo.
              </p>
            </div>
            
            <Button
              variant="secondary"
              className="flex items-center gap-2"
              onClick={encerrarOutrasSessoes}
            >
              <span>Encerrar Outras Sessões</span>
            </Button>
          </div>
        </div>

        {/* Seção de Horários de Missa */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-primary-500 mr-2" />
            <h2 className="text-xl font-semibold">Horários de Missa</h2>
          </div>
          
          <p className="text-gray-600 mb-6">
            Configure os horários de missa para sua igreja. Estes horários serão exibidos para os usuários no aplicativo.
          </p>
          
          <div className="mb-6 border-b pb-6">
            <h3 className="font-medium mb-3">Adicionar novo horário</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="dayOfWeek" className="block text-gray-700 text-sm font-medium mb-1">
                  Dia da semana
                </label>
                <select
                  id="dayOfWeek"
                  value={novoHorario.dayOfWeek}
                  onChange={(e) => setNovoHorario({
                    ...novoHorario,
                    dayOfWeek: e.target.value as HorarioMissa['dayOfWeek']
                  })}
                  className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(diasSemana).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="time" className="block text-gray-700 text-sm font-medium mb-1">
                  Horário
                </label>
                <input
                  type="time"
                  id="time"
                  value={novoHorario.time}
                  onChange={(e) => setNovoHorario({
                    ...novoHorario,
                    time: e.target.value
                  })}
                  className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="notes" className="block text-gray-700 text-sm font-medium mb-1">
                Observações (opcional)
              </label>
              <textarea
                id="notes"
                value={novoHorario.notes || ''}
                onChange={(e) => setNovoHorario({
                  ...novoHorario,
                  notes: e.target.value
                })}
                placeholder="Ex: Missa com música, Missa das crianças, etc."
                className="block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-primary-500 focus:border-primary-500 h-20 resize-none"
              />
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={salvarHorarioMissa}
                disabled={salvandoHorario}
                variant="primary"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                {editandoHorarioId ? 'Atualizar Horário' : 'Adicionar Horário'}
              </Button>
              
              {editandoHorarioId && (
                <Button
                  onClick={cancelarEdicao}
                  variant="outline"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
          
          <h3 className="font-medium mb-3">Horários cadastrados</h3>
          
          {carregandoHorarios ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-t-4 border-primary-500 border-solid rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando horários...</p>
            </div>
          ) : horariosMissa.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Nenhum horário de missa cadastrado</p>
            </div>
          ) : (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Horários cadastrados</h3>
              <div className="grid grid-cols-7 gap-4">
                {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, index) => {
                  // Mapeamento para os valores reais no enum
                  const diasEnum = ['DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO'];
                  const diaEnum = diasEnum[index];
                  
                  return (
                    <div key={dia} className="bg-white rounded-lg p-4 shadow-sm">
                      <h4 className="font-medium text-gray-900 mb-2">{dia}</h4>
                      <div className="space-y-2">
                        {horariosMissa
                          .filter((h) => h.dayOfWeek === diaEnum)
                          .map((horario) => (
                            <div
                              key={horario.id}
                              className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                            >
                              <span className="text-sm text-gray-600">
                                {horario.time}
                              </span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => prepararEditarHorario(horario)}
                                  className="text-primary-600 hover:text-primary-700"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={() => excluirHorarioMissa(horario.id!)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        {horariosMissa.filter((h) => h.dayOfWeek === diaEnum).length === 0 && (
                          <p className="text-sm text-gray-500 italic">Nenhum horário cadastrado</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 