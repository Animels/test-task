/*
  Warnings:

  - The `type` column on the `Policies` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Policies" DROP COLUMN "type",
ADD COLUMN     "type" TEXT[];
