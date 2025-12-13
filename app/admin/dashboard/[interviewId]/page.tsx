import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Candidate } from "@/lib/types";
import { Eye, TrendingUp } from "lucide-react";
import { getInterviewById } from "@/lib/services/interviews";
import { getCandidatesByInterview } from "@/lib/services/candidates";
import { PromoteCandidateButton } from "./promote-button";

interface PageProps {
  params: Promise<{ interviewId: string }>;
}

export default async function InterviewDashboardPage({ params }: PageProps) {
  const { interviewId } = await params;
  
  let interview = null;
  let candidates: Candidate[] = [];
  
  try {
    interview = await getInterviewById(interviewId);
    candidates = await getCandidatesByInterview(interviewId);
  } catch (error) {
    console.error("Error fetching interview data:", error);
  }

  const interviewTitle = interview?.title || "Interview Dashboard";
  const totalCandidates = candidates.length;
  const promotedCount = candidates.filter((c) => c.status === "Promoted").length;
  const completedCount = candidates.filter((c) => (c.resume_score || 0) > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{interviewTitle}</h1>
        <p className="text-muted-foreground">
          Interview results and candidate performance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Candidates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground">
              Registered for this interview
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Promoted Candidates
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {promotedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalCandidates > 0
                ? Math.round((promotedCount / totalCandidates) * 100)
                : 0}% promotion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Interviews Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">
              Out of {totalCandidates} candidates
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Candidate Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Candidate Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>USN</TableHead>
                <TableHead>Resume Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No candidates found for this interview
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
                  <TableRow key={candidate.id}>
                    <TableCell className="font-medium">
                      {candidate.name}
                    </TableCell>
                    <TableCell>{candidate.usn}</TableCell>
                    <TableCell>
                      {candidate.resume_score !== null && candidate.resume_score !== undefined ? (
                        <div className="space-y-1">
                          <Progress value={candidate.resume_score} />
                          <span className="text-sm text-muted-foreground">
                            {candidate.resume_score}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not scored</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          candidate.status === "Promoted"
                            ? "default"
                            : candidate.status === "Not Promoted"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {candidate.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      {candidate.status === "Not Promoted" && (
                        <PromoteCandidateButton candidateId={candidate.id} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

