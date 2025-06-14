/*
  Warnings:

  - You are about to drop the column `receivedAt` on the `MessageStatus` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MessageStatus" DROP COLUMN "receivedAt",
ADD COLUMN     "deliveredAt" TIMESTAMP(3);
