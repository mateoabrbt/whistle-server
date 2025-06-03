/*
  Warnings:

  - Added the required column `expiresAt` to the `RevokedToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RevokedToken" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
