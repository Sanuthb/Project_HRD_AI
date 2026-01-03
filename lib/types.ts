export interface Interview {
  id: string;
  title: string;
  jd_name: string;
  jd_text?: string;
  jd_file_url?: string;
  created_at: string;
  status: "Active" | "Closed";
  end_time?: string;
  interview_type?: string;
  duration?: number;
  candidate_count?: number;
}

export type ResumeStatus = "Pending" | "Passed" | "Failed";
export type InterviewStatus = "Not Started" | "Enabled" | "Completed" | "Locked";

export interface Candidate {
  id: string;
  name: string;
  usn: string;
  email?: string;
  batch?: string;
  dept?: string;
  resume_score?: number;
  resume_url?: string;
  resume_text?: string | null;
  resume_analysis?: any;
  status: "Promoted" | "Not Promoted" | "Pending";
  // New Enhanced Fields
  resume_status: ResumeStatus;
  interview_status: InterviewStatus;
  manually_promoted: boolean;
  override_by_admin: boolean;
  manual_interview_deadline?: string;
  malpractice?: boolean;
  
  interview_id?: string;
  created_at?: string;
}

export interface AdminActionLog {
  id: string;
  candidate_id: string;
  action_type: string;
  details?: string;
  created_at: string;
}

export interface JobDescription {
  id?: string;
  interview_id: string;
  text?: string;
  file_url?: string;
  created_at?: string;
}

