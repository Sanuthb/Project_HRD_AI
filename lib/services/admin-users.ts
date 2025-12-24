import { adminSupabase } from '@/lib/supabase/admin';

export interface AdminUserRecord {
  id: string;
  name: string;
  usn: string;
  email: string | null;
  batch: string | null;
  dept: string | null;
  interviewId: string | null;
  interviewTitle: string | null;
  hasAuthUser: boolean;
}

export interface CreatedAuthUser {
  candidateId: string;
  userId: string;
  email: string;
  tempPassword: string;
}

export interface CreateAuthUsersResult {
  created: CreatedAuthUser[];
  skipped: { candidateId: string; reason: string }[];
}

// List all unique "users" (students) by deduplicating candidates based on USN.
export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  // Fetch candidates
  const { data: candidates, error: candidatesError } = await adminSupabase
    .from("candidates")
    .select("id, name, usn, email, batch, dept, interview_id, created_at")
    .order("created_at", { ascending: false });

  if (candidatesError) {
    console.error("Error fetching candidates for admin users:", candidatesError);
    throw candidatesError;
  }

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Fetch IDs of candidates that are linked to a user_profile (legacy check)
  // BUT what we really care about is if the USN is linked.
  // Let's fetch all user_profiles to map USN -> hasAccount
  const { data: profiles, error: profilesError } = await adminSupabase
    .from("user_profiles")
    .select("usn, candidate_id");

  if (profilesError) {
    console.error("Error fetching user_profiles:", profilesError);
    throw profilesError;
  }

  const registeredUSNs = new Set<string>();
  const linkedCandidateIds = new Set<string>();
  
  (profiles || []).forEach((p: any) => {
    if (p.usn) registeredUSNs.add(p.usn);
    if (p.candidate_id) linkedCandidateIds.add(p.candidate_id);
  });

  // Deduplicate candidates by USN
  const uniqueUsersMap = new Map<string, AdminUserRecord>();

  for (const c of candidates) {
    const usn = c.usn;
    if (!usn) continue;

    // We want the most recent info, and candidates are ordered by created_at desc.
    // So the first time we see a USN, that's the latest one.
    if (!uniqueUsersMap.has(usn)) {
      uniqueUsersMap.set(usn, {
        id: c.id, // ID of the latest candidate record
        name: c.name,
        usn: c.usn,
        email: c.email ?? null,
        batch: c.batch ?? null,
        dept: c.dept ?? null,
        interviewId: c.interview_id ?? null,
        interviewTitle: null, // Title logic is tricky with deduplication, maybe omit or join
        hasAuthUser: registeredUSNs.has(usn) || linkedCandidateIds.has(c.id),
      });
    } else {
      // Optional: If the existing entry has missing details (like null batch) but this older one has it, fill it in?
      const existing = uniqueUsersMap.get(usn)!;
      if (!existing.batch && c.batch) existing.batch = c.batch;
      if (!existing.dept && c.dept) existing.dept = c.dept;
      // We don't overwrite name/email from older records usually
    }
  }
  
  // Convert map to array
  const uniqueUsers = Array.from(uniqueUsersMap.values());

  // If we really need interview titles, we'd have to decide WHICH interview to show. 
  // For a "User Management" view, interview specific info is less important than User info.
  // We can leave interviewTitle null or 'Multiple'

  return uniqueUsers;
}

// Create a candidate + Supabase Auth user and link them.
export async function createAdminUser(input: {
  name: string;
  usn: string;
  email: string;
  batch?: string;
  dept?: string;
}): Promise<{ user: AdminUserRecord; auth: CreatedAuthUser }> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  const { name, usn, email, batch, dept } = input;

  // 0) Check if a user with this USN already exists in user_profiles
  const { data: existingProfile } = await adminSupabase
    .from("user_profiles")
    .select("id")
    .eq("usn", usn)
    .maybeSingle();

  if (existingProfile) {
     throw new Error(`A user account already exists for USN ${usn}`);
  }

  // 1) Reuse existing candidate if one already exists for this USN
  const { data: existingCandidate, error: existingError } = await adminSupabase
    .from("candidates")
    .select("id, name, usn, email, batch, dept, interview_id, created_at")
    .eq("usn", usn)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) {
    console.error("Error checking for existing candidate:", existingError);
    throw existingError;
  }

  // Check if this specific candidate row is already linked (double safety)
  if (existingCandidate) {
      const { data: linkedProfile } = await adminSupabase
        .from("user_profiles")
        .select("id")
        .eq("candidate_id", existingCandidate.id)
        .maybeSingle();
      
      if (linkedProfile) {
          // If the latest candidate is linked, we definitely have a user (though step 0 should have caught it if USN matches)
          // But maybe USN in profile is empty? (Unlikely given logic). 
          // Whatever, if linked, we can't reuse it for a NEW user.
          // We must treat this as "User exists" or create a NEW candidate row?
          // Since we want to create a user for this student, and they already have one, we error.
          throw new Error(`This candidate is already linked to a user account.`);
      }
  }

  let candidate = existingCandidate;

  // If no candidate exists for this USN (or we decided not to reuse? No, always reuse matching USN for now), 
  // create a new base candidate record
  if (!candidate) {
    const { data: created, error: candidateError } = await adminSupabase
      .from("candidates")
      .insert([
        {
          name,
          usn,
          email,
          batch: batch ?? null,
          dept: dept ?? null,
          status: "Pending",
        },
      ])
      .select("id, name, usn, email, batch, dept, interview_id, created_at")
      .single();

    if (candidateError || !created) {
      console.error("Error creating candidate in admin user creation:", candidateError);
      throw candidateError;
    }

    candidate = created;
  }

  // 2) Create auth user
  const tempPassword = `${usn || "Candidate"}@123`;

  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        usn,
      },
    });

  if (authError) {
    console.error("Error creating auth user for candidate:", candidate.id, authError);
    // If email exists, throw "User already exists with this email"
    throw new Error(`Failed to create auth user: ${authError.message}`);
  }

  if (!authData?.user) {
      throw new Error("Failed to create auth user: No user data returned.");
  }

  // 3) Link user_profile to candidate
  // Note: The 'handle_new_user' trigger has already inserted a row in user_profiles for this new ID.
  // We just need to update it.
  const { error: linkError } = await adminSupabase
    .from("user_profiles")
    .update({
      candidate_id: candidate.id,
      usn,
    })
    .eq("id", authData.user.id);

  if (linkError) {
    console.error("Error linking user_profile for candidate:", candidate.id, linkError);
    // Try to cleanup? maybe delete the auth user?
    await adminSupabase.auth.admin.deleteUser(authData.user.id); 
    throw new Error(`Failed to link candidate profile: ${linkError.message}`);
  }

  const auth: CreatedAuthUser = {
    candidateId: candidate.id,
    userId: authData.user.id,
    email,
    tempPassword,
  };

  const user: AdminUserRecord = {
    id: candidate.id,
    name: candidate.name,
    usn: candidate.usn,
    email: candidate.email ?? null,
    batch: candidate.batch ?? null,
    dept: candidate.dept ?? null,
    interviewId: candidate.interview_id ?? null,
    interviewTitle: null, 
    hasAuthUser: true,
  };

  return { user, auth };
}

export async function deleteAdminUser(usn: string): Promise<void> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  // 1) Get the auth user ID from user_profiles
  const { data: profile } = await adminSupabase
    .from("user_profiles")
    .select("id")
    .eq("usn", usn)
    .maybeSingle();

  // 2) If auth user exists, delete it
  if (profile?.id) {
    const { error: authError } = await adminSupabase.auth.admin.deleteUser(profile.id);
    if (authError) {
      console.error("Error deleting auth user:", authError);
      throw authError;
    }
  }

  // 3) Delete all candidate records for this USN
  const { error: candidateError } = await adminSupabase
    .from("candidates")
    .delete()
    .eq("usn", usn);

  if (candidateError) {
    console.error("Error deleting candidates:", candidateError);
    throw candidateError;
  }
}

export async function updateAdminUser(
  usn: string,
  updates: {
    name?: string;
    email?: string;
    batch?: string;
    dept?: string;
  }
): Promise<void> {
  if (!adminSupabase) {
    throw new Error("Admin Supabase client is not configured on the server.");
  }

  // Update candidates table (all rows for this USN)
  const { error: candidateError } = await adminSupabase
    .from("candidates")
    .update({
      ...(updates.name && { name: updates.name }),
      ...(updates.email && { email: updates.email }),
      ...(updates.batch && { batch: updates.batch }),
      ...(updates.dept && { dept: updates.dept }),
    })
    .eq("usn", usn);

  if (candidateError) {
    console.error("Error updating candidates:", candidateError);
    throw candidateError;
  }

  // Update auth user if email/name changed
  const { data: profile } = await adminSupabase
    .from("user_profiles")
    .select("id")
    .eq("usn", usn)
    .maybeSingle();

  if (profile?.id && (updates.email || updates.name)) {
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(
      profile.id,
      {
        ...(updates.email && { email: updates.email }),
        ...(updates.name && { user_metadata: { name: updates.name } }),
      }
    );
    if (authError) {
      console.error("Error updating auth user:", authError);
      // We don't necessarily want to fail everything if auth update fails, 
      // but email update is important.
      throw authError;
    }
  }
}

