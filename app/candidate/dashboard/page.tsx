"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, FileText, CheckCircle2, XCircle, Loader2, User } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { Candidate, Interview } from "@/lib/types";
import { getCandidateByUSN } from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";
import { toast } from "sonner";

export default function CandidateDashboardPage() {
  const [usn, setUsn] = useState("");
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Check if candidate is already identified (from localStorage)
  useEffect(() => {
    const savedUsn = localStorage.getItem("candidate_usn");
    if (savedUsn) {
      setUsn(savedUsn);
      handleLookupCandidate(savedUsn);
    }
  }, []);

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

  const handleLookupCandidate = async (usnValue?: string) => {
    const usnToLookup = usnValue || usn.trim();
    
    if (!usnToLookup) {
      setError("Please enter your USN");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      // Fetch candidate data
      const candidateData = await getCandidateByUSN(usnToLookup.trim());

      if (!candidateData) {
        setError("Candidate not found. Please check your USN or contact the administrator.");
        setCandidate(null);
        setInterview(null);
        return;
      }

      setCandidate(candidateData);
      localStorage.setItem("candidate_usn", usnToLookup.trim());

      // Fetch interview data
      if (candidateData.interview_id) {
        const interviewData = await getInterviewById(candidateData.interview_id);

        if (!interviewData) {
          setError("Interview not found for this candidate.");
          setInterview(null);
        } else {
          setInterview(interviewData);
          toast.success(`Welcome, ${candidateData.name}!`);
        }
      } else {
        setError("No interview assigned to this candidate.");
        setInterview(null);
      }
    } catch (err: any) {
      console.error("Error looking up candidate:", err);
      setError(err.message || "Failed to lookup candidate");
      setCandidate(null);
      setInterview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookupCandidate();
  };

  const interviewStatus = candidate?.status === "Promoted" 
    ? "Completed" 
    : candidate?.status === "Not Promoted" 
    ? "Completed" 
    : candidate?.resume_score !== null && candidate?.resume_score !== undefined
    ? "Scheduled"
    : "Pending";

  // Show lookup form if candidate not found
  if (!candidate) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
          <p className="text-muted-foreground">
            Enter your USN to view your interview information
          </p>
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

        <Card>
          <CardHeader>
            <CardTitle>Enter Your USN</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usn">University Seat Number (USN) *</Label>
                <div className="flex gap-2">
                  <Input
                    id="usn"
                    placeholder="e.g., 1NH20CS001"
                    value={usn}
                    onChange={(e) => setUsn(e.target.value)}
                    disabled={isLoading}
                    className="flex-1"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !usn.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Lookup"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
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
              Welcome, {candidate.name} ({candidate.usn})
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              localStorage.removeItem("candidate_usn");
              setCandidate(null);
              setInterview(null);
              setUsn("");
            }}
          >
            <User className="mr-2 h-4 w-4" />
            Switch Candidate
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

      {!interview && (
        <Alert>
          <AlertTitle>No Interview Found</AlertTitle>
          <AlertDescription>
            No interview has been assigned to you yet. Please contact the administrator.
          </AlertDescription>
        </Alert>
      )}

      {interview && (
        <>
          {/* Interview Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interview Status</CardTitle>
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

