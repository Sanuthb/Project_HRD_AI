-- Create storage buckets for Placement AI
-- Run this in Supabase SQL Editor

-- Create resumes bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes',
  'resumes',
  true,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create job-descriptions bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-descriptions',
  'job-descriptions',
  true,
  10485760, -- 10MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create policies for resumes bucket
-- Note: CREATE POLICY IF NOT EXISTS is not supported in Postgres. We drop and recreate instead.

DROP POLICY IF EXISTS "Allow public uploads to resumes" ON storage.objects;
CREATE POLICY "Allow public uploads to resumes"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Allow public reads from resumes" ON storage.objects;
CREATE POLICY "Allow public reads from resumes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'resumes');

DROP POLICY IF EXISTS "Allow public deletes from resumes" ON storage.objects;
CREATE POLICY "Allow public deletes from resumes"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'resumes');

-- Create policies for job-descriptions bucket

DROP POLICY IF EXISTS "Allow public uploads to job-descriptions" ON storage.objects;
CREATE POLICY "Allow public uploads to job-descriptions"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'job-descriptions');

DROP POLICY IF EXISTS "Allow public reads from job-descriptions" ON storage.objects;
CREATE POLICY "Allow public reads from job-descriptions"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'job-descriptions');

DROP POLICY IF EXISTS "Allow public deletes from job-descriptions" ON storage.objects;
CREATE POLICY "Allow public deletes from job-descriptions"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'job-descriptions');

-- Create proctoring_events table
CREATE TABLE IF NOT EXISTS proctoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'FACE_MISSING', 'MULTIPLE_FACES', 'COPY_PASTE', 'MIC_MUTED', 'CAM_OFF'
  details JSONB, -- Context like timestamp, duration, count
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for proctoring_events
CREATE INDEX IF NOT EXISTS idx_proctoring_events_candidate_id ON proctoring_events(candidate_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_interview_id ON proctoring_events(interview_id);

-- Alter candidates table to add risk scoring fields
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS risk_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
ADD COLUMN IF NOT EXISTS proctoring_summary JSONB DEFAULT '{}'::jsonb;

-- Enable RLS
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow all operations on proctoring_events" ON proctoring_events;
CREATE POLICY "Allow all operations on proctoring_events" ON proctoring_events
  FOR ALL USING (true) WITH CHECK (true);
