# Guia de Deploy - Ecclesia Food

Este guia mostra como fazer o deploy do projeto Ecclesia Food na Vercel, uma plataforma especializada em hospedar aplicações Next.js.

## Pré-requisitos

1. Uma conta na [Vercel](https://vercel.com)
2. Uma conta no [GitHub](https://github.com) (ou GitLab/BitBucket)
3. Seu projeto enviado para um repositório Git

## Configuração do Banco de Dados

Para o ambiente de produção, recomendamos usar o serviço Supabase para o banco de dados PostgreSQL, pois é fácil de configurar e oferece um plano gratuito.

1. Crie uma conta no [Supabase](https://supabase.com)
2. Crie um novo projeto
3. Obtenha a string de conexão PostgreSQL em: Configurações do Projeto > Database > Connection string > URI
4. Guarde esta string para usar nas variáveis de ambiente

## Configuração do GitHub Actions

O projeto está configurado para usar GitHub Actions para automatizar o processo de build, teste e deploy. Para configurar corretamente, siga os passos abaixo:

### 1. Configurar Segredos no GitHub

Acesse as configurações do repositório no GitHub e adicione os seguintes segredos:

1. `DATABASE_URL`: URL de conexão com o banco de dados PostgreSQL
2. `VERCEL_TOKEN`: Token de API da Vercel (obtenha em https://vercel.com/account/tokens)
3. `VERCEL_ORG_ID`: ID da organização na Vercel
4. `VERCEL_PROJECT_ID`: ID do projeto na Vercel

Para obter os IDs da Vercel, execute:
```bash
vercel link
```

### 2. Configurar Variáveis de Ambiente na Vercel

Acesse o painel da Vercel e configure as seguintes variáveis de ambiente:

1. `DATABASE_URL`: URL de conexão com o banco de dados PostgreSQL
2. `NEXTAUTH_SECRET`: Segredo para NextAuth
3. `NEXTAUTH_URL`: URL completa do aplicativo (ex: https://ecclesia-food.vercel.app)
4. `CLOUDINARY_CLOUD_NAME`: Nome da cloud no Cloudinary
5. `CLOUDINARY_API_KEY`: Chave de API do Cloudinary
6. `CLOUDINARY_API_SECRET`: Segredo da API do Cloudinary

### 3. Configurar Domínio Personalizado (opcional)

1. Acesse as configurações do projeto na Vercel
2. Vá para a seção "Domains"
3. Adicione seu domínio personalizado
4. Siga as instruções para configurar os registros DNS

## Passo a Passo para Deploy na Vercel

1. **Preparar o repositório**
   
   - Certifique-se de que seu projeto está em um repositório Git (GitHub, GitLab ou BitBucket)
   - Verifique se o arquivo `.gitignore` inclui:
     ```
     node_modules
     .env
     .env.local
     ```

2. **Criar um projeto na Vercel**
   
   - Acesse [vercel.com](https://vercel.com) e faça login
   - Clique em "Add New" > "Project"
   - Importe seu repositório Git
   - Configure o projeto:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: próxima build
     - Output Directory: .next

3. **Configurar variáveis de ambiente**
   
   Na tela de configuração do projeto, adicione as seguintes variáveis de ambiente:

   ```
   DATABASE_URL=sua_string_de_conexao_do_supabase
   NEXTAUTH_URL=https://seu-dominio-na-vercel.vercel.app
   NEXTAUTH_SECRET=um_segredo_muito_seguro
   ```

   Substitua os valores pelos seus dados específicos.

4. **Deploy**
   
   - Clique em "Deploy"
   - A Vercel construirá e implantará automaticamente seu projeto
   - Ao concluir, você receberá uma URL para acessar seu aplicativo

## Configuração Pós-Deploy

1. **Atualizar NEXTAUTH_URL**
   
   Se você tiver um domínio personalizado:
   
   - Vá para as configurações do projeto na Vercel
   - Atualize a variável `NEXTAUTH_URL` para seu domínio personalizado
   - Redeploy o projeto

2. **Migrações do Banco de Dados**
   
   Para aplicar suas migrações do Prisma no banco de dados de produção:

   ```bash
   npx prisma migrate deploy
   ```

## Monitoramento e Logs

- A Vercel fornece uma interface para visualizar logs de execução
- Você pode acessar em: Seu Projeto > Deployments > Selecione o deployment > Logs

## Solução de Problemas

1. **Erro de Conexão com o Banco de Dados**
   
   - Verifique se a string de conexão está correta
   - Certifique-se de que o IP do Vercel tenha permissão para acessar seu banco de dados

2. **Erro de Autenticação**
   
   - Verifique se `NEXTAUTH_URL` está configurado corretamente
   - Verifique se `NEXTAUTH_SECRET` está definido

3. **Erro nas Migrações**
   
   - Execute `npx prisma migrate reset` em ambiente de desenvolvimento
   - Atualize o esquema no Supabase manualmente

## Processo de Deploy

### Deploy Automático

O deploy é automatizado através do GitHub Actions. Sempre que um push é feito para a branch `main`, o workflow é acionado:

1. Executa testes e linting
2. Faz o build da aplicação
3. Executa migrações do banco de dados
4. Faz o deploy para a Vercel

### Deploy Manual

Se precisar fazer um deploy manual:

1. Instale a CLI da Vercel:
   ```
   npm install -g vercel
   ```

2. Faça login:
   ```
   vercel login
   ```

3. Execute o deploy:
   ```
   vercel --prod
   ```

## Monitoramento

Após o deploy, monitore:

1. Logs da aplicação na Vercel
2. Métricas de desempenho
3. Alertas de erros

## Rollback

Em caso de problemas após o deploy:

1. Acesse o painel da Vercel
2. Vá para a seção "Deployments"
3. Encontre o último deploy estável
4. Clique em "..." e selecione "Promote to Production"

---

Para mais informações ou suporte, consulte:
- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Next.js](https://nextjs.org/docs/deployment)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Prisma](https://www.prisma.io/docs/guides/deployment) 