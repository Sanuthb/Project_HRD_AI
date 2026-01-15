-- Add email column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create an index for email search
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
