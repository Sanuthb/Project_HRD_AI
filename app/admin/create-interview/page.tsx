"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Upload, FileText } from "lucide-react";

export default function CreateInterviewPage() {
  const [jdMethod, setJdMethod] = useState<"upload" | "paste">("paste");
  const [jdText, setJdText] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate form submission
    setTimeout(() => {
      setShowSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setJdText("");
      }, 3000);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Interview</h1>
        <p className="text-muted-foreground">
          Set up a new placement interview with job description and candidates
        </p>
      </div>

      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200">
            Interview Created Successfully!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-300">
            The interview has been assigned and candidates have been notified.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={jdMethod === "paste" ? "default" : "outline"}
                onClick={() => setJdMethod("paste")}
                className="flex-1"
              >
                <FileText className="mr-2 h-4 w-4" />
                Paste JD
              </Button>
              <Button
                type="button"
                variant={jdMethod === "upload" ? "default" : "outline"}
                onClick={() => setJdMethod("upload")}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
            </div>

            {jdMethod === "paste" ? (
              <div className="space-y-2">
                <Label htmlFor="jd-text">Job Description Text</Label>
                <Textarea
                  id="jd-text"
                  placeholder="Paste the job description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="jd-file">Upload Job Description</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="jd-file"
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="candidates-file">Upload Excel File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="candidates-file"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="flex-1"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Upload an Excel file containing candidate information (Name, USN, Email, etc.)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Settings (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interview-type">Interview Type</Label>
                <Select>
                  <SelectTrigger id="interview-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="coding">Coding Round</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 30"
                  min="15"
                  step="15"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" size="lg">
            Assign Interview
          </Button>
        </div>
      </form>
    </div>
  );
}

