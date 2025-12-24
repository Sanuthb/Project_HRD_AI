import { supabase } from '@/lib/supabase/client';
import { adminSupabase } from '@/lib/supabase/admin';
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
      usn: data.usn.trim(),
      email: data.email,
      interview_id: data.interview_id,
      status: data.status || 'Pending',
      resume_status: 'Pending',
      interview_status: 'Not Started',
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating candidate:', error);
    throw error;
  }

  return candidate;
}

/**
 * Create or update candidates for an interview in bulk.
 *
 * We intentionally avoid creating duplicate rows for the same USN.
 * If a candidate already exists with the same USN, we REUSE that row
 * and update its interview_id / basic fields instead of inserting a new one.
 */
export async function createCandidatesBulk(
  candidates: Array<{
    name: string;
    usn: string;
    email?: string;
    batch?: string;
    dept?: string;
    interview_id: string;
  }>
) {
  const createdOrUpdated: any[] = [];
  const skipped: Array<{ usn: string; reason: string }> = [];

  // Get all registered USNs first to check existence efficiently
  // CRITICAL: Use admin client to bypass RLS on user_profiles
  const client = adminSupabase || supabase;
  const { data: registeredProfiles } = await client
    .from('user_profiles')
    .select('usn');
  
  const registeredUSNs = new Set((registeredProfiles || []).map(p => p.usn));

  for (const candidate of candidates) {
    const usn = candidate.usn.trim();

    // 0) CRITICAL: Check if user exists in user_profiles
    if (!registeredUSNs.has(usn)) {
      skipped.push({ usn, reason: "No registered account found" });
      continue;
    }

    // 1) Check if we already have a candidate for this USN *AND* this Interview
    const { data: existingList, error: existingError } = await supabase
      .from('candidates')
      .select('*')
      .eq('usn', usn)
      .eq('interview_id', candidate.interview_id)
      .limit(1);

    if (existingError) {
      console.error('Error checking for existing candidate in bulk create:', existingError);
      throw existingError;
    }

    const existing = existingList && existingList.length > 0 ? existingList[0] : null;

    if (existing) {
      // 2a) Reuse existing candidate row – update basic data
      const { data, error } = await supabase
        .from('candidates')
        .update({
          name: candidate.name,
          email: candidate.email,
          batch: candidate.batch || existing.batch,
          dept: candidate.dept || existing.dept,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating existing candidate in bulk create:', error);
        throw error;
      }

      createdOrUpdated.push(data);
    } else {
      // 2b) Create a NEW candidate record for this interview
      let finalBatch = candidate.batch;
      let finalDept = candidate.dept;

      if (!finalBatch || !finalDept) {
        const { data: globalExisting } = await supabase
          .from('candidates')
          .select('batch, dept')
          .eq('usn', usn)
          .not('batch', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (globalExisting) {
          if (!finalBatch) finalBatch = globalExisting.batch;
          if (!finalDept) finalDept = globalExisting.dept;
        }
      }

      const { data, error } = await supabase
        .from('candidates')
        .insert([{
          name: candidate.name,
          usn,
          email: candidate.email,
          batch: finalBatch,
          dept: finalDept,
          interview_id: candidate.interview_id,
          status: 'Pending',
          resume_status: 'Pending',
          interview_status: 'Not Started',
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating candidate in bulk create:', error);
        throw error;
      }

      createdOrUpdated.push(data);
    }
  }

  return { createdOrUpdated, skipped };
}

export async function searchRegisteredUsers(query: string, interviewId: string) {
  const lowerQuery = query.toLowerCase();

  // 1) Get all candidates already in this interview
  const { data: existingCandidates } = await supabase
    .from('candidates')
    .select('usn')
    .eq('interview_id', interviewId);
  
  const existingUSNs = new Set((existingCandidates || []).map(c => c.usn));

  // 2) Get registered users matching query
  // Since user_profiles might not have 'name', we should ideally join with candidates or auth?
  // Let's assume we want to search in users we already know about.
  // Actually, listAdminUsers in admin-users.ts does exactly what we want (unique users).
  // But we need to use 'supabase' client here.
  
  // We'll search in candidates table for unique USNs that have a profile.
  const { data: candidatesWithProfiles } = await supabase
    .from('candidates')
    .select('name, usn, email, batch, dept')
    .order('created_at', { ascending: false });

  if (!candidatesWithProfiles) return [];

  const client = adminSupabase || supabase;
  const { data: profiles } = await client.from('user_profiles').select('usn');
  const profileUSNs = new Set((profiles || []).map(p => p.usn));

  const uniqueUsers = new Map<string, any>();
  for (const c of candidatesWithProfiles) {
    if (profileUSNs.has(c.usn) && !existingUSNs.has(c.usn) && !uniqueUsers.has(c.usn)) {
      if (c.name.toLowerCase().includes(lowerQuery) || c.usn.toLowerCase().includes(lowerQuery)) {
        uniqueUsers.set(c.usn, c);
      }
    }
  }

  return Array.from(uniqueUsers.values()).slice(0, 10);
}

export async function addCandidateToInterview(usn: string, interviewId: string) {
  // 1) Get latest info for this USN
  const { data: userInfo, error: fetchError } = await supabase
    .from('candidates')
    .select('*')
    .eq('usn', usn)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !userInfo) {
    throw new Error("User info not found");
  }

  // 2) Create new candidate record for this interview
  const { data, error } = await supabase
    .from('candidates')
    .insert([{
      name: userInfo.name,
      usn: userInfo.usn,
      email: userInfo.email,
      batch: userInfo.batch,
      dept: userInfo.dept,
      interview_id: interviewId,
      status: 'Pending',
      resume_status: 'Pending',
      interview_status: 'Not Started',
    }])
    .select()
    .single();

  if (error) throw error;
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
    resume_status: c.resume_status,
    interview_status: c.interview_status,
    manually_promoted: c.manually_promoted,
    override_by_admin: c.override_by_admin,
    manual_interview_deadline: c.manual_interview_deadline,
    created_at: c.created_at,
  }));
}

export async function updateCandidateResume(
  candidateId: string,
  resumeUrl: string,
  resumeScore: number
): Promise<void> {
  // 1. Get the USN of the candidate to ensure we update ALL active applications for this student
  const { data: candidate, error: fetchError } = await supabase
    .from('candidates')
    .select('usn')
    .eq('id', candidateId)
    .single();

  if (fetchError || !candidate) {
      console.error('Error fetching candidate for resume update:', fetchError);
      throw fetchError || new Error("Candidate not found");
  }

  // 2. Update ALL candidate records with this USN (so all interview dashboards see the new resume)
  // We typically only update 'Pending' or 'Not Started' ones, but updating all is safer for consistency.
  const { error } = await supabase
    .from('candidates')
    .update({
      resume_url: resumeUrl,
      resume_score: resumeScore,
      // If score is high, promote? CAREFUL: Different interviews might have different thresholds.
      // For now, let's keep the simple logic: if > 75, promote. 
      // ideally validation should be per-interview, but for this shared update, we apply one rule.
      status: resumeScore >= 75 ? 'Promoted' : 'Not Promoted',
      resume_status: resumeScore >= 75 ? 'Passed' : 'Failed', // Sync resume_status too
    })
    .eq('usn', candidate.usn);

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

export async function markMalpractice(candidateId: string): Promise<void> {
  const { error } = await supabase
    .from('candidates')
    .update({ 
      malpractice: true,
      status: 'Not Promoted',
      interview_status: 'Completed'
    })
    .eq('id', candidateId);

  if (error) {
    console.error('Error marking malpractice:', error);
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
      resume_status: data.resume_status,
      interview_status: data.interview_status,
      manually_promoted: data.manually_promoted,
      override_by_admin: data.override_by_admin,
      manual_interview_deadline: data.manual_interview_deadline,
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
      resume_status: candidate.resume_status,
      interview_status: candidate.interview_status,
      manually_promoted: candidate.manually_promoted,
      override_by_admin: candidate.override_by_admin,
      manual_interview_deadline: candidate.manual_interview_deadline,
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
            resume_status: candidate.resume_status,
            interview_status: candidate.interview_status,
            manually_promoted: candidate.manually_promoted,
            override_by_admin: candidate.override_by_admin,
            manual_interview_deadline: candidate.manual_interview_deadline,
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

