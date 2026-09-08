-- CreateEnum
CREATE TYPE "McpResourceType" AS ENUM ('PROPERTY', 'PROFESSIONAL', 'REQUEST_ROOM', 'CALL_BOOKING');

-- CreateEnum
CREATE TYPE "McpOutcome" AS ENUM ('SUCCESS', 'DENIED', 'ERROR', 'PENDING_CONFIRMATION');

-- CreateTable
CREATE TABLE "McpAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" "Role",
    "clientId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "resourceType" "McpResourceType",
    "resourceId" TEXT,
    "inputArgs" JSONB NOT NULL,
    "authorized" BOOLEAN NOT NULL,
    "confirmed" BOOLEAN,
    "outcome" "McpOutcome" NOT NULL,
    "errorMessage" TEXT,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "McpAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "McpAuditLog_toolName_createdAt_idx" ON "McpAuditLog"("toolName", "createdAt");

-- CreateIndex
CREATE INDEX "McpAuditLog_actorUserId_idx" ON "McpAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "McpAuditLog_outcome_idx" ON "McpAuditLog"("outcome");
