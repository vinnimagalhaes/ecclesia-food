/*
  Warnings:

  - Added the required column `cliente` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `Sale` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome` to the `SaleItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_productId_fkey";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "cliente" TEXT NOT NULL,
ADD COLUMN     "dataFinalizacao" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "formaPagamento" TEXT,
ADD COLUMN     "origem" TEXT,
ADD COLUMN     "telefone" TEXT,
ADD COLUMN     "tipo" TEXT NOT NULL,
ALTER COLUMN "eventId" DROP NOT NULL,
ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN     "nome" TEXT NOT NULL,
ALTER COLUMN "total" DROP NOT NULL,
ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
