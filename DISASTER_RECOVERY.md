# Plano de Recuperação de Desastres - Ecclesia Food

Este documento detalha os procedimentos para backup, recuperação e continuidade do serviço em caso de falhas ou desastres.

## Estratégia de Backup

### Backup Automático do Banco de Dados

- **Periodicidade**: Diária (configurada para rodar às 3:00 AM)
- **Retenção**: Os últimos 7 backups são mantidos localmente
- **Armazenamento**:
  - Local: Diretório `/backups` na raiz do projeto
  - Externo: Backups devem ser sincronizados com um serviço de armazenamento externo

### Como Executar um Backup Manual

1. Certifique-se de que as variáveis de ambiente estão configuradas corretamente
2. Execute o comando:
   ```
   npm run backup
   ```
3. O backup será criado no diretório `/backups` com o timestamp atual

## Procedimento de Restauração

### Restauração do Banco de Dados

1. Identifique o arquivo de backup a ser restaurado:
   ```
   ls -la backups/
   ```

2. Execute o script de restauração:
   ```
   npm run restore backups/backup-2023-01-01T03-00-00-000Z.sql
   ```

3. Digite "CONFIRMAR" quando solicitado

4. Verifique se a restauração foi bem-sucedida:
   ```
   node scripts/diagnostico.mjs
   ```

### Recuperação Completa do Aplicativo

Em caso de falha completa do servidor, siga estas etapas para restaurar o aplicativo:

1. Clone o repositório:
   ```
   git clone https://github.com/vinnimagalhaes/ecclesia-food.git
   cd ecclesia-food
   ```

2. Instale dependências:
   ```
   npm install
   ```

3. Configure variáveis de ambiente:
   ```
   cp .env.example .env
   # Edite o arquivo .env com as configurações corretas
   ```

4. Restaure o banco de dados (conforme seção anterior)

5. Inicie o aplicativo:
   ```
   npm run build
   npm start
   ```

## Monitoramento e Prevenção

### Verificações de Integridade

Execute regularmente o diagnóstico para verificar a integridade do sistema:

```
node scripts/diagnostico.mjs
```

### Logs e Alertas

- Os logs do aplicativo devem ser monitorados para detectar erros recorrentes
- Considere implementar um sistema de alerta para notificar a equipe sobre problemas críticos

## Contatos de Emergência

- **Desenvolvedor Principal**: [Seu Nome] - [Seu Email]
- **Administrador do Banco de Dados**: [Nome] - [Email]
- **Suporte ao Cliente**: [Email de Suporte]

## Procedimentos de Escalonamento

1. **Nível 1**: Problemas de funcionalidade não críticos - Resolver em até 24 horas
2. **Nível 2**: Serviço parcialmente indisponível - Resolver em até 6 horas
3. **Nível 3**: Serviço completamente indisponível - Resolver imediatamente

## Testes de Recuperação

Teste o processo de recuperação pelo menos uma vez a cada 3 meses para garantir que:

1. Os backups estão sendo criados corretamente
2. O processo de restauração funciona conforme esperado
3. A equipe está familiarizada com os procedimentos de recuperação

## Atualizações do Plano

Este documento deve ser revisado e atualizado a cada 6 meses ou após mudanças significativas na infraestrutura. 