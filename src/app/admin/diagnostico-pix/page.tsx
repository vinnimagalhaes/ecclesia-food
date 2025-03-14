'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { AppHeader } from '@/components/ui/AppHeader';
import { CheckCircle, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';

export default function DiagnosticoPIXPage() {
  const router = useRouter();
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const verificarConfigPIX = async () => {
      try {
        setCarregando(true);
        setErro(null);
        
        const response = await fetch('/api/pix/verificar');
        const data = await response.json();
        
        console.log('Diagnóstico PIX:', data);
        setDiagnostico(data);
      } catch (error) {
        console.error('Erro ao verificar configuração PIX:', error);
        setErro('Não foi possível verificar a configuração PIX');
      } finally {
        setCarregando(false);
      }
    };
    
    verificarConfigPIX();
  }, []);
  
  const irParaConfiguracoes = () => {
    router.push('/configuracoes');
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppHeader 
        title="Diagnóstico PIX" 
        showBackButton={true}
        sticky={true}
      />
      
      <div className="flex-1 p-4">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h1 className="text-xl font-bold mb-4">Verificação da Configuração PIX</h1>
            
            {carregando ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 border-t-4 border-primary-500 border-solid rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600">Verificando configuração...</p>
              </div>
            ) : erro ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{erro}</p>
                  </div>
                </div>
              </div>
            ) : diagnostico ? (
              <div className="space-y-6">
                {/* Status Geral */}
                <div className={`p-4 rounded-lg ${
                  diagnostico.status === 'OK' ? 'bg-green-50 border-green-500' :
                  diagnostico.status === 'WARNING' ? 'bg-yellow-50 border-yellow-500' :
                  'bg-red-50 border-red-500'
                } border-l-4`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {diagnostico.status === 'OK' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : diagnostico.status === 'WARNING' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">
                        {diagnostico.status === 'OK' ? 'Tudo certo!' : 
                         diagnostico.status === 'WARNING' ? 'Atenção' : 'Problema encontrado'}
                      </p>
                      <p className="text-sm">
                        {diagnostico.message}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Detalhes das verificações */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Detalhes da verificação:</h2>
                  
                  <div className="space-y-3">
                    {/* Configuração Existe */}
                    <div className="flex items-center">
                      {diagnostico.configExiste ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span>Configuração de pagamento existe</span>
                    </div>
                    
                    {/* Aceita PIX */}
                    {diagnostico.configExiste && (
                      <div className="flex items-center">
                        {diagnostico.aceitaPix ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span>Pagamento PIX habilitado</span>
                      </div>
                    )}
                    
                    {/* Chave PIX Configurada */}
                    {diagnostico.configExiste && diagnostico.aceitaPix && (
                      <div className="flex items-center">
                        {diagnostico.chaveConfigured ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span>Chave PIX configurada</span>
                      </div>
                    )}
                    
                    {/* Nome Beneficiário */}
                    {diagnostico.configExiste && diagnostico.aceitaPix && diagnostico.chaveConfigured && (
                      <div className="flex items-center">
                        {diagnostico.nomeConfigured ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span>Nome do beneficiário configurado</span>
                      </div>
                    )}
                    
                    {/* Cidade Beneficiário */}
                    {diagnostico.configExiste && diagnostico.aceitaPix && diagnostico.chaveConfigured && (
                      <div className="flex items-center">
                        {diagnostico.cidadeConfigured ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span>Cidade do beneficiário configurada</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Detalhes da Chave PIX (se tudo OK) */}
                {diagnostico.status === 'OK' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Chave PIX utilizada:</h3>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Tipo:</span> {diagnostico.tipo.toUpperCase()}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Chave:</span> {diagnostico.chavePartes}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Botão de ação */}
                {diagnostico.status !== 'OK' && (
                  <div className="mt-6">
                    <Button 
                      onClick={irParaConfiguracoes}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <span>Ir para Configurações</span>
                      <ArrowRight size={16} />
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          
          {/* Instruções */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Como configurar corretamente o PIX</h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm mb-3">Siga estes passos para configurar o pagamento PIX:</p>
                
                <ol className="list-decimal list-inside space-y-3 text-sm">
                  <li>Acesse a página de <strong>Configurações</strong></li>
                  <li>Na seção <strong>Configurações de Pagamento</strong>, marque a opção <strong>PIX</strong></li>
                  <li>Selecione o <strong>Tipo da Chave PIX</strong> (CPF, CNPJ, E-mail, Telefone ou Chave Aleatória)</li>
                  <li>Digite sua <strong>Chave PIX</strong> no formato correto</li>
                  <li>Preencha o <strong>Nome cadastrado da Chave PIX</strong> (exatamente como registrado no banco)</li>
                  <li>Preencha a <strong>Cidade do beneficiário da chave PIX</strong></li>
                  <li>Clique em <strong>Salvar Configurações de Pagamento</strong></li>
                </ol>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-700">Importante:</p>
                    <p className="text-sm text-yellow-700">
                      Todos os campos são <strong>obrigatórios</strong> para o funcionamento correto do PIX.
                      Os dados devem corresponder exatamente aos registrados no seu banco.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 