-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "metadata" JSONB DEFAULT '{}';
