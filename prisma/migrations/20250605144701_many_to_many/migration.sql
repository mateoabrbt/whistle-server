/*
  Warnings:

  - You are about to drop the column `roomId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roomId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "roomId";

-- CreateTable
CREATE TABLE "_RoomUsers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RoomUsers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RoomUsers_B_index" ON "_RoomUsers"("B");

-- AddForeignKey
ALTER TABLE "_RoomUsers" ADD CONSTRAINT "_RoomUsers_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomUsers" ADD CONSTRAINT "_RoomUsers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
