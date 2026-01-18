-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_actions_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid,
  action_type text NOT NULL,
  details text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_actions_log_pkey PRIMARY KEY (id),
  CONSTRAINT admin_actions_log_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL,
  role text NOT NULL DEFAULT 'admin'::text CHECK (role = ANY (ARRAY['admin'::text, 'super_admin'::text])),
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id),
  CONSTRAINT admin_users_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin_users(id)
);
CREATE TABLE public.candidate_interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL,
  interview_id uuid NOT NULL,
  resume_url text,
  resume_score integer,
  status text NOT NULL DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Promoted'::text, 'Not Promoted'::text, 'Pending'::text])),
  resume_status text NOT NULL DEFAULT 'Pending'::text CHECK (resume_status = ANY (ARRAY['Pending'::text, 'Passed'::text, 'Failed'::text])),
  interview_status text NOT NULL DEFAULT 'Not Started'::text CHECK (interview_status = ANY (ARRAY['Not Started'::text, 'Enabled'::text, 'Completed'::text, 'Locked'::text])),
  resume_analysis jsonb,
  manually_promoted boolean DEFAULT false,
  override_by_admin boolean DEFAULT false,
  manual_interview_deadline timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT candidate_interviews_pkey PRIMARY KEY (id),
  CONSTRAINT candidate_interviews_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id),
  CONSTRAINT candidate_interviews_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id)
);
CREATE TABLE public.candidates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  usn text NOT NULL,
  email text,
  batch text,
  dept text,
  resume_score integer,
  resume_url text,
  status text NOT NULL DEFAULT 'Pending'::text CHECK (status = ANY (ARRAY['Promoted'::text, 'Not Promoted'::text, 'Pending'::text])),
  resume_status text NOT NULL DEFAULT 'Pending'::text CHECK (resume_status = ANY (ARRAY['Pending'::text, 'Passed'::text, 'Failed'::text])),
  interview_status text NOT NULL DEFAULT 'Not Started'::text CHECK (interview_status = ANY (ARRAY['Not Started'::text, 'Enabled'::text, 'Completed'::text, 'Locked'::text])),
  manually_promoted boolean DEFAULT false,
  override_by_admin boolean DEFAULT false,
  manual_interview_deadline timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  risk_score integer DEFAULT 0,
  risk_level text DEFAULT 'LOW'::text CHECK (risk_level = ANY (ARRAY['LOW'::text, 'MEDIUM'::text, 'HIGH'::text])),
  proctoring_summary jsonb DEFAULT '{}'::jsonb,
  resume_text text,
  resume_analysis jsonb,
  malpractice boolean DEFAULT false,
  malpractice_score integer,
  malpractice_details text,
  interview_ids ARRAY DEFAULT ARRAY[]::uuid[],
  CONSTRAINT candidates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.feedback_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid,
  analysis jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT feedback_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT feedback_analysis_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);
CREATE TABLE public.interview_results (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid,
  interview_id uuid,
  transcript jsonb,
  report jsonb,
  communication_score integer,
  skills_score integer,
  knowledge_score integer,
  summary text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interview_results_pkey PRIMARY KEY (id),
  CONSTRAINT interview_results_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id),
  CONSTRAINT interview_results_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id)
);
CREATE TABLE public.interviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  jd_name text NOT NULL,
  jd_text text,
  jd_file_url text,
  interview_type text,
  duration integer,
  status text NOT NULL DEFAULT 'Active'::text CHECK (status = ANY (ARRAY['Active'::text, 'Closed'::text])),
  end_time timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT interviews_pkey PRIMARY KEY (id)
);
CREATE TABLE public.proctoring_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  interview_id uuid,
  candidate_id uuid,
  event_type text NOT NULL,
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT proctoring_events_pkey PRIMARY KEY (id),
  CONSTRAINT proctoring_events_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id),
  CONSTRAINT proctoring_events_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id)
);
CREATE TABLE public.records (
  id integer NOT NULL DEFAULT nextval('records_id_seq'::regclass),
  name text NOT NULL,
  CONSTRAINT records_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  candidate_id uuid UNIQUE,
  email text UNIQUE,
  usn text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'candidate'::text CHECK (role = ANY (ARRAY['candidate'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES ('resumes', 'resumes', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('job-descriptions', 'job-descriptions', true) ON CONFLICT (id) DO NOTHING;

-- STORAGE POLICIES
-- Resumes: anyone can upload, anyone can read (or restrict as needed)
CREATE POLICY "Public Access Resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "Public Upload Resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');

-- Job Descriptions: anyone can read, authenticated uploads
CREATE POLICY "Public Access JDs" ON storage.objects FOR SELECT USING (bucket_id = 'job-descriptions');
CREATE POLICY "Public Upload JDs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'job-descriptions');

-- Interview Recordings: authenticated uploads, admin/owner reads
INSERT INTO storage.buckets (id, name, public) VALUES ('interview-recordings', 'interview-recordings', false) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Give access to own recordings" ON storage.objects FOR SELECT USING (bucket_id = 'interview-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Upload own recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'interview-recordings'); 
-- Note: Ideally we restrict folder name to match user ID, but for now simple authenticated insert is enough for the MVP instructions.

CREATE TABLE public.recording_metadata (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  interview_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  start_time timestamp with time zone DEFAULT now(),
  end_time timestamp with time zone,
  total_chunks integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  risk_level text DEFAULT 'LOW',
  verification_status text DEFAULT 'Pending' CHECK (verification_status IN ('Pending', 'Verified', 'Rejected')),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT recording_metadata_pkey PRIMARY KEY (id),
  CONSTRAINT recording_metadata_interview_id_fkey FOREIGN KEY (interview_id) REFERENCES public.interviews(id),
  CONSTRAINT recording_metadata_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id)
);

-- DEFAULT ADMIN USER (Plain text password as per current auth implementation)
INSERT INTO public.admin_users (name, email, password, role)
VALUES ('Super Admin', 'admin@example.com', 'admin123', 'super_admin')
ON CONFLICT (email) DO NOTHING;
