-- CreateEnum
CREATE TYPE "ConciergeMessageRole" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "ConciergeConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "activePropertyId" TEXT,
    "workspace" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConciergeConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConciergeMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "ConciergeMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConciergeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConciergeConversation_userId_updatedAt_idx" ON "ConciergeConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ConciergeMessage_conversationId_createdAt_idx" ON "ConciergeMessage"("conversationId", "createdAt");

-- AddForeignKey
ALTER TABLE "ConciergeConversation" ADD CONSTRAINT "ConciergeConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConciergeMessage" ADD CONSTRAINT "ConciergeMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConciergeConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
