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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  usn TEXT NOT NULL,
  email TEXT,
  interview_id UUID REFERENCES interviews(id) ON DELETE CASCADE,
  batch TEXT,
  dept TEXT,
  resume_score INTEGER,
  resume_url TEXT,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Promoted', 'Not Promoted', 'Pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_interview_id ON candidates(interview_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews(created_at);

-- Create storage buckets (run these in Supabase Storage section or via API)
-- Bucket: 'resumes' - for candidate resume files
-- Bucket: 'job-descriptions' - for job description files

-- Enable Row Level Security (RLS)
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
-- For now, allow all operations (you should restrict based on user roles)
CREATE POLICY "Allow all operations on interviews" ON interviews
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on candidates" ON candidates
  FOR ALL USING (true) WITH CHECK (true);

