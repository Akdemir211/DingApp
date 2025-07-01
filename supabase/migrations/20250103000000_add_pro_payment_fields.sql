-- Add pro membership payment fields to users table
BEGIN;

-- Add pro package and started date fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS pro_package text,
ADD COLUMN IF NOT EXISTS pro_started_at timestamptz;

-- Create index for pro users for faster queries
CREATE INDEX IF NOT EXISTS idx_users_is_pro ON users(is_pro) WHERE is_pro = true;

COMMIT; 