import { GoogleGenerativeAI } from "@google/generative-ai";
import { Candidate, Interview } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export interface AIReportData {
  strengths: string[];
  weaknesses: string[];
  hiringRecommendation: "Strong Hire" | "Hire" | "Weak Hire" | "No Hire";
  riskFlags: string[];
  finalScore: number;
  communicationScore: number;
  skillsScore: number;
  knowledgeScore: number;
  summary: string;
}

export async function generateFinalReport(
  candidate: Candidate,
  interview: Interview,
  resumeText: string,
  interviewTranscript: string
): Promise<AIReportData> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-robotics-er-1.5-preview" }); // Use stable gemini-1.5-flash

    const prompt = `
      You are an expert HR Interviewer. Generate a final hiring report for a candidate based on their interview for the following position.

      **Job Position/Description:**
      ${interview.title}
      ${interview.jd_text || interview.jd_name}

      **Candidate Resume Info:**
      ${resumeText.substring(0, 3000) || "Resume text not available"}

      **Interview Transcript:**
      ${interviewTranscript.substring(0, 5000)}

      **Task:**
      Analyze the candidate based on the JD, Resume, and Interview performance.
      Provide a structured JSON output with specific scores (0-100) for communication, technical skills, and domain knowledge.

      **Output Format (JSON Only):**
      {
        "strengths": ["..", ".."],
        "weaknesses": ["..", ".."],
        "hiringRecommendation": "Strong Hire" | "Hire" | "Weak Hire" | "No Hire",
        "riskFlags": [".."],
        "finalScore": 0-100,
        "communicationScore": 0-100,
        "skillsScore": 0-100,
        "knowledgeScore": 0-100,
        "summary": "Short paragraph summary focusing on overall fit"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    return JSON.parse(text) as AIReportData;
  } catch (error) {
    console.error("Error generating AI report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate report: ${errorMessage}`);
  }
}
