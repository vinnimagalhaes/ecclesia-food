-- AddMetadataToSales
-- Migration para adicionar o campo metadata (JSON) à tabela Sale

-- Alterando a tabela Sale para adicionar o campo metadata do tipo JSON com valor padrão '{}'
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "metadata" JSONB DEFAULT '{}' NOT NULL; 