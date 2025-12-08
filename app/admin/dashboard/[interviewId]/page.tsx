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

// Dummy candidate data for different interviews
const candidateData: Record<string, Candidate[]> = {
  "1": [
    {
      id: "c1",
      name: "Rohan Kumar",
      usn: "1NH20CS001",
      resumeScore: 85,
      status: "Promoted",
      interviewId: "1",
    },
    {
      id: "c2",
      name: "Ananya Singh",
      usn: "1NH20CS014",
      resumeScore: 72,
      status: "Not Promoted",
      interviewId: "1",
    },
    {
      id: "c3",
      name: "Vikram Rao",
      usn: "1NH20CS032",
      resumeScore: 90,
      status: "Promoted",
      interviewId: "1",
    },
    {
      id: "c4",
      name: "Priya Sharma",
      usn: "1NH20CS045",
      resumeScore: 68,
      status: "Not Promoted",
      interviewId: "1",
    },
    {
      id: "c5",
      name: "Arjun Patel",
      usn: "1NH20CS052",
      resumeScore: 88,
      status: "Promoted",
      interviewId: "1",
    },
  ],
  "2": [
    {
      id: "c6",
      name: "Sneha Reddy",
      usn: "1NH20CS067",
      resumeScore: 79,
      status: "Promoted",
      interviewId: "2",
    },
    {
      id: "c7",
      name: "Karan Malhotra",
      usn: "1NH20CS078",
      resumeScore: 65,
      status: "Not Promoted",
      interviewId: "2",
    },
  ],
  "3": [
    {
      id: "c8",
      name: "Meera Joshi",
      usn: "1NH20CS089",
      resumeScore: 92,
      status: "Promoted",
      interviewId: "3",
    },
  ],
  "4": [
    {
      id: "c9",
      name: "Rahul Verma",
      usn: "1NH20CS095",
      resumeScore: 75,
      status: "Not Promoted",
      interviewId: "4",
    },
  ],
};

// Dummy interview titles
const interviewTitles: Record<string, string> = {
  "1": "Software Engineer - Google",
  "2": "Data Scientist - Microsoft",
  "3": "Full Stack Developer - Amazon",
  "4": "ML Engineer - Meta",
};

interface PageProps {
  params: Promise<{ interviewId: string }>;
}

export default async function InterviewDashboardPage({ params }: PageProps) {
  const { interviewId } = await params;
  const candidates = candidateData[interviewId] || [];
  const interviewTitle = interviewTitles[interviewId] || "Interview Dashboard";

  const totalCandidates = candidates.length;
  const promotedCount = candidates.filter((c) => c.status === "Promoted").length;
  const completedCount = candidates.filter((c) => c.resumeScore > 0).length;

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
                      <div className="space-y-1">
                        <Progress value={candidate.resumeScore} />
                        <span className="text-sm text-muted-foreground">
                          {candidate.resumeScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          candidate.status === "Promoted"
                            ? "default"
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
                        <Button size="sm">
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Promote
                        </Button>
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

