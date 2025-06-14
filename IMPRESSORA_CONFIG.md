# 🖨️ Configuração da Impressora Térmica Tomate MDK081

## 📋 **Visão Geral**

O sistema de autoatendimento permite que os clientes:
1. Acessem `ecclesiafood.com.br/seu-pedido` no tablet
2. Digitem o código do pedido
3. Confirmem os dados
4. Imprimam **cada item separadamente** na impressora térmica

## ⚙️ **Configuração da Impressora**

### **USB (Recomendado para estabilidade)**

1. Conecte a impressora via cabo USB
2. Adicione no seu `.env.local`:
```bash
PRINTER_INTERFACE=/dev/usb/lp0
```

### **Rede (TCP/IP)**

1. Configure a impressora na rede local
2. Anote o IP da impressora (ex: 192.168.1.100)
3. Adicione no seu `.env.local`:
```bash
PRINTER_IP=192.168.1.100
PRINTER_PORT=9100
```

## 🎯 **Como Funciona a Impressão Individual**

### **Exemplo Prático:**
Se um pedido tem:
- 2x Coca-Cola (R$ 5,00 cada)
- 1x Hambúrguer (R$ 15,00)

### **Será impresso:**
```
Ticket 1:
═══════════════════
    ECCLESIA FOOD
   Nome do Evento
═══════════════════
Pedido: ABC123
Cliente: João Silva
Data: 14/06/2025 14:30
═══════════════════
     COCA-COLA
      R$ 5,00
   Item 1 de 2
═══════════════════
Obrigado pela preferência!
Ecclesia Food - Alimentando com amor
```

```
Ticket 2:
═══════════════════
    ECCLESIA FOOD
   Nome do Evento
═══════════════════
Pedido: ABC123
Cliente: João Silva
Data: 14/06/2025 14:30
═══════════════════
     COCA-COLA
      R$ 5,00
   Item 2 de 2
═══════════════════
Obrigado pela preferência!
Ecclesia Food - Alimentando com amor
```

```
Ticket 3:
═══════════════════
    ECCLESIA FOOD
   Nome do Evento
═══════════════════
Pedido: ABC123
Cliente: João Silva
Data: 14/06/2025 14:30
═══════════════════
    HAMBÚRGUER
     R$ 15,00
═══════════════════
Obrigado pela preferência!
Ecclesia Food - Alimentando com amor
```

## 🔧 **Configuração do Tablet**

### **Requisitos:**
- Tablet Android/iOS
- Conexão com internet
- Navegador moderno
- Impressora conectada ao mesmo dispositivo/rede

### **Setup:**
1. Abra o navegador no tablet
2. Acesse: `ecclesiafood.com.br/seu-pedido`
3. Deixe a página aberta em tela cheia
4. Configure para não entrar em modo de suspensão

### **Interface do Tablet:**
- **Campo gigante** para código do pedido
- **Teclado virtual** para fácil digitação
- **Botões grandes** otimizados para touch
- **Feedback visual** claro para o usuário

## 🚀 **Fluxo Completo**

1. **Cliente faz pedido** → Recebe código (ex: `cm7vxrakd0004uaff1sqpsc62`)
2. **Cliente vai ao tablet** → Digite o código
3. **Sistema mostra pedido** → Cliente confirma dados
4. **Cliente confirma impressão** → Sistema imprime tickets individuais
5. **Status atualizado** → Pedido fica como "FINALIZADA"

## 🛠️ **Solução de Problemas**

### **Impressora não conecta:**
- Verifique cabo USB
- Confirme IP da rede se usar TCP/IP
- Teste conectividade

### **Erro de impressão:**
- Verifique papel na impressora
- Confirme se a impressora está ligada
- Reinicie a impressora se necessário

### **Tablet não responde:**
- Atualize a página
- Verifique conexão com internet
- Reinicie o navegador

## 📱 **URLs Importantes**

- **Página do tablet**: `ecclesiafood.com.br/seu-pedido`
- **API busca pedido**: `/api/pedidos/buscar?codigo=CODIGO`
- **API impressão**: `/api/pedidos/imprimir` (POST)

## 🎉 **Benefícios do Sistema**

✅ **Organização**: Cada item é um ticket separado
✅ **Rastreabilidade**: Códigos únicos por pedido  
✅ **Eficiência**: Cliente se atende sozinho
✅ **Controle**: Status automático dos pedidos
✅ **Flexibilidade**: Funciona USB ou rede 