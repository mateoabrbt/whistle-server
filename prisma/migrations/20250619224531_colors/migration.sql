-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profilePrictureUrl" TEXT;

-- CreateTable
CREATE TABLE "RoomUserColor" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "RoomUserColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomUserColor_roomId_userId_key" ON "RoomUserColor"("roomId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomUserColor_roomId_color_key" ON "RoomUserColor"("roomId", "color");

-- AddForeignKey
ALTER TABLE "RoomUserColor" ADD CONSTRAINT "RoomUserColor_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomUserColor" ADD CONSTRAINT "RoomUserColor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
