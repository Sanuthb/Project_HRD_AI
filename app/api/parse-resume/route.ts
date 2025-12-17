import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No resume file provided" },
        { status: 400 }
      );
    }

    // Use LangChain PDF loader when the file is a PDF
    let resumeText = "";

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const loader = new WebPDFLoader(file);
      const docs = await loader.load();
      resumeText = docs.map((d) => d.pageContent).join("\n");
    } else {
      // Fallback: read as text for DOC/DOCX or other text-like formats
      const arrayBuffer = await file.arrayBuffer();
      resumeText = Buffer.from(arrayBuffer).toString("utf-8");
    }

    if (!resumeText.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from resume. Please upload a clear PDF or text-based file." },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are evaluating a candidate's resume for a placement screening system.

Analyze the resume text below and return a JSON object with detailed scores.

Resume:
${resumeText}

Return JSON in the following structure (numbers between 0 and 100):
{
  "skillsMatchScore": 0,
  "projectRelevanceScore": 0,
  "experienceSuitabilityScore": 0,
  "overallScore": 0,
  "overallRating": "Poor | Average | Good | Great",
  "strengths": ["brief bullet", "another bullet"],
  "weaknesses": ["brief bullet", "another bullet"]
}

Return ONLY valid JSON, no extra text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean any accidental formatting
    const cleanedText = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let parsed: any;
    try {
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : cleanedText);
    } catch (err) {
      console.error("Failed to parse Gemini resume response:", err);
      console.error("Raw text:", cleanedText);
      return NextResponse.json(
        { error: "Failed to parse AI resume analysis. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        skillsMatchScore: parsed.skillsMatchScore ?? 0,
        projectRelevanceScore: parsed.projectRelevanceScore ?? 0,
        experienceSuitabilityScore: parsed.experienceSuitabilityScore ?? 0,
        overallScore: parsed.overallScore ?? 0,
        overallRating: parsed.overallRating ?? "Average",
        strengths: parsed.strengths ?? [],
        weaknesses: parsed.weaknesses ?? [],
      },
    });
  } catch (error: any) {
    console.error("Error parsing resume:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze resume" },
      { status: 500 }
    );
  }
}


