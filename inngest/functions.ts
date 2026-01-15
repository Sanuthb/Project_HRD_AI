import { adminSupabase } from "@/lib/supabase/admin";
import { inngest } from "./client";
import { generatefeedbackanalysis } from "@/lib/services/ai-feedbackanalysis";

// Type definitions for event data
interface AnalysisEvent {
  data: {
    resumeData: any;
    feedbackData: any;
    candidateId: string;
  };
}

export const analysisFunction = inngest.createFunction(
  { id: "analysis-function" },
  { event: "userDetails/analysis.function" },
  async ({ event, step }: { event: AnalysisEvent; step: any }) => {
    try {
      const generateReport = await step.run("generate-final-report", () =>
        generatefeedbackanalysis(event.data.resumeData, event.data.feedbackData)
      );

      await step.run("save-report", async () => {
        if (!adminSupabase) {
          throw new Error("adminSupabase is not initialized. Check environment variables.");
        }
        const { data, error } = await adminSupabase
          .from("feedback_analysis")
          .insert({
            candidate_id: event.data.candidateId,
            analysis: generateReport,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to save feedback analysis: ${error.message}`);
        }
        return data;
      });
    } catch (error) {
      console.error("Error in analysis function:", error);
      await step.run("handle-error", () => {
        return {
          error: "Failed to generate analysis report",
          details: error instanceof Error ? error.message : "Unknown error",
        };
      });
      throw error;
    }
  }
);

// npx --ignore-scripts=false inngest-cli@latest dev
