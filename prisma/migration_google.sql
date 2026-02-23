-- Make password optional (for Google OAuth users)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- Add image column if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Add expires column to VerificationToken if missing
ALTER TABLE "VerificationToken" ADD COLUMN IF NOT EXISTS "expires" TIMESTAMP(3) NOT NULL DEFAULT NOW();
