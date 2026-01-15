-- Consolidated Idempotent Schema Script
-- This script is safe to run multiple times. It checks if objects exist before creating them.

-- 1. Create Tables

-- Create interviews table
CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  jd_name TEXT NOT NULL,
  jd_text TEXT,
  jd_file_url TEXT,
  interview_type TEXT,
  duration INTEGER,
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed')),
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  interview_id UUID,
  usn TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  batch TEXT,
  dept TEXT,
  resume_score INTEGER,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Promoted', 'Not Promoted', 'Pending')),
  resume_status TEXT NOT NULL DEFAULT 'Pending' CHECK (resume_status IN ('Pending', 'Passed', 'Failed')),
  interview_status TEXT NOT NULL DEFAULT 'Not Started' CHECK (interview_status IN ('Not Started', 'Enabled', 'Completed', 'Locked')),
  manually_promoted BOOLEAN DEFAULT FALSE,
  override_by_admin BOOLEAN DEFAULT FALSE,
  manual_interview_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT candidates_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES interviews(id)
);

-- Create user_profiles table (UPDATED: Decoupled from auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- Changed default to gen_random_uuid to not rely on auth.users
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  usn TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'candidate' CHECK (role IN ('candidate', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(candidate_id),
  UNIQUE(usn)
);

-- Create interview_results table
CREATE TABLE IF NOT EXISTS interview_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id),
  interview_id UUID REFERENCES public.interviews(id),
  transcript JSONB,
  report JSONB,
  communication_score INTEGER,
  skills_score INTEGER,
  knowledge_score INTEGER,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create proctoring_events table
CREATE TABLE IF NOT EXISTS proctoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES public.interviews(id),
  candidate_id UUID REFERENCES public.candidates(id),
  event_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_actions_log table
CREATE TABLE IF NOT EXISTS admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES public.candidates(id),
  action_type TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create records table
CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- 2. Migrations for existing tables (in case tables already existed with old schema)

-- Remove foreign key constraint from user_profiles to auth.users if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'user_profiles_id_fkey') THEN
    ALTER TABLE user_profiles DROP CONSTRAINT user_profiles_id_fkey;
  END IF;
END $$;

-- Ensure email column exists in user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
-- Ensure id has default random UUID
ALTER TABLE user_profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();


-- 3. Indexes (IF NOT EXISTS)

CREATE INDEX IF NOT EXISTS idx_candidates_usn ON candidates(usn);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_batch ON candidates(batch);
CREATE INDEX IF NOT EXISTS idx_candidates_dept ON candidates(dept);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_candidate_id ON user_profiles(candidate_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_usn ON user_profiles(usn);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interview_results_candidate_id ON interview_results(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_results_interview_id ON interview_results(interview_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_interview_id ON proctoring_events(interview_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_candidate_id ON proctoring_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_event_type ON proctoring_events(event_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_candidate_id ON admin_actions_log(candidate_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_log_action_type ON admin_actions_log(action_type);

-- 4. Triggers and Functions

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to create candidate when user_profile is created
-- UPDATED: Removed dependency on auth.users for getting name/email
CREATE OR REPLACE FUNCTION create_candidate_for_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if candidate with this USN already exists
    IF NOT EXISTS (SELECT 1 FROM candidates WHERE usn = NEW.usn) THEN
        -- Create a new candidate record
        -- Since we detached from Auth, we might not have name available in user_profiles if it wasn't there.
        -- But assuming the backend provides it or we default it.
        -- For now, we'll use 'Unknown' if we can't find it, or rely on what's passed.
        -- Wait, user_profiles doesn't have 'name'. 
        -- If we are creating from backend, we create candidate FIRST usually in the new logic.
        -- But if this trigger runs, it tries to create candidate.
        
        INSERT INTO candidates (usn, name, email, batch, dept, status, resume_status, interview_status)
        VALUES (
            NEW.usn,
            'Student ' || NEW.usn, -- Fallback name since user_profiles doesn't store name
            NEW.email,
            NULL,
            NULL,
            'Pending',
            'Pending',
            'Not Started'
        );
        
        -- Update the candidate_id in the user_profile
        NEW.candidate_id = (SELECT id FROM candidates WHERE usn = NEW.usn);
    ELSE
        -- Link to existing candidate
        NEW.candidate_id = (SELECT id FROM candidates WHERE usn = NEW.usn);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers (Drop first to avoid errors)
DROP TRIGGER IF EXISTS update_candidates_updated_at ON candidates;
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at BEFORE UPDATE ON interviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_results_updated_at ON interview_results;
CREATE TRIGGER update_interview_results_updated_at BEFORE UPDATE ON interview_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS create_candidate_trigger ON user_profiles;
CREATE TRIGGER create_candidate_trigger
    BEFORE INSERT ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION create_candidate_for_user_profile();
