-- Fix duplicate candidates and enforce unique constraint per interview
-- This script is idempotent and safe to run multiple times

-- 1. Remove duplicate candidate records for the same (usn, interview_id)
-- We keep the most recently created record
DELETE FROM candidates c1
USING candidates c2
WHERE c1.id < c2.id 
  AND c1.usn = c2.usn 
  AND c1.interview_id = c2.interview_id;

-- 2. Drop existing UNIQUE constraints (old and new) to ensure a clean slate
DO $$ 
BEGIN
    -- Drop old single-column constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'candidates_usn_key') THEN
        ALTER TABLE candidates DROP CONSTRAINT candidates_usn_key;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'candidates_email_key') THEN
        ALTER TABLE candidates DROP CONSTRAINT candidates_email_key;
    END IF;

    -- Drop the composite constraints if they already exist (to allow re-running)
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'candidates_usn_interview_id_key') THEN
        ALTER TABLE candidates DROP CONSTRAINT candidates_usn_interview_id_key;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'candidates_email_interview_id_key') THEN
        ALTER TABLE candidates DROP CONSTRAINT candidates_email_interview_id_key;
    END IF;
END $$;

-- 3. Add composite unique constraint for (usn, interview_id)
-- This ensures a candidate is unique within AN interview, but can exist in OTHER interviews.
ALTER TABLE candidates ADD CONSTRAINT candidates_usn_interview_id_key UNIQUE (usn, interview_id);

-- 4. Ensure email is also unique per interview if provided
ALTER TABLE candidates ADD CONSTRAINT candidates_email_interview_id_key UNIQUE (email, interview_id);
