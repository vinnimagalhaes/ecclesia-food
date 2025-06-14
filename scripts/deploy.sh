#!/bin/bash

echo "🚀 ECCLESIA FOOD - SCRIPT DE DEPLOY"
echo "=================================="

# Verificar se estamos na pasta correta
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se o Git está configurado
if [ ! -d ".git" ]; then
    echo "❌ Erro: Este não é um repositório Git"
    echo "💡 Execute: git init && git add . && git commit -m 'Initial commit'"
    exit 1
fi

echo "✅ Verificando dependências..."
npm install

echo "✅ Gerando cliente Prisma..."
npx prisma generate

echo "✅ Verificando TypeScript..."
npm run typecheck

echo "✅ Verificando ESLint..."
npm run lint

echo "✅ Testando build..."
npm run build

echo ""
echo "🎉 PROJETO PRONTO PARA DEPLOY!"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Commit suas mudanças: git add . && git commit -m 'Ready for deploy'"
echo "2. Push para o repositório: git push origin main"
echo "3. Configure as variáveis de ambiente no Vercel (veja ENVIRONMENT_VARIABLES.md)"
echo "4. Faça o deploy na Vercel"
echo ""
echo "🔗 Links úteis:"
echo "- Vercel: https://vercel.com"
echo "- Supabase: https://supabase.com"
echo "- Neon: https://neon.tech"
echo "" 