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

      await step.run("save-report", () => {
        // TODO: save report to database
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
