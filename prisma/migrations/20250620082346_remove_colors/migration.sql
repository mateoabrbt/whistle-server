/*
  Warnings:

  - You are about to drop the column `profilePrictureUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `RoomUserColor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoomUserColor" DROP CONSTRAINT "RoomUserColor_roomId_fkey";

-- DropForeignKey
ALTER TABLE "RoomUserColor" DROP CONSTRAINT "RoomUserColor_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profilePrictureUrl",
ADD COLUMN     "profilePictureUrl" TEXT;

-- DropTable
DROP TABLE "RoomUserColor";
