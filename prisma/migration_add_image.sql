-- Migration: Add image column to User table
-- Run this ONCE on your production PostgreSQL database via Dokploy terminal

-- 1. Make password optional (for Google OAuth users)
ALTER TABLE "User" ALTER COLUMN "password" DROP NOT NULL;

-- 2. Add image column for avatars
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "image" TEXT;

-- Verify
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'User' 
ORDER BY ordinal_position;
