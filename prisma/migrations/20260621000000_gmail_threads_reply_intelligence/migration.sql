-- CreateEnum
CREATE TYPE "EmailThreadStatus" AS ENUM ('SENT', 'OPENED', 'REPLIED', 'INTERESTED', 'NEGOTIATING', 'WON', 'LOST');

-- AlterEnum
ALTER TYPE "AgentType" ADD VALUE 'REPLY_INTELLIGENCE';

-- AlterTable
ALTER TABLE "ConnectedAccount" ADD COLUMN     "lastSyncAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EmailTrack" ADD COLUMN     "gmailMessageId" TEXT;

-- CreateTable
CREATE TABLE "EmailThread" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadId" TEXT,
    "gmailThreadId" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "contactName" TEXT,
    "subject" TEXT NOT NULL,
    "status" "EmailThreadStatus" NOT NULL DEFAULT 'SENT',
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "aiInsight" TEXT,
    "aiIntent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "gmailMessageId" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "fromName" TEXT,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "isInbound" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailThread_userId_lastMessageAt_idx" ON "EmailThread"("userId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailThread_userId_gmailThreadId_key" ON "EmailThread"("userId", "gmailThreadId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_gmailMessageId_key" ON "EmailMessage"("gmailMessageId");

-- AddForeignKey
ALTER TABLE "EmailThread" ADD CONSTRAINT "EmailThread_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

