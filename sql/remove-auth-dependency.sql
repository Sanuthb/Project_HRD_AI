-- Remove foreign key constraint from user_profiles to auth.users
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

-- Ensure email column exists (if not already added)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Remove the primary key constraint if it exists (since it might rely on the FK)
-- Actually, we just need to drop the FK. The PK can stay on ID.

-- Make sure ID has a default value if not provided
ALTER TABLE user_profiles
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add index for email
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
