/*
  Warnings:

  - You are about to alter the column `desc_embedding` on the `upload` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - You are about to alter the column `image_embedding` on the `upload` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "upload" ALTER COLUMN "desc_embedding" SET DATA TYPE DECIMAL(65,30)[],
ALTER COLUMN "image_embedding" SET DATA TYPE DECIMAL(65,30)[];
