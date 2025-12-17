import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.warn(
    "Supabase service role environment variables are not set. Admin user management will not work. Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your .env.local file (service key must NEVER be exposed to the client)."
  );
}

// Server-only Supabase client with service role.
// This file must only ever be imported from server-side code (API routes, server components).
const adminSupabase = supabaseUrl && serviceRoleKey
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

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

// List all candidate "users" with whether they have an auth account.
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

  const candidateIds = candidates.map((c: any) => c.id);
  const interviewIds = Array.from(
    new Set(candidates.map((c: any) => c.interview_id).filter(Boolean))
  );

  // Fetch user_profiles to know which candidates are linked
  const { data: profiles, error: profilesError } = await adminSupabase
    .from("user_profiles")
    .select("candidate_id")
    .in("candidate_id", candidateIds);

  if (profilesError) {
    console.error("Error fetching user_profiles:", profilesError);
    throw profilesError;
  }

  const linkedCandidateIds = new Set(
    (profiles || []).map((p: any) => p.candidate_id as string)
  );

  // Fetch interviews for display (title)
  const { data: interviews, error: interviewsError } = await adminSupabase
    .from("interviews")
    .select("id, title")
    .in("id", interviewIds);

  if (interviewsError) {
    console.error("Error fetching interviews for admin users:", interviewsError);
    throw interviewsError;
  }

  const interviewTitleById = new Map<string, string>();
  (interviews || []).forEach((i: any) => {
    interviewTitleById.set(i.id, i.title);
  });

  return (candidates as any[]).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    usn: c.usn as string,
    email: c.email ?? null,
    batch: c.batch ?? null,
    dept: c.dept ?? null,
    interviewId: (c.interview_id as string) ?? null,
    interviewTitle: interviewTitleById.get(c.interview_id) ?? null,
    hasAuthUser: linkedCandidateIds.has(c.id),
  }));
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

  // 1) Reuse existing candidate if one already exists for this USN (to avoid duplicates)
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

  let candidate = existingCandidate;

  // If no candidate exists for this USN, create a new base candidate record (not tied to any interview)
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

  if (authError || !authData?.user) {
    console.error("Error creating auth user for candidate:", candidate.id, authError);
    throw authError;
  }

  // 3) Link user_profile to candidate
  const { error: linkError } = await adminSupabase
    .from("user_profiles")
    .update({
      candidate_id: candidate.id,
      usn,
    })
    .eq("id", authData.user.id);

  if (linkError) {
    console.error("Error linking user_profile for candidate:", candidate.id, linkError);
    throw linkError;
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
    interviewTitle: null, // can be filled by caller if needed
    hasAuthUser: true,
  };

  return { user, auth };
}

