-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CUSTOMER', 'PROPERTY_OWNER', 'AGENT', 'BUSINESS', 'PROFESSIONAL', 'ADMINISTRATOR');

-- CreateEnum
CREATE TYPE "RequestRoomType" AS ENUM ('LAWYER', 'ACCOUNTANT', 'ARCHITECT_ENGINEER', 'PROPERTY_SEARCH', 'PROPERTY_SALE', 'RENOVATION', 'MOVING', 'CLEANING', 'ARRIVAL_CALL', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestRoomStatus" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'MATCHING', 'PROFESSIONAL_SELECTED', 'APPOINTMENT_PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('USER', 'AI', 'PROFESSIONAL', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('ROOM', 'APARTMENT', 'HOUSE', 'LAND', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "ListingIntent" AS ENUM ('RENT', 'SALE');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'CHANGES_REQUESTED', 'SUSPENDED', 'FLAGGED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ProfessionalCategory" AS ENUM ('LAWYER', 'ACCOUNTANT', 'ARCHITECT', 'ENGINEER', 'CLEANER', 'MOVER', 'PROPERTY_MANAGER', 'BARBER_GROOMING', 'OTHER');

-- CreateEnum
CREATE TYPE "CallType" AS ENUM ('ORIENTATION', 'RELOCATION', 'PROPERTY', 'BUSINESS', 'WORK_LIFE', 'INVESTMENT', 'CUSTOM', 'UNSURE');

-- CreateEnum
CREATE TYPE "ModeratedContentType" AS ENUM ('PROPERTY', 'PROFESSIONAL', 'JOB', 'VEHICLE', 'BUSINESS', 'OFFER', 'ARTICLE');

-- CreateEnum
CREATE TYPE "ModerationAction" AS ENUM ('APPROVE', 'REJECT', 'REQUEST_CHANGES', 'SUSPEND', 'FLAG', 'ESCALATE');

-- CreateEnum
CREATE TYPE "KnowledgeCategory" AS ENUM ('PLATFORM', 'GREECE', 'PROFESSIONALS', 'CALCULATORS', 'ARTICLES', 'OPERATIONS');

-- CreateEnum
CREATE TYPE "AiLayer" AS ENUM ('DETERMINISTIC', 'RETRIEVAL', 'LIGHT_AI', 'REASONING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "preferredLocale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLinkToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLinkToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestRoom" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "RequestRoomType" NOT NULL,
    "status" "RequestRoomStatus" NOT NULL DEFAULT 'REQUESTED',
    "structuredData" JSONB NOT NULL DEFAULT '{}',
    "professionalId" TEXT,
    "propertyId" TEXT,
    "callBookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RequestRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderType" "MessageSender" NOT NULL,
    "senderUserId" TEXT,
    "content" TEXT NOT NULL,
    "originalLocale" TEXT NOT NULL,
    "translations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestAttachment" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEvent" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestRoomId" TEXT,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "listingIntent" "ListingIntent" NOT NULL,
    "city" TEXT NOT NULL,
    "area" TEXT,
    "priceAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "bedrooms" INTEGER,
    "furnished" BOOLEAN,
    "images" TEXT[],
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Professional" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProfessionalCategory" NOT NULL,
    "languages" TEXT[],
    "bio" TEXT NOT NULL,
    "isPartnerPlatform" BOOLEAN NOT NULL DEFAULT false,
    "externalUrl" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "status" "ModerationStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Professional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL,
    "callType" "CallType",
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallBooking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "callType" "CallType" NOT NULL,
    "reason" TEXT,
    "topics" TEXT[],
    "preferredLanguage" TEXT NOT NULL,
    "countryOfOrigin" TEXT,
    "arrivalDate" TIMESTAMP(3),
    "cityOfInterest" TEXT,
    "slotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationItem" (
    "id" TEXT NOT NULL,
    "contentType" "ModeratedContentType" NOT NULL,
    "propertyId" TEXT,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "lastAction" "ModerationAction",
    "moderatorNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "ModerationItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeArticle" (
    "id" TEXT NOT NULL,
    "category" "KnowledgeCategory" NOT NULL,
    "slug" TEXT NOT NULL,
    "canonicalLocale" TEXT NOT NULL DEFAULT 'en',
    "canonicalText" TEXT NOT NULL,
    "translations" JSONB NOT NULL DEFAULT '{}',
    "sourceUrl" TEXT,
    "effectiveDate" TIMESTAMP(3),
    "lastReviewed" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 1,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "layer" "AiLayer" NOT NULL,
    "model" TEXT,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "toolCalls" JSONB,
    "costEstimateUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLinkToken_tokenHash_key" ON "MagicLinkToken"("tokenHash");

-- CreateIndex
CREATE INDEX "MagicLinkToken_userId_idx" ON "MagicLinkToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RequestRoom_callBookingId_key" ON "RequestRoom"("callBookingId");

-- CreateIndex
CREATE INDEX "RequestRoom_userId_idx" ON "RequestRoom"("userId");

-- CreateIndex
CREATE INDEX "RequestRoom_type_status_idx" ON "RequestRoom"("type", "status");

-- CreateIndex
CREATE INDEX "RequestMessage_roomId_idx" ON "RequestMessage"("roomId");

-- CreateIndex
CREATE INDEX "RequestAttachment_roomId_idx" ON "RequestAttachment"("roomId");

-- CreateIndex
CREATE INDEX "StatusEvent_roomId_idx" ON "StatusEvent"("roomId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "SavedItem_userId_itemType_itemId_key" ON "SavedItem"("userId", "itemType", "itemId");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_city_propertyType_listingIntent_idx" ON "Property"("city", "propertyType", "listingIntent");

-- CreateIndex
CREATE INDEX "Professional_category_idx" ON "Professional"("category");

-- CreateIndex
CREATE INDEX "AvailabilitySlot_startTime_isBooked_idx" ON "AvailabilitySlot"("startTime", "isBooked");

-- CreateIndex
CREATE UNIQUE INDEX "CallBooking_slotId_key" ON "CallBooking"("slotId");

-- CreateIndex
CREATE INDEX "CallBooking_userId_idx" ON "CallBooking"("userId");

-- CreateIndex
CREATE INDEX "ModerationItem_contentType_status_idx" ON "ModerationItem"("contentType", "status");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArticle_slug_key" ON "KnowledgeArticle"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeArticle_category_isApproved_idx" ON "KnowledgeArticle"("category", "isApproved");

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_layer_idx" ON "AiUsageLog"("layer");

-- AddForeignKey
ALTER TABLE "MagicLinkToken" ADD CONSTRAINT "MagicLinkToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRoom" ADD CONSTRAINT "RequestRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRoom" ADD CONSTRAINT "RequestRoom_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRoom" ADD CONSTRAINT "RequestRoom_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestRoom" ADD CONSTRAINT "RequestRoom_callBookingId_fkey" FOREIGN KEY ("callBookingId") REFERENCES "CallBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RequestRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestMessage" ADD CONSTRAINT "RequestMessage_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestAttachment" ADD CONSTRAINT "RequestAttachment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RequestRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusEvent" ADD CONSTRAINT "StatusEvent_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "RequestRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_requestRoomId_fkey" FOREIGN KEY ("requestRoomId") REFERENCES "RequestRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedItem" ADD CONSTRAINT "SavedItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallBooking" ADD CONSTRAINT "CallBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallBooking" ADD CONSTRAINT "CallBooking_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "AvailabilitySlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationItem" ADD CONSTRAINT "ModerationItem_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
