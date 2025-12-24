"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, FileText, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { Candidate, Interview } from "@/lib/types";
import { getCandidateByUserId } from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";
import { useAuth } from "@/lib/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { toast } from "sonner";

function CandidateDashboardContent() {
  const router = useRouter();
  const { user, candidateId, signOut } = useAuth();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Fetch candidate and interview data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        setError("You must be logged in to view the dashboard.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Fetch candidate data using the logged-in user's profile (USN / candidate_id)
        const candidateData = await getCandidateByUserId(user.id);

        if (!candidateData) {
          setError("No interview assigned to this account. Please contact the administrator.");
          setIsLoading(false);
          return;
        }

        setCandidate(candidateData);

        // Fetch interview data
        if (candidateData.interview_id) {
          const interviewData = await getInterviewById(candidateData.interview_id);

          if (!interviewData) {
            setError("Interview not found for this candidate.");
          } else {
            setInterview(interviewData);
          }
        } else {
          setError("No interview assigned to this candidate.");
        }
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Update countdown timer
  useEffect(() => {
    if (!interview?.created_at) return;

    const updateTimer = () => {
      // For now, we'll use a mock interview date (7 days from creation)
      // In production, you'd have an actual interview_date field
      const interviewDate = new Date(interview.created_at);
      interviewDate.setDate(interviewDate.getDate() + 7); // Add 7 days
      
      const now = new Date();
      const diff = interviewDate.getTime() - now.getTime();

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [interview]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const interviewStatus = candidate?.status === "Promoted" 
    ? "Completed" 
    : candidate?.status === "Not Promoted" 
    ? "Completed" 
    : candidate?.resume_score !== null && candidate?.resume_score !== undefined
    ? "Scheduled"
    : "Pending";

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Interview Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome, {candidate?.name || user?.email} ({candidate?.usn || "N/A"})
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-200">
            Error
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!interview && !isLoading && (
        <Alert>
          <AlertTitle>No Interview Found</AlertTitle>
          <AlertDescription>
            No interview has been assigned to you yet. Please contact the administrator.
          </AlertDescription>
        </Alert>
      )}

      {interview && candidate && (
        <>
          {/* Interview Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interview Status</CardTitle>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      interviewStatus === "Scheduled"
                        ? "default"
                        : interviewStatus === "Completed"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {interviewStatus === "Scheduled" && (
                      <Clock className="mr-2 h-3 w-3" />
                    )}
                    {interviewStatus === "Completed" && (
                      <CheckCircle2 className="mr-2 h-3 w-3" />
                    )}
                    {interviewStatus}
                  </Badge>

                  {(candidate.status === "Promoted" || (candidate.resume_score !== null && candidate.resume_score !== undefined && candidate.resume_score >= 75)) && (
                    <Button 
                      size="sm" 
                      onClick={() => router.push(`/candidate/interview/${candidate.interview_id}`)}
                      className="bg-blue-600 hover:bg-blue-700 h-8"
                    >
                      {candidate.status === "Not Promoted" ? "Resume Interview" : "Take Interview Sekarang"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Interview Title
                  </p>
                  <p className="text-lg font-semibold">{interview.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Job Description
                  </p>
                  <p className="text-lg">{interview.jd_name}</p>
                </div>
                {interview.interview_type && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Interview Type
                    </p>
                    <p className="text-lg">{interview.interview_type}</p>
                  </div>
                )}
                {interview.duration && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Duration
                    </p>
                    <p className="text-lg">{interview.duration} minutes</p>
                  </div>
                )}
                {candidate.resume_score !== null && candidate.resume_score !== undefined && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      Resume Score
                    </p>
                    <p className="text-lg">{candidate.resume_score}%</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Your Status
                  </p>
                  <Badge
                    variant={
                      candidate.status === "Promoted"
                        ? "default"
                        : candidate.status === "Not Promoted"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-base px-3 py-1"
                  >
                    {candidate.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Countdown Timer */}
          {interviewStatus === "Scheduled" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Time Remaining
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.days}</div>
                    <div className="text-sm text-muted-foreground">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.hours}</div>
                    <div className="text-sm text-muted-foreground">Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.minutes}</div>
                    <div className="text-sm text-muted-foreground">Minutes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{timeLeft.seconds}</div>
                    <div className="text-sm text-muted-foreground">Seconds</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Description Summary */}
          {interview.jd_text && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {interview.jd_text}
                    </p>
                  </div>
                  {interview.jd_file_url && (
                    <div>
                      <a
                        href={interview.jd_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        📄 View Job Description PDF
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!interview.jd_text && interview.jd_file_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Job Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={interview.jd_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  📄 View Job Description PDF
                </a>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function CandidateDashboardPage() {
  return (
    <ProtectedRoute>
      <CandidateDashboardContent />
    </ProtectedRoute>
  );
}
