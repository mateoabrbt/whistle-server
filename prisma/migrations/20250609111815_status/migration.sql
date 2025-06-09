/*
  Warnings:

  - You are about to drop the column `readAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `receivedAt` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "readAt",
DROP COLUMN "receivedAt";

-- CreateTable
CREATE TABLE "UserMessageStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserMessageStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserMessageStatus_userId_idx" ON "UserMessageStatus"("userId");

-- CreateIndex
CREATE INDEX "UserMessageStatus_messageId_idx" ON "UserMessageStatus"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMessageStatus_userId_messageId_key" ON "UserMessageStatus"("userId", "messageId");

-- AddForeignKey
ALTER TABLE "UserMessageStatus" ADD CONSTRAINT "UserMessageStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMessageStatus" ADD CONSTRAINT "UserMessageStatus_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
