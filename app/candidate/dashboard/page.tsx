"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, FileText, CheckCircle2, XCircle } from "lucide-react";

export default function CandidateDashboardPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 30,
    seconds: 45,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { days, hours, minutes, seconds } = prev;
        
        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const interviewStatus = "Scheduled"; // Can be: Scheduled, Completed, Pending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interview Dashboard</h1>
        <p className="text-muted-foreground">
          Your placement interview information
        </p>
      </div>

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
                Interview Date
              </p>
              <p className="text-lg">January 25, 2024 at 10:00 AM</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Interview Type
              </p>
              <p className="text-lg">Technical Interview</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Duration
              </p>
              <p className="text-lg">45 minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Countdown Timer */}
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

      {/* Job Description Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job Description Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Position: Software Engineer</h3>
              <p className="text-sm text-muted-foreground">
                We are looking for a talented Software Engineer to join our team.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-1">Key Responsibilities:</h4>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Design and develop scalable software solutions</li>
                <li>Collaborate with cross-functional teams</li>
                <li>Write clean, maintainable code</li>
                <li>Participate in code reviews and technical discussions</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-1">Required Skills:</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {["JavaScript", "React", "Node.js", "TypeScript", "SQL"].map(
                  (skill) => (
                    <Badge key={skill} variant="outline">
                      {skill}
                    </Badge>
                  )
                )}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-1">Experience:</h4>
              <p className="text-sm text-muted-foreground">
                0-2 years of experience (Fresh graduates welcome)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

