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
  qrCodePix: string;
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
    qrCodePix: '',
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code PIX
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {configPagamento.qrCodePix ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={configPagamento.qrCodePix}
                            alt="QR Code PIX"
                            className="w-64 h-64 object-contain"
                          />
                          <Button
                            variant="secondary"
                            className="mt-4"
                            onClick={() => setConfigPagamento(prev => ({ ...prev, qrCodePix: '' }))}
                          >
                            Remover QR Code
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <label
                              htmlFor="qr-code-upload"
                              className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                            >
                              <span>Fazer upload do QR Code PIX</span>
                              <input
                                id="qr-code-upload"
                                name="qr-code-upload"
                                type="file"
                                className="sr-only"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setConfigPagamento(prev => ({
                                        ...prev,
                                        qrCodePix: reader.result as string
                                      }));
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                            <p className="pl-1">ou arraste e solte</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            PNG, JPG até 10MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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
      </div>
    </div>
  );
} 