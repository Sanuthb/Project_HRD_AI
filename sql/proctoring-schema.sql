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
CREATE POLICY "Allow all operations on proctoring_events" ON proctoring_events
  FOR ALL USING (true) WITH CHECK (true);
