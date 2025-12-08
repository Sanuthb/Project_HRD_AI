export interface Interview {
  id: string;
  title: string;
  jdName: string;
  createdDate: string;
  candidateCount: number;
  status: "Active" | "Closed";
  interviewType?: string;
  duration?: number;
}

export interface Candidate {
  id: string;
  name: string;
  usn: string;
  resumeScore: number;
  status: "Promoted" | "Not Promoted";
  interviewId: string;
}

