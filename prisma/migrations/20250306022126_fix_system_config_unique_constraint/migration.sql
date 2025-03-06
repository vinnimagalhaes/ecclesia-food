/*
  Warnings:

  - A unique constraint covering the columns `[userId,key]` on the table `SystemConfig` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SystemConfig_key_key";

-- AlterTable
ALTER TABLE "SystemConfig" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SystemConfig_userId_key_key" ON "SystemConfig"("userId", "key");

-- AddForeignKey
ALTER TABLE "SystemConfig" ADD CONSTRAINT "SystemConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
