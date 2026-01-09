"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string,
    name: string,
    usn: string
  ) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  candidateId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCandidateId(session.user.id).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCandidateId(session.user.id);
      } else {
        setCandidateId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchCandidateId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("candidate_id")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data?.candidate_id) {
        setCandidateId(data.candidate_id);
      }
    } catch (error) {
      console.error("Error fetching candidate ID:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    name: string,
    usn: string
  ) => {
    // First, find the candidate by email or USN
    const { data: candidateDataArray, error: candidateError } = await supabase
      .from("candidates")
      .select("id, email, usn")
      .or(`email.eq.${email},usn.eq.${usn}`)
      .limit(1);

    if (
      candidateError ||
      !candidateDataArray ||
      candidateDataArray.length === 0
    ) {
      return {
        error: {
          message:
            "Candidate not found. Please contact administrator to be added to the system.",
        },
      };
    }

    const candidateData = candidateDataArray[0];

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          usn,
        },
      },
    });

    if (authError) {
      return { error: authError };
    }

    // Link candidate to user profile
    if (authData.user) {
      const { error: linkError } = await supabase
        .from("user_profiles")
        .update({
          candidate_id: candidateData.id,
          usn: usn,
        })
        .eq("id", authData.user.id);

      if (linkError) {
        console.error("Error linking candidate:", linkError);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setCandidateId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        candidateId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
