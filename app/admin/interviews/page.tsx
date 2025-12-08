import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Interview } from "@/lib/types";
import Link from "next/link";
import { Eye, Calendar, Users } from "lucide-react";

// Dummy interview data
const interviews: Interview[] = [
  {
    id: "1",
    title: "Software Engineer - Google",
    jdName: "Google SWE JD 2024",
    createdDate: "2024-01-15",
    candidateCount: 45,
    status: "Active",
    interviewType: "Technical",
    duration: 45,
  },
  {
    id: "2",
    title: "Data Scientist - Microsoft",
    jdName: "Microsoft DS JD 2024",
    createdDate: "2024-01-10",
    candidateCount: 32,
    status: "Active",
    interviewType: "Mixed",
    duration: 60,
  },
  {
    id: "3",
    title: "Full Stack Developer - Amazon",
    jdName: "Amazon FSD JD 2024",
    createdDate: "2024-01-05",
    candidateCount: 58,
    status: "Closed",
    interviewType: "Coding Round",
    duration: 90,
  },
  {
    id: "4",
    title: "ML Engineer - Meta",
    jdName: "Meta MLE JD 2024",
    createdDate: "2024-01-20",
    candidateCount: 28,
    status: "Active",
    interviewType: "Technical",
    duration: 45,
  },
];

export default function InterviewsPage() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interviews</h1>
        <p className="text-muted-foreground">
          View and manage all created interviews
        </p>
      </div>

      <div className="grid gap-4">
        {interviews.map((interview) => (
          <Card key={interview.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{interview.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {interview.jdName}
                  </p>
                </div>
                <Badge
                  variant={interview.status === "Active" ? "default" : "secondary"}
                >
                  {interview.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Created: {formatDate(interview.createdDate)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{interview.candidateCount} candidates</span>
                </div>
                {interview.interviewType && (
                  <span>Type: {interview.interviewType}</span>
                )}
                {interview.duration && (
                  <span>Duration: {interview.duration} min</span>
                )}
              </div>
              <Link href={`/admin/dashboard/${interview.id}`}>
                <Button>
                  <Eye className="mr-2 h-4 w-4" />
                  View Results
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

