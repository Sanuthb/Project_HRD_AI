"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Upload, CheckCircle2, XCircle, FileText, Loader2 } from "lucide-react";
import { updateCandidateResume } from "@/lib/services/candidates";
import { uploadResume as uploadResumeFile } from "@/lib/services/storage";
import { useAuth } from "@/lib/contexts/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { toast } from "sonner";

function ResumeUploadContent() {
  const { candidateId } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [skillsScore, setSkillsScore] = useState<number | null>(null);
  const [projectsScore, setProjectsScore] = useState<number | null>(null);
  const [experienceScore, setExperienceScore] = useState<number | null>(null);
  const [eligible, setEligible] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(false);
      setScore(null);
      setSkillsScore(null);
      setProjectsScore(null);
      setExperienceScore(null);
      setEligible(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a resume file");
      return;
    }

    if (!candidateId) {
      setError("No candidate profile linked. Please contact administrator.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      toast.info("Uploading resume...");
      const resumeUrl = await uploadResumeFile(file, candidateId);

      // Call backend AI resume analysis (LangChain + Gemini)
      toast.info("Analyzing resume with AI...");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = data.error || "Failed to analyze resume";
        throw new Error(message);
      }

      const result = await response.json();
      const analysis = result.data as {
        skillsMatchScore: number;
        projectRelevanceScore: number;
        experienceSuitabilityScore: number;
        overallScore: number;
        overallRating: string;
      };

      const overallScore = analysis.overallScore ?? 0;
      const isEligible = overallScore >= 75;

      // Update candidate record
      await updateCandidateResume(candidateId, resumeUrl, overallScore);

      setScore(overallScore);
      setSkillsScore(analysis.skillsMatchScore ?? null);
      setProjectsScore(analysis.projectRelevanceScore ?? null);
      setExperienceScore(analysis.experienceSuitabilityScore ?? null);
      setEligible(isEligible);
      setUploaded(true);
      
      toast.success("Resume uploaded and analyzed successfully!");
    } catch (err: any) {
      console.error("Error uploading resume:", err);
      setError(err.message || "Failed to upload resume. Please try again.");
      toast.error(err.message || "Failed to upload resume");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Resume</h1>
        <p className="text-muted-foreground">
          Upload your resume for AI-powered screening
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
          <CardTitle>Resume Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resume-file">Select Resume File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="resume-file"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={isProcessing}
                className="flex-1"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Supported formats: PDF, DOC, DOCX (Max size: 5MB)
            </p>
          </div>

          {file && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm flex-1">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </span>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing || uploaded || !candidateId}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Analyze
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {uploaded && score !== null && eligible !== null && (
        <>
          {/* AI Score Card */}
          <Card>
            <CardHeader>
              <CardTitle>AI Resume Score</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Resume Match Score</span>
                  <span className="text-2xl font-bold">{score}%</span>
                </div>
                <Progress value={score} className="h-3" />
              </div>

              {skillsScore !== null || projectsScore !== null || experienceScore !== null ? (
                <div className="grid gap-2 text-sm">
                  {skillsScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Skills Match</span>
                      <span className="font-medium">{skillsScore}%</span>
                    </div>
                  )}
                  {projectsScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Relevance</span>
                      <span className="font-medium">{projectsScore}%</span>
                    </div>
                  )}
                  {experienceScore !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Experience Suitability</span>
                      <span className="font-medium">{experienceScore}%</span>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Eligibility Status */}
          <Alert
            className={
              eligible
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : "border-red-500 bg-red-50 dark:bg-red-950"
            }
          >
            {eligible ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertTitle
              className={
                eligible
                  ? "text-green-800 dark:text-green-200"
                  : "text-red-800 dark:text-red-200"
              }
            >
              {eligible ? "Eligible" : "Not Eligible"}
            </AlertTitle>
            <AlertDescription
              className={
                eligible
                  ? "text-green-700 dark:text-green-300"
                  : "text-red-700 dark:text-red-300"
              }
            >
              {eligible
                ? "Congratulations! Your resume meets the requirements. You are eligible to proceed with the interview."
                : "Your resume score is below the threshold (75%). Please update your resume and try again."}
            </AlertDescription>
          </Alert>

          {/* Eligibility Badge */}
          <div className="flex justify-center">
            <Badge
              variant={eligible ? "default" : "destructive"}
              className="text-lg px-6 py-2"
            >
              {eligible ? (
                <>
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Eligible for Interview
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-5 w-5" />
                  Not Eligible
                </>
              )}
            </Badge>
          </div>
        </>
      )}
    </div>
  );
}

export default function ResumeUploadPage() {
  return (
    <ProtectedRoute>
      <ResumeUploadContent />
    </ProtectedRoute>
  );
}
