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
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Use maybeSingle() to handle no results gracefully

    if (error) {
      console.error('Error fetching candidate:', error);
      return null;
    }

    if (!data) {
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
  } catch (error: any) {
    console.error('Error in getCandidateById:', error);
    return null;
  }
}

export async function getCandidateByUSN(usn: string): Promise<Candidate | null> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('usn', usn.trim())
      .limit(1); // Use limit(1) instead of maybeSingle() to handle multiple results

    if (error) {
      console.error('Error fetching candidate by USN:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // If multiple candidates exist with same USN, return the first one
    // TODO: This should be handled with proper authentication
    const candidate = data[0];

    return {
      id: candidate.id,
      name: candidate.name,
      usn: candidate.usn,
      email: candidate.email,
      resume_score: candidate.resume_score,
      resume_url: candidate.resume_url,
      status: candidate.status,
      interview_id: candidate.interview_id,
      created_at: candidate.created_at,
    };
  } catch (error: any) {
    console.error('Error in getCandidateByUSN:', error);
    return null;
  }
}

export async function getCandidateByUserId(userId: string): Promise<Candidate | null> {
  try {
    // First get the user profile to find USN (and candidate_id if needed)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('candidate_id, usn')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Prefer looking up by USN so that a candidate can have multiple interview rows.
    if (profile.usn) {
      try {
        const { data, error } = await supabase
          .from('candidates')
          .select('*')
          .eq('usn', profile.usn)
          .order('created_at', { ascending: false })
          .limit(1);

        if (!error && data && data.length > 0) {
          const candidate = data[0];
          return {
            id: candidate.id,
            name: candidate.name,
            usn: candidate.usn,
            email: candidate.email,
            resume_score: candidate.resume_score,
            resume_url: candidate.resume_url,
            status: candidate.status,
            interview_id: candidate.interview_id,
            created_at: candidate.created_at,
          };
        }
      } catch (err) {
        console.error('Error fetching candidate by USN from user profile:', err);
      }
    }

    // Fallback: use candidate_id if present
    if (profile.candidate_id) {
      return await getCandidateById(profile.candidate_id);
    }

    return null;
  } catch (error: any) {
    console.error('Error in getCandidateByUserId:', error);
    return null;
  }
}

