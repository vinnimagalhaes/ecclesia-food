'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definição dos tipos
export type ItemCarrinho = {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  evento?: {
    id: string;
    nome: string;
  };
};

type CarrinhoContextType = {
  itens: ItemCarrinho[];
  total: number;
  adicionarItem: (item: ItemCarrinho) => void;
  removerItem: (id: string) => void;
  atualizarQuantidade: (id: string, quantidade: number) => void;
  limparCarrinho: () => void;
  quantidadeTotal: number;
};

// Criação do contexto
const CarrinhoContext = createContext<CarrinhoContextType | undefined>(undefined);

// Hook personalizado para usar o contexto
export function useCarrinho() {
  const context = useContext(CarrinhoContext);
  if (context === undefined) {
    throw new Error('useCarrinho deve ser usado dentro de um CarrinhoProvider');
  }
  return context;
}

// Provider do contexto
export function CarrinhoProvider({ children }: { children: ReactNode }) {
  // Estado para armazenar os itens do carrinho
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  
  // Calcular o total do carrinho
  const total = itens.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
  
  // Calcular a quantidade total de itens
  const quantidadeTotal = itens.reduce((acc, item) => acc + item.quantidade, 0);
  
  // Carregar itens do localStorage ao iniciar
  useEffect(() => {
    const itensArmazenados = localStorage.getItem('carrinho');
    if (itensArmazenados) {
      try {
        const dados = JSON.parse(itensArmazenados);
        console.log('Carregando carrinho do localStorage:', dados);
        setItens(dados);
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        localStorage.removeItem('carrinho');
      }
    }
  }, []);
  
  // Salvar itens no localStorage quando mudar
  useEffect(() => {
    console.log('Salvando carrinho no localStorage:', itens);
    localStorage.setItem('carrinho', JSON.stringify(itens));
  }, [itens]);
  
  // Adicionar um item ao carrinho
  const adicionarItem = (novoItem: ItemCarrinho) => {
    console.log('Adicionando item ao carrinho:', novoItem);
    
    if (!novoItem.id || !novoItem.nome || novoItem.preco === undefined) {
      console.error('Item inválido:', novoItem);
      return;
    }
    
    setItens(itensAtuais => {
      // Verificar se o item já existe no carrinho
      const itemExistente = itensAtuais.find(item => item.id === novoItem.id);
      
      if (itemExistente) {
        // Atualizar a quantidade se o item já existir
        const itensAtualizados = itensAtuais.map(item => 
          item.id === novoItem.id 
            ? { ...item, quantidade: item.quantidade + novoItem.quantidade } 
            : item
        );
        console.log('Item já existe, atualizando quantidade:', itensAtualizados);
        return itensAtualizados;
      } else {
        // Adicionar novo item se não existir
        const novosItens = [...itensAtuais, novoItem];
        console.log('Adicionando novo item ao carrinho:', novosItens);
        return novosItens;
      }
    });
  };
  
  // Remover um item do carrinho
  const removerItem = (id: string) => {
    console.log('Removendo item do carrinho:', id);
    setItens(itensAtuais => itensAtuais.filter(item => item.id !== id));
  };
  
  // Atualizar a quantidade de um item
  const atualizarQuantidade = (id: string, quantidade: number) => {
    console.log('Atualizando quantidade do item:', id, quantidade);
    
    if (quantidade <= 0) {
      removerItem(id);
      return;
    }
    
    setItens(itensAtuais => 
      itensAtuais.map(item => 
        item.id === id ? { ...item, quantidade } : item
      )
    );
  };
  
  // Limpar o carrinho
  const limparCarrinho = () => {
    console.log('Limpando carrinho');
    setItens([]);
  };
  
  // Valor do contexto
  const value = {
    itens,
    total,
    adicionarItem,
    removerItem,
    atualizarQuantidade,
    limparCarrinho,
    quantidadeTotal
  };
  
  return (
    <CarrinhoContext.Provider value={value}>
      {children}
    </CarrinhoContext.Provider>
  );
} 