/*
  Warnings:

  - You are about to drop the `UserMessageStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserMessageStatus" DROP CONSTRAINT "UserMessageStatus_messageId_fkey";

-- DropForeignKey
ALTER TABLE "UserMessageStatus" DROP CONSTRAINT "UserMessageStatus_userId_fkey";

-- DropTable
DROP TABLE "UserMessageStatus";

-- CreateTable
CREATE TABLE "MessageStatus" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MessageStatus_userId_idx" ON "MessageStatus"("userId");

-- CreateIndex
CREATE INDEX "MessageStatus_messageId_idx" ON "MessageStatus"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "MessageStatus_userId_messageId_key" ON "MessageStatus"("userId", "messageId");

-- AddForeignKey
ALTER TABLE "MessageStatus" ADD CONSTRAINT "MessageStatus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageStatus" ADD CONSTRAINT "MessageStatus_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
