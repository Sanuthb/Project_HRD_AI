import { supabase } from '@/lib/supabase/client';
import { Candidate } from '@/lib/types';

export async function createCandidate(data: {
  name: string;
  usn: string;
  email?: string;
  interview_id: string;
  status?: "Promoted" | "Not Promoted" | "Pending";
}) {
  const { data: candidate, error } = await supabase
    .from('candidates')
    .insert([{
      name: data.name,
      usn: data.usn,
      email: data.email,
      interview_id: data.interview_id,
      status: data.status || 'Pending',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating candidate:', error);
    throw error;
  }

  return candidate;
}

export async function createCandidatesBulk(
  candidates: Array<{
    name: string;
    usn: string;
    email?: string;
    interview_id: string;
  }>
) {
  const { data, error } = await supabase
    .from('candidates')
    .insert(
      candidates.map(c => ({
        name: c.name,
        usn: c.usn,
        email: c.email,
        interview_id: c.interview_id,
        status: 'Pending',
      }))
    )
    .select();

  if (error) {
    console.error('Error creating candidates:', error);
    throw error;
  }

  return data;
}

export async function getCandidatesByInterview(interviewId: string): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('interview_id', interviewId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching candidates:', error);
    throw error;
  }

  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    usn: c.usn,
    email: c.email,
    resume_score: c.resume_score,
    resume_url: c.resume_url,
    status: c.status,
    interview_id: c.interview_id,
    created_at: c.created_at,
  }));
}

export async function updateCandidateResume(
  candidateId: string,
  resumeUrl: string,
  resumeScore: number
): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .update({
      resume_url: resumeUrl,
      resume_score: resumeScore,
      status: resumeScore >= 75 ? 'Promoted' : 'Not Promoted',
    })
    .eq('id', candidateId);

  if (error) {
    console.error('Error updating candidate resume:', error);
    throw error;
  }
}

export async function updateCandidateStatus(
  candidateId: string,
  status: "Promoted" | "Not Promoted" | "Pending"
): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .update({ status })
    .eq('id', candidateId);

  if (error) {
    console.error('Error updating candidate status:', error);
    throw error;
  }
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching candidate:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    usn: data.usn,
    email: data.email,
    resume_score: data.resume_score,
    resume_url: data.resume_url,
    status: data.status,
    interview_id: data.interview_id,
    created_at: data.created_at,
  };
}

export async function getCandidateByUSN(usn: string): Promise<Candidate | null> {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .eq('usn', usn.trim())
    .single();

  if (error) {
    console.error('Error fetching candidate by USN:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    usn: data.usn,
    email: data.email,
    resume_score: data.resume_score,
    resume_url: data.resume_url,
    status: data.status,
    interview_id: data.interview_id,
    created_at: data.created_at,
  };
}

