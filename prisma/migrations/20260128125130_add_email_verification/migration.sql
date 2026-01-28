-- AlterTable
ALTER TABLE "users" ADD COLUMN "emailVerified" DATETIME;
ALTER TABLE "users" ADD COLUMN "verificationToken" TEXT;
