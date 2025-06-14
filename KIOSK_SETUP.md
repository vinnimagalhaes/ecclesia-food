# 📱 Guia de Configuração - Modo Kiosk

## 🎯 Objetivo
Configurar um tablet para funcionar como terminal dedicado do Ecclesia Food, onde os clientes digitam o código do pedido e imprimem suas etiquetas.

## 🔧 Configuração do Tablet

### **Android (Recomendado)**

#### 1. Instalar o PWA
1. **Abra o Chrome** no tablet
2. **Acesse**: `https://seu-dominio.vercel.app/seu-pedido`
3. **Clique no menu** (3 pontos) → "Instalar app"
4. **Confirme** a instalação
5. **Ícone aparecerá** na tela inicial

#### 2. Configurar Modo Kiosk
1. **Vá em Configurações** → Segurança
2. **Ative "Fixar apps"** (App Pinning)
3. **Abra o app Ecclesia Food**
4. **Pressione** botão "Recentes" (quadrado)
5. **Clique no ícone de alfinete** no app
6. **Confirme** - tablet ficará travado no app

#### 3. Configurações Adicionais
```
Configurações → Tela:
- Tempo limite: Nunca
- Brilho: Automático
- Rotação: Retrato (bloqueado)

Configurações → Som:
- Volume: Médio
- Notificações: Desabilitadas

Configurações → Aplicativos:
- Ecclesia Food: Permitir em segundo plano
```

### **iPad (iOS)**

#### 1. Instalar o PWA
1. **Abra o Safari**
2. **Acesse**: `https://seu-dominio.vercel.app/seu-pedido`
3. **Toque no botão compartilhar** (quadrado com seta)
4. **Selecione** "Adicionar à Tela de Início"
5. **Confirme** o nome e toque "Adicionar"

#### 2. Configurar Acesso Guiado
1. **Vá em Ajustes** → Acessibilidade
2. **Acesse Guiado** → Ativar
3. **Configure** código de acesso
4. **Abra o app Ecclesia Food**
5. **Triplo clique** no botão lateral
6. **Ative o Acesso Guiado**

## 🖨️ Configuração da Impressora

### **Conexão USB**
1. **Conecte** a impressora térmica via USB
2. **Instale drivers** se necessário
3. **Teste** a impressão pelo sistema

### **Configuração no Sistema**
1. **Acesse** Configurações de Impressora
2. **Adicione** a impressora térmica
3. **Configure** papel 80mm
4. **Teste** uma impressão

## 🔒 Recursos do Modo Kiosk

### **Bloqueios Ativos:**
- ✅ **Seleção de texto** desabilitada
- ✅ **Menu de contexto** bloqueado
- ✅ **Teclas de atalho** (F12, Ctrl+U, etc.) bloqueadas
- ✅ **Zoom** desabilitado
- ✅ **Gestos multi-touch** bloqueados
- ✅ **Atualização** (F5, Ctrl+R) bloqueada

### **Funcionalidades Mantidas:**
- ✅ **Teclado virtual** funcional
- ✅ **Botões de navegação** do app
- ✅ **Impressão** funcionando
- ✅ **Conexão de rede** ativa

## 📋 Checklist de Instalação

### **Antes de Configurar:**
- [ ] Tablet carregado (100%)
- [ ] WiFi configurado e estável
- [ ] Impressora conectada e testada
- [ ] URL do sistema anotada

### **Durante a Configuração:**
- [ ] PWA instalado com sucesso
- [ ] Modo kiosk ativado
- [ ] Tela não desliga automaticamente
- [ ] App abre direto na tela de busca
- [ ] Teclado virtual funciona
- [ ] Impressão testada

### **Após Configuração:**
- [ ] Teste completo: buscar código → imprimir
- [ ] Verificar se não consegue sair do app
- [ ] Testar reconexão após queda de internet
- [ ] Documentar configurações específicas

## 🚨 Solução de Problemas

### **App não instala:**
```
- Verificar se é HTTPS
- Limpar cache do navegador
- Tentar em modo anônimo primeiro
- Verificar conexão de internet
```

### **Modo kiosk não funciona:**
```
- Verificar se App Pinning está ativo
- Reiniciar tablet
- Tentar desinstalar e reinstalar PWA
- Verificar versão do Android/iOS
```

### **Impressora não funciona:**
```
- Verificar conexão USB
- Reinstalar drivers
- Testar impressão pelo sistema
- Verificar papel e tinta
```

### **Tela desliga:**
```
- Configurar "Nunca desligar"
- Verificar modo economia de energia
- Manter carregador conectado
```

## 🔄 Manutenção

### **Diária:**
- Verificar se app está funcionando
- Testar uma impressão
- Limpar tela do tablet

### **Semanal:**
- Verificar atualizações do PWA
- Limpar cache se necessário
- Verificar papel da impressora

### **Mensal:**
- Atualizar sistema do tablet
- Verificar configurações de kiosk
- Backup das configurações

## 📞 Suporte

### **Problemas Técnicos:**
1. **Reiniciar** o tablet
2. **Verificar** conexão de internet
3. **Testar** impressora separadamente
4. **Reinstalar** PWA se necessário

### **Emergência:**
- **Sair do modo kiosk**: Segurar botão power + volume
- **Acesso às configurações**: Código de desbloqueio
- **Impressão manual**: Usar sistema do tablet

---

## 🎉 Sistema Configurado!

Após seguir este guia, você terá:

✅ **Tablet dedicado** ao Ecclesia Food
✅ **Modo kiosk** ativo e seguro
✅ **Impressão automática** funcionando
✅ **Interface otimizada** para touch
✅ **Sistema robusto** e confiável

**O tablet estará pronto para uso em eventos! 🚀** 