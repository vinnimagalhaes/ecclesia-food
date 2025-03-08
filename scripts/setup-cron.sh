#!/bin/bash
# Script para configurar cron job para backup automático

# Obtém o caminho absoluto para o diretório do projeto
PROJECT_DIR=$(pwd)

# Cria um arquivo temporário para o crontab
TEMP_CRON=$(mktemp)

# Exporta crontab atual
crontab -l > $TEMP_CRON 2>/dev/null || echo "# Ecclesia Food Cron Jobs" > $TEMP_CRON

# Verifica se o job já existe
if ! grep -q "backup-database.mjs" $TEMP_CRON; then
  # Adiciona o job de backup às 3 AM
  echo "0 3 * * * cd $PROJECT_DIR && /usr/bin/env node $PROJECT_DIR/scripts/backup-database.mjs >> $PROJECT_DIR/backups/backup.log 2>&1" >> $TEMP_CRON
  echo "# Backup automatizado configurado às 3:00 AM"
  
  # Instala o novo crontab
  crontab $TEMP_CRON
  echo "✅ Cron job configurado com sucesso!"
else
  echo "⚠️ O cron job já está configurado."
fi

# Remove o arquivo temporário
rm $TEMP_CRON

echo ""
echo "Para verificar os cron jobs configurados, execute:"
echo "crontab -l" 