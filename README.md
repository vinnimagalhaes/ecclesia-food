# Ecclesia Food

Sistema de gestão de eventos para igrejas e comunidades religiosas, desenvolvido com Next.js.

## Funcionalidades

- 📅 **Gestão de Eventos**: Crie e gerencie eventos da igreja
- 🎫 **Controle de Participantes**: Monitore inscrições e presença
- 🏷️ **Rifas e Sorteios**: Organize rifas beneficentes
- 💵 **Gestão de Vendas**: Controle a venda de alimentos e produtos
- 📊 **Relatórios**: Visualize estatísticas e dados importantes

## Requisitos

- Node.js 16+
- PostgreSQL
- NPM ou Yarn

## Configuração Inicial

1. Clone o repositório
2. Instale as dependências
   ```bash
   npm install
   ```
3. Configure as variáveis de ambiente criando um arquivo `.env` com:
   ```
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/ecclesia_food"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=sua_chave_secreta_aqui
   ```
4. Configure o banco de dados
   ```bash
   npx prisma migrate dev
   ```
5. Inicie o servidor de desenvolvimento
   ```bash
   npm run dev
   ```
6. Acesse [http://localhost:3000](http://localhost:3000) no navegador

## Scripts Úteis

### Diagnóstico do Ambiente

Execute o script de diagnóstico para verificar se o ambiente está configurado corretamente:

```bash
node scripts/diagnostico.mjs
```

Este script verifica:
- Versões do Node.js e NPM
- Variáveis de ambiente
- Conexão com o banco de dados
- Arquivos de configuração

### Preparação para Deploy

Para preparar o aplicativo para deploy em produção:

```bash
node scripts/pre-deploy.mjs
```

Este script:
- Verifica e instala dependências
- Configura as variáveis de ambiente necessárias
- Gera o Prisma Client
- Executa o build para verificar erros
- Cria arquivos de configuração para a Vercel
- Auxilia na configuração do Git

## Deploy

Para instruções detalhadas de como fazer o deploy deste projeto, consulte o arquivo [DEPLOY.md](./DEPLOY.md).

## Solução de Problemas

### Erros de Autenticação

Se você enfrentar problemas com login/autenticação:
- Verifique se o `NEXTAUTH_SECRET` está configurado corretamente
- Verifique se o `NEXTAUTH_URL` está correto para seu ambiente
- Execute `npm run dev -- --clear` para limpar o cache do Next.js

### Erros de Banco de Dados

Se encontrar erros relacionados ao banco de dados:
- Verifique se a URL do banco de dados está correta no arquivo `.env`
- Certifique-se de que o banco de dados está em execução
- Execute `npx prisma db push` para sincronizar o esquema

## Contribuição

Contribuições são bem-vindas! Por favor, leia as diretrizes de contribuição antes de enviar uma pull request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
