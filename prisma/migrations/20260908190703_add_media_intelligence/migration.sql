-- CreateEnum
CREATE TYPE "ListingKind" AS ENUM ('PROPERTY');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'AUDIO', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "MediaProcessingStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'ANALYZED', 'FAILED');

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "listingKind" "ListingKind",
    "propertyId" TEXT,
    "mediaKind" "MediaKind" NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "checksum" TEXT NOT NULL,
    "widthPx" INTEGER,
    "heightPx" INTEGER,
    "durationMs" INTEGER,
    "processingStatus" "MediaProcessingStatus" NOT NULL DEFAULT 'UPLOADED',
    "errorMessage" TEXT,
    "detectedCategory" TEXT,
    "detectedSubcategory" TEXT,
    "categoryConfidence" DOUBLE PRECISION,
    "extractedText" TEXT,
    "transcript" TEXT,
    "aiDescription" TEXT,
    "qualityScore" DOUBLE PRECISION,
    "blurScore" DOUBLE PRECISION,
    "orientation" TEXT,
    "perceptualHash" TEXT,
    "duplicateGroup" TEXT,
    "userConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "aiMetadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaAsset_sessionId_idx" ON "MediaAsset"("sessionId");

-- CreateIndex
CREATE INDEX "MediaAsset_userId_idx" ON "MediaAsset"("userId");

-- CreateIndex
CREATE INDEX "MediaAsset_propertyId_idx" ON "MediaAsset"("propertyId");

-- CreateIndex
CREATE INDEX "MediaAsset_checksum_idx" ON "MediaAsset"("checksum");

-- CreateIndex
CREATE INDEX "MediaAsset_duplicateGroup_idx" ON "MediaAsset"("duplicateGroup");

-- CreateIndex
CREATE INDEX "MediaAsset_processingStatus_idx" ON "MediaAsset"("processingStatus");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
