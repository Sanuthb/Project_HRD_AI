import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Interview } from "@/lib/types";
import Link from "next/link";
import { Eye, Calendar, Users } from "lucide-react";
import { getInterviews } from "@/lib/services/interviews";

export default async function InterviewsPage() {
  let interviews: Interview[] = [];
  
  try {
    interviews = await getInterviews();
  } catch (error) {
    console.error("Error fetching interviews:", error);
  }

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

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No interviews found. Create your first interview to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {interviews.map((interview) => (
          <Card key={interview.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{interview.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {interview.jd_name}
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
                  <span>Created: {formatDate(interview.created_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{interview.candidate_count || 0} candidates</span>
                </div>
                {interview.interview_type && (
                  <span>Type: {interview.interview_type}</span>
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
      )}
    </div>
  );
}

