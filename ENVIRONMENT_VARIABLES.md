# Variáveis de Ambiente - Ecclesia Food

## 🔧 Variáveis Obrigatórias

### Database
```
DATABASE_URL="postgresql://username:password@host:5432/database_name"
```
- **Descrição**: String de conexão com o banco PostgreSQL
- **Exemplo Supabase**: `postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres`
- **Exemplo Neon**: `postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require`

### NextAuth.js
```
NEXTAUTH_URL="https://seu-dominio.vercel.app"
NEXTAUTH_SECRET="sua-chave-super-secreta-aqui"
```
- **NEXTAUTH_URL**: URL completa da sua aplicação
- **NEXTAUTH_SECRET**: Chave secreta para criptografia (gere uma segura!)

## 🔧 Variáveis Opcionais

### Cloudinary (Upload de Imagens)
```
CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"
```

### Pagar.me (Pagamentos PIX)
```
PAGARME_API_KEY="sua-chave-da-pagarme"
```

### Resend (Envio de Emails)
```
RESEND_API_KEY="sua-chave-do-resend"
```

### Impressora Térmica (Ambiente Local)
```
PRINTER_IP="192.168.1.100"
PRINTER_NAME="Printer_POS_80"
```

## 🚀 Configuração no Vercel

1. Acesse seu projeto na Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione cada variável:
   - **Name**: Nome da variável (ex: `DATABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Production, Preview, Development

## 🔐 Gerando NEXTAUTH_SECRET

Execute no terminal:
```bash
openssl rand -base64 32
```

Ou use um gerador online seguro.

## 📊 Banco de Dados Recomendados

### Supabase (Gratuito)
1. Crie conta em [supabase.com](https://supabase.com)
2. Crie novo projeto
3. Vá em Settings > Database
4. Copie a Connection String

### Neon (Gratuito)
1. Crie conta em [neon.tech](https://neon.tech)
2. Crie novo projeto
3. Copie a Connection String

### Railway (Pago)
1. Crie conta em [railway.app](https://railway.app)
2. Adicione PostgreSQL
3. Copie a Connection String

## ⚠️ Importante

- **NUNCA** commite arquivos `.env` no Git
- Use valores diferentes para desenvolvimento e produção
- Mantenha as chaves secretas seguras
- Teste todas as variáveis antes do deploy final 