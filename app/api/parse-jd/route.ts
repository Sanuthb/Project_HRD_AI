import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parsePDF } from '@/lib/utils/pdf-parser';

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

    let textContent = '';

    if (jdText) {
      textContent = jdText;
    } else if (file) {
      // Read file content
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // For text files, read directly
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        textContent = buffer.toString('utf-8');
      } else if (file.name.endsWith('.pdf')) {
        // Extract text from PDF
        try {
          textContent = await parsePDF(buffer);
          
          if (!textContent.trim()) {
            throw new Error('PDF appears to be empty or contains no extractable text');
          }
        } catch (error: any) {
          console.error('Error parsing PDF:', error);
          
          // Provide helpful error message with alternative
          return NextResponse.json(
            { 
              error: `PDF file parsing failed: ${error.message}. Please either:\n1. Copy the text from the PDF and paste it in the "Paste JD" option, or\n2. Convert the PDF to a .txt file and upload it.`
            },
            { status: 400 }
          );
        }
      } else {
        // For DOC/DOCX files, try to read as text (basic support)
        // For better DOCX support, consider using mammoth library
        try {
          textContent = buffer.toString('utf-8');
          // If the content looks like binary data, it's probably not a text file
          if (textContent.length === 0 || textContent.includes('\0')) {
            return NextResponse.json(
              { error: 'Unable to read file. Please convert to .txt or .pdf format, or paste the job description text.' },
              { status: 400 }
            );
          }
        } catch (error) {
          return NextResponse.json(
            { error: 'Unable to read file. Please use a .txt or .pdf file, or paste the job description text.' },
            { status: 400 }
          );
        }
      }
    }

    if (!textContent.trim()) {
      return NextResponse.json(
        { error: 'File is empty or could not be read' },
        { status: 400 }
      );
    }

    // Use Gemini AI to parse the job description
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedData;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedText);
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

