/*
  Warnings:

  - The `userId` column on the `Download` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - Changed the type of `userId` on the `Upload` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "Download" DROP CONSTRAINT "Download_userId_fkey";

-- DropForeignKey
ALTER TABLE "Upload" DROP CONSTRAINT "Upload_userId_fkey";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Download" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID;

-- AlterTable
ALTER TABLE "Upload" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "role",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(6),
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "Upload" ADD CONSTRAINT "Upload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Download" ADD CONSTRAINT "Download_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
