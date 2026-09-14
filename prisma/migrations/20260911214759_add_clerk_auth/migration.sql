-- DropForeignKey
ALTER TABLE "MagicLinkToken" DROP CONSTRAINT "MagicLinkToken_userId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "clerkUserId" TEXT;

-- DropTable
DROP TABLE "MagicLinkToken";

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");
