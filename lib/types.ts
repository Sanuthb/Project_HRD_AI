export interface Interview {
  id: string;
  title: string;
  jd_name: string;
  jd_text?: string;
  jd_file_url?: string;
  created_at: string;
  status: "Active" | "Closed";
  interview_type?: string;
  duration?: number;
  candidate_count?: number;
}

export interface Candidate {
  id: string;
  name: string;
  usn: string;
  email?: string;
  resume_score?: number;
  resume_url?: string;
  status: "Promoted" | "Not Promoted" | "Pending";
  interview_id: string;
  created_at?: string;
}

export interface JobDescription {
  id?: string;
  interview_id: string;
  text?: string;
  file_url?: string;
  created_at?: string;
}

