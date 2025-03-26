-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('DOMINGO', 'SEGUNDA', 'TERCA', 'QUARTA', 'QUINTA', 'SEXTA', 'SABADO', 'FERIADO');

-- CreateTable
CREATE TABLE "MassSchedule" (
    "id" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "time" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "churchId" TEXT NOT NULL,

    CONSTRAINT "MassSchedule_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MassSchedule" ADD CONSTRAINT "MassSchedule_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE CASCADE ON UPDATE CASCADE;
