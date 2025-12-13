import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const jdText = formData.get('text') as string | null;

    if (!file && !jdText) {
      return NextResponse.json(
        { error: 'No file or text provided' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let result: any;
    let text: string;

    if (jdText) {
      // Text-based parsing
      const prompt = `Analyze the following job description and extract the following information in JSON format:
{
  "title": "Job title/position name (e.g., 'Software Engineer - Google')",
  "jdName": "Short name for this job description (e.g., 'Google SWE JD 2024')",
  "interviewType": "Type of interview - one of: Technical, HR, Mixed, Coding Round (or null if not clear)",
  "duration": "Interview duration in minutes (as a number, or null if not mentioned)",
  "skills": ["array", "of", "key", "skills", "mentioned"],
  "summary": "Brief 2-3 sentence summary of the role"
}

Job Description:
${jdText}

Return ONLY valid JSON, no additional text or markdown formatting.`;

      result = await model.generateContent(prompt);
      const response = await result.response;
      text = response.text();
    } else if (file) {
      // File-based parsing - send directly to Gemini (supports PDF, images, etc.)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString('base64');
      
      // Determine MIME type
      let mimeType = file.type;
      if (!mimeType) {
        if (file.name.endsWith('.pdf')) mimeType = 'application/pdf';
        else if (file.name.endsWith('.txt')) mimeType = 'text/plain';
        else if (file.name.endsWith('.doc')) mimeType = 'application/msword';
        else if (file.name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else mimeType = 'application/octet-stream';
      }

      // For text files, read directly and send as text
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const textContent = buffer.toString('utf-8');
        const prompt = `Analyze the following job description and extract the following information in JSON format:
{
  "title": "Job title/position name (e.g., 'Software Engineer - Google')",
  "jdName": "Short name for this job description (e.g., 'Google SWE JD 2024')",
  "interviewType": "Type of interview - one of: Technical, HR, Mixed, Coding Round (or null if not clear)",
  "duration": "Interview duration in minutes (as a number, or null if not mentioned)",
  "skills": ["array", "of", "key", "skills", "mentioned"],
  "summary": "Brief 2-3 sentence summary of the role"
}

Job Description:
${textContent}

Return ONLY valid JSON, no additional text or markdown formatting.`;

        result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
      } else {
        // For PDF and other files, send as inline data to Gemini
        // Gemini can directly process PDFs, images, DOC files, etc.
        result = await model.generateContent([
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
          {
            text: `Extract and analyze the Job Description from this file.

Extract the following information in JSON format:
{
  "title": "Job title/position name (e.g., 'Software Engineer - Google')",
  "jdName": "Short name for this job description (e.g., 'Google SWE JD 2024')",
  "interviewType": "Type of interview - one of: Technical, HR, Mixed, Coding Round (or null if not clear)",
  "duration": "Interview duration in minutes (as a number, or null if not mentioned)",
  "skills": ["array", "of", "key", "skills", "mentioned"],
  "summary": "Brief 2-3 sentence summary of the role"
}

Return ONLY valid JSON, no additional text or markdown formatting.`,
          },
        ]);
        const response = await result.response;
        text = response.text();
      }
    } else {
      return NextResponse.json(
        { error: 'No file or text provided' },
        { status: 400 }
      );
    }

    // Parse the JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // Try to extract JSON from the response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(cleanedText);
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      console.error('Response text:', text);
      return NextResponse.json(
        { error: 'Failed to parse AI response. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        title: parsedData.title || '',
        jdName: parsedData.jdName || '',
        interviewType: parsedData.interviewType || null,
        duration: parsedData.duration ? String(parsedData.duration) : null,
        skills: parsedData.skills || [],
        summary: parsedData.summary || '',
      },
    });
  } catch (error: any) {
    console.error('Error parsing job description:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse job description' },
      { status: 500 }
    );
  }
}
