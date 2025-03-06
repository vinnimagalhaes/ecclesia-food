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

---

Para mais informações ou suporte, consulte:
- [Documentação da Vercel](https://vercel.com/docs)
- [Documentação do Next.js](https://nextjs.org/docs/deployment)
- [Documentação do Supabase](https://supabase.com/docs)
- [Documentação do Prisma](https://www.prisma.io/docs/guides/deployment) 