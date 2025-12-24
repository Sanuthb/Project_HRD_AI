import { NextRequest, NextResponse } from "next/server";
import { generateFinalReport } from "@/lib/services/ai-report";
import { getCandidateById } from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";
import { supabase } from "@/lib/supabase/client";

export async function POST(req: NextRequest) {
  try {
    const { conversation, candidateId, interviewId } = await req.json();

    if (!conversation || !candidateId || !interviewId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [candidate, interview] = await Promise.all([
      getCandidateById(candidateId),
      getInterviewById(interviewId),
    ]);

    if (!candidate || !interview) {
      return NextResponse.json(
        { error: "Candidate or Interview not found" },
        { status: 404 }
      );
    }

    // Generate the report using the existing service
    // We assume the service is updated to return communication, skills, knowledge scores
    const report = await generateFinalReport(
      candidate,
      interview as any,
      "Resume text not available in this request", // We might want to fetch this properly
      JSON.stringify(conversation)
    );

    // Save to interview_results
    const { data: resultData, error: resultError } = await supabase
      .from("interview_results")
      .insert([
        {
          candidate_id: candidateId,
          interview_id: interviewId,
          transcript: conversation,
          report: report,
          communication_score: (report as any).communicationScore || 0,
          skills_score: (report as any).skillsScore || 0,
          knowledge_score: (report as any).knowledgeScore || 0,
          summary: report.summary,
        },
      ])
      .select()
      .single();

    if (resultError) throw resultError;

    // Update candidate interview status
    await supabase
      .from("candidates")
      .update({ interview_status: "Completed" })
      .eq("id", candidateId);

    return NextResponse.json({ success: true, data: resultData });
  } catch (error: any) {
    console.error("Error in ai-feedback API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
