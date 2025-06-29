-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "ownerId" TEXT;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
