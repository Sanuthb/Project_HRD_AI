import { GoogleGenerativeAI } from "@google/generative-ai";
import { Candidate, Interview } from "@/lib/types";

const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
);

// Mock data for feedback analysis data like

// const feedbackData = [
//   {
//     id: "573eaea6-d0cd-4f0f-8f8f-475cffa7cb45",
//     report: {
//       summary:
//         "The candidate presents a resume with relevant full-stack experience in modern frameworks and AI integration. However, the interview performance was severely hindered by a significant communication barrier. The candidate struggled to articulate project specifics, technical challenges, and implementation details coherently in English. This makes it challenging to accurately assess technical skills and domain knowledge. Due to the communication difficulties, the candidate is not suitable for a role requiring collaborative technical discussions.",
//       riskFlags: [
//         "Significant communication barrier in English, which will impede effective team collaboration and technical discussions.",
//         "Interview performance raises doubts about the depth of technical understanding beyond a surface level, as the candidate struggled to explain implementation details clearly.",
//       ],
//       strengths: [
//         "Resume indicates hands-on experience with modern technologies relevant to full-stack development, including Next.js, Node.js, and PostgreSQL.",
//         "Candidate has experience integrating AI models (Gemini AI) and third-party services like authentication systems (Clerk, NextAuth) and payment gateways (Stripe, Razorpay).",
//       ],
//       finalScore: 35,
//       weaknesses: [
//         "Significant communication difficulties during the interview, making it challenging to understand explanations of technical concepts and project details.",
//         "Inability to articulate specific technical challenges faced during project development or provide structured explanations of architecture and implementation choices.",
//         "Lack of clarity in describing backend components and their specific contribution to the projects, beyond mentioning full-stack development.",
//       ],
//       skillsScore: 40,
//       knowledgeScore: 40,
//       communicationScore: 20,
//       hiringRecommendation: "No Hire",
//     },
//     created_at: "2026-01-04T11:24:27.689866+00:00",
//     interviews: {
//       id: "e73382fa-63b4-4ea8-94f2-e396c5915f2c",
//       title: "Software Engineer – Backend",
//       interview_type: "Technical",
//     },
//     transcript: [
//       {
//         role: "system",
//         content:
//           "You are an AI voice assistant conducting interviews.\n                          Your job is to ask candidates relevant interview questions based on their resume and the job description provided.\n\n                          **Context:**\n                          - Job Description: Acme Technologies Backend SWE\n                          - Candidate Name: Tanmay Rana\n                          - Candidate Resume Info: Candidate Resume Content:\nTanmay Rana \n9832525746 | tanmayrana2001@gmail.com | linkedin.com/in/tanmay-rana | github.com/TanmayRana \nSitanagar, Bajua, Hooghly, West Bengal - 712602 \nProfessional Summary \nFull-stack developer with expertise in building scalable AI-powered web applications using Next.js, React, and modern \ncloud technologies.  Proven ability to deliver production-ready SaaS platforms with 95% user satisfaction.  Proficient in \nintegrating AI models, authentication systems, and payment gateways to create comprehensive business solutions. \nEducation \nNew Horizon Col...",
//       },
//       {
//         role: "assistant",
//         content: "Hi. How are you? Ready for your interview on?",
//       },
//       {
//         role: "user",
//         content: "Alright. No.",
//       },
//       {
//         role: "assistant",
//         content:
//           "No worries, Tanmay. Let's ease into it. I'll guide you through, and we'll make this a productive session. Let's start with something simple. Can you walk me through your favorite project from your resume and explain the challenges you faced while building it?",
//       },
//       {
//         role: "user",
//         content:
//           "And, uh, I'm very pretty clear, uh, which has a string to this project is as soon used to this project to base on full step project, and this project I'm waited, but",
//       },
//       {
//         role: "assistant",
//         content: "No problem, Tenme.",
//       },
//       {
//         role: "user",
//         content:
//           "I'm creating a net basic Nexus. And, uh, And at I'm with the so many agents, uh, for this project. Uh, AI agents, uh, this AI agent here and putting her to index to agent clip and in the agent clip. And, uh, this uh, final end with the h AI agent, uh, this 1 meeting for this I am piece, uh, how to put the AI agent and, uh, buyer with giving Deepgram and how to pass the insert, criteria. And, uh, I am, uh, this time, I am it's it's so many websites, and it's and we visited the ID and This AI is in feature document is in the output. Create agents, how to integrate the data. Inside the AI engine.",
//       },
//       {
//         role: "assistant",
//         content:
//           "Great effort. It sounds like you've worked extensive with AI agents and integrating them into your projects, which is impressive. You mentioned using ingest in Gemini AI in your AI career coach agent project. Could you elaborate on how you integrated these AI models in your application and what specific functionalities they provided?",
//       },
//     ],
//   },
//   {
//     id: "573eaea6-d0cd-4f0f-8f8f-475cffa7cb45",
//     report: {
//       summary:
//         "The candidate presents a resume with relevant full-stack experience in modern frameworks and AI integration. However, the interview performance was severely hindered by a significant communication barrier. The candidate struggled to articulate project specifics, technical challenges, and implementation details coherently in English. This makes it challenging to accurately assess technical skills and domain knowledge. Due to the communication difficulties, the candidate is not suitable for a role requiring collaborative technical discussions.",
//       riskFlags: [
//         "Significant communication barrier in English, which will impede effective team collaboration and technical discussions.",
//         "Interview performance raises doubts about the depth of technical understanding beyond a surface level, as the candidate struggled to explain implementation details clearly.",
//       ],
//       strengths: [
//         "Resume indicates hands-on experience with modern technologies relevant to full-stack development, including Next.js, Node.js, and PostgreSQL.",
//         "Candidate has experience integrating AI models (Gemini AI) and third-party services like authentication systems (Clerk, NextAuth) and payment gateways (Stripe, Razorpay).",
//       ],
//       finalScore: 35,
//       weaknesses: [
//         "Significant communication difficulties during the interview, making it challenging to understand explanations of technical concepts and project details.",
//         "Inability to articulate specific technical challenges faced during project development or provide structured explanations of architecture and implementation choices.",
//         "Lack of clarity in describing backend components and their specific contribution to the projects, beyond mentioning full-stack development.",
//       ],
//       skillsScore: 40,
//       knowledgeScore: 40,
//       communicationScore: 20,
//       hiringRecommendation: "No Hire",
//     },
//     created_at: "2026-01-04T11:24:27.689866+00:00",
//     interviews: {
//       id: "e73382fa-63b4-4ea8-94f2-e396c5915f2c",
//       title: "Software Engineer – Backend",
//       interview_type: "Technical",
//     },
//     transcript: [
//       {
//         role: "system",
//         content:
//           "You are an AI voice assistant conducting interviews.\n                          Your job is to ask candidates relevant interview questions based on their resume and the job description provided.\n\n                          **Context:**\n                          - Job Description: Acme Technologies Backend SWE\n                          - Candidate Name: Tanmay Rana\n                          - Candidate Resume Info: Candidate Resume Content:\nTanmay Rana \n9832525746 | tanmayrana2001@gmail.com | linkedin.com/in/tanmay-rana | github.com/TanmayRana \nSitanagar, Bajua, Hooghly, West Bengal - 712602 \nProfessional Summary \nFull-stack developer with expertise in building scalable AI-powered web applications using Next.js, React, and modern \ncloud technologies.  Proven ability to deliver production-ready SaaS platforms with 95% user satisfaction.  Proficient in \nintegrating AI models, authentication systems, and payment gateways to create comprehensive business solutions. \nEducation \nNew Horizon Col...",
//       },
//       {
//         role: "assistant",
//         content: "Hi. How are you? Ready for your interview on?",
//       },
//       {
//         role: "user",
//         content: "Alright. No.",
//       },
//       {
//         role: "assistant",
//         content:
//           "No worries, Tanmay. Let's ease into it. I'll guide you through, and we'll make this a productive session. Let's start with something simple. Can you walk me through your favorite project from your resume and explain the challenges you faced while building it?",
//       },
//       {
//         role: "user",
//         content:
//           "And, uh, I'm very pretty clear, uh, which has a string to this project is as soon used to this project to base on full step project, and this project I'm waited, but",
//       },
//       {
//         role: "assistant",
//         content: "No problem, Tenme.",
//       },
//       {
//         role: "user",
//         content:
//           "I'm creating a net basic Nexus. And, uh, And at I'm with the so many agents, uh, for this project. Uh, AI agents, uh, this AI agent here and putting her to index to agent clip and in the agent clip. And, uh, this uh, final end with the h AI agent, uh, this 1 meeting for this I am piece, uh, how to put the AI agent and, uh, buyer with giving Deepgram and how to pass the insert, criteria. And, uh, I am, uh, this time, I am it's it's so many websites, and it's and we visited the ID and This AI is in feature document is in the output. Create agents, how to integrate the data. Inside the AI engine.",
//       },
//       {
//         role: "assistant",
//         content:
//           "Great effort. It sounds like you've worked extensive with AI agents and integrating them into your projects, which is impressive. You mentioned using ingest in Gemini AI in your AI career coach agent project. Could you elaborate on how you integrated these AI models in your application and what specific functionalities they provided?",
//       },
//     ],
//   },
//   {
//     id: "573eaea6-d0cd-4f0f-8f8f-475cffa7cb45",
//     report: {
//       summary:
//         "The candidate presents a resume with relevant full-stack experience in modern frameworks and AI integration. However, the interview performance was severely hindered by a significant communication barrier. The candidate struggled to articulate project specifics, technical challenges, and implementation details coherently in English. This makes it challenging to accurately assess technical skills and domain knowledge. Due to the communication difficulties, the candidate is not suitable for a role requiring collaborative technical discussions.",
//       riskFlags: [
//         "Significant communication barrier in English, which will impede effective team collaboration and technical discussions.",
//         "Interview performance raises doubts about the depth of technical understanding beyond a surface level, as the candidate struggled to explain implementation details clearly.",
//       ],
//       strengths: [
//         "Resume indicates hands-on experience with modern technologies relevant to full-stack development, including Next.js, Node.js, and PostgreSQL.",
//         "Candidate has experience integrating AI models (Gemini AI) and third-party services like authentication systems (Clerk, NextAuth) and payment gateways (Stripe, Razorpay).",
//       ],
//       finalScore: 35,
//       weaknesses: [
//         "Significant communication difficulties during the interview, making it challenging to understand explanations of technical concepts and project details.",
//         "Inability to articulate specific technical challenges faced during project development or provide structured explanations of architecture and implementation choices.",
//         "Lack of clarity in describing backend components and their specific contribution to the projects, beyond mentioning full-stack development.",
//       ],
//       skillsScore: 40,
//       knowledgeScore: 40,
//       communicationScore: 20,
//       hiringRecommendation: "No Hire",
//     },
//     created_at: "2026-01-04T11:24:27.689866+00:00",
//     interviews: {
//       id: "e73382fa-63b4-4ea8-94f2-e396c5915f2c",
//       title: "Software Engineer – Backend",
//       interview_type: "Technical",
//     },
//     transcript: [
//       {
//         role: "system",
//         content:
//           "You are an AI voice assistant conducting interviews.\n                          Your job is to ask candidates relevant interview questions based on their resume and the job description provided.\n\n                          **Context:**\n                          - Job Description: Acme Technologies Backend SWE\n                          - Candidate Name: Tanmay Rana\n                          - Candidate Resume Info: Candidate Resume Content:\nTanmay Rana \n9832525746 | tanmayrana2001@gmail.com | linkedin.com/in/tanmay-rana | github.com/TanmayRana \nSitanagar, Bajua, Hooghly, West Bengal - 712602 \nProfessional Summary \nFull-stack developer with expertise in building scalable AI-powered web applications using Next.js, React, and modern \ncloud technologies.  Proven ability to deliver production-ready SaaS platforms with 95% user satisfaction.  Proficient in \nintegrating AI models, authentication systems, and payment gateways to create comprehensive business solutions. \nEducation \nNew Horizon Col...",
//       },
//       {
//         role: "assistant",
//         content: "Hi. How are you? Ready for your interview on?",
//       },
//       {
//         role: "user",
//         content: "Alright. No.",
//       },
//       {
//         role: "assistant",
//         content:
//           "No worries, Tanmay. Let's ease into it. I'll guide you through, and we'll make this a productive session. Let's start with something simple. Can you walk me through your favorite project from your resume and explain the challenges you faced while building it?",
//       },
//       {
//         role: "user",
//         content:
//           "And, uh, I'm very pretty clear, uh, which has a string to this project is as soon used to this project to base on full step project, and this project I'm waited, but",
//       },
//       {
//         role: "assistant",
//         content: "No problem, Tenme.",
//       },
//       {
//         role: "user",
//         content:
//           "I'm creating a net basic Nexus. And, uh, And at I'm with the so many agents, uh, for this project. Uh, AI agents, uh, this AI agent here and putting her to index to agent clip and in the agent clip. And, uh, this uh, final end with the h AI agent, uh, this 1 meeting for this I am piece, uh, how to put the AI agent and, uh, buyer with giving Deepgram and how to pass the insert, criteria. And, uh, I am, uh, this time, I am it's it's so many websites, and it's and we visited the ID and This AI is in feature document is in the output. Create agents, how to integrate the data. Inside the AI engine.",
//       },
//       {
//         role: "assistant",
//         content:
//           "Great effort. It sounds like you've worked extensive with AI agents and integrating them into your projects, which is impressive. You mentioned using ingest in Gemini AI in your AI career coach agent project. Could you elaborate on how you integrated these AI models in your application and what specific functionalities they provided?",
//       },
//     ],
//   },
// ];
// const resumeText = {
//   strengths: [
//     "Comprehensive and modern full-stack technical skill set, including trending areas like AI and robust cloud/DevOps tools.",
//     "Demonstrated ability to build, deploy, and manage production-ready applications with quantifiable user impact and satisfaction metrics.",
//     "Strong practical experience integrating complex features such as AI models, multiple authentication systems, and payment gateways.",
//     "Proactive learning and problem-solving skills, evidenced by diverse projects and dedicated LeetCode activity.",
//     "Excellent project descriptions clearly outlining technologies used, specific contributions, and measurable outcomes.",
//   ],
//   resumeText:
//     "Tanmay Rana \n9832525746 | tanmayrana2001@gmail.com | linkedin.com/in/tanmay-rana | github.com/TanmayRana \nSitanagar, Bajua, Hooghly, West Bengal - 712602 \nProfessional Summary \nFull-stack developer with expertise in building scalable AI-powered web applications using Next.js, React, and modern \ncloud technologies.  Proven ability to deliver production-ready SaaS platforms with 95% user satisfaction.  Proficient in \nintegrating AI models, authentication systems, and payment gateways to create comprehensive business solutions. \nEducation \nNew Horizon College of Engineering Bengaluru, Karnataka \nMaster of Computer Applications (MCA) 2024 – 2026 \nThe University of Burdwan Bardhaman, West Bengal \nBachelor of Computer Applications (BCA) – CGPA: 72% 2021 – 2024 \nTechnical Skills \nProgramming Languages :  JavaScript, Python, Java, SQL, HTML, CSS, C \nFrontend Technologies :  React.js, Next.js 15, Tailwind CSS, Bootstrap, Shadcn/ui \nBackend Technologies :  Node.js, Express.js, REST APIs, WebSocket, Django, Spring Boot \nDatabases & ORMs :  PostgreSQL, MongoDB, Supabase, Neon, Prisma, Drizzle ORM \nAI & Automation :  Gemini AI, Inngest, Inngest AgentKit \nAuthentication & Payments :  Clerk Auth, NextAuth.js, Razorpay, Stripe \nDevOps & Tools :  Git, GitHub, Docker, Vercel, Render \nProjects \nAI Career Coach Agent | Next.js, Tailwind CSS, Clerk, Neon DB, Inngest, Gemini AI | Live Demo January 2025 \n• \nEngineered full-stack AI-powered career coaching platform featuring Resume Analyzer, Cover Letter Generator, \nand Career Q&A chatbot serving 300+ active users with 95% satisfaction rate \n• \nIntegrated Inngest AI agents with Gemini AI model to deliver personalized career recommendations and real-time \nmarket insights, increasing user engagement by 3x \n• \nDeployed secure authentication using Clerk and built session tracking dashboard with Neon PostgreSQL, improving \nuser retention by 60% \n• \nDesigned responsive UI with Tailwind CSS and architected RESTful APIs for seamless data flow between frontend \nand backend services \nAI Interview Assistant | Next.js, Supabase, Gemini AI, Tailwind CSS | Live Demo \nNovember 2024 \n• \nConstructed intelligent interview platform for HR teams reducing candidate screening time by 70% and improving \nselection accuracy by 40% using Gemini AI-powered analysis \n• \nCreated comprehensive dashboard with interview creation, scheduling, history logs, and billing management \nfeatures, enhancing recruiter productivity by 2.5x \n• \nEstablished secure authentication with Supabase Auth and real-time data synchronization using Supabase \nPostgreSQL for interview storage and tracking \n• \nAutomated interview scoring system with natural language processing to evaluate candidate responses \nMicroCRM | Next.js 15, React 19, Prisma, PostgreSQL, NextAuth, Razorpay, Stripe | Live Demo November 2024 \n• \nSpearheaded enterprise-grade SaaS CRM system supporting 1,000+ customers per business with comprehensive \ncustomer, service, appointment, and invoice management capabilities \n• \nArchitected and executed 20+ RESTful API endpoints using Next.js API routes and Prisma ORM for scalable \ndatabase operations \n• \nLaunched calendar-based appointment scheduling system with automated reminders and integrated dual payment \ngateways (Razorpay and Stripe), reducing manual booking effort by 60% \n• \nDelivered analytics dashboard with real-time metrics for business insights, improving operational visibility by 40% \nAchievements & Certifications \nLeetCode :  Solved 150+ data structures and algorithms problems – leetcode.com/u/1NH24MC142 \nShipped and deployed 3+ production-ready full-stack applications with active user bases \nRelevant Coursework \nData Structures and Algorithms, Object-Oriented Programming, Database Management Systems, Software Engineering, \nWeb Development, Computer Networks, Operating Systems",
//   weaknesses: [
//     "No traditional full-time work experience (internships or jobs) is explicitly listed, which might be a factor for roles requiring prior professional experience.",
//     "While 72% CGPA for BCA is good, it isn't exceptionally high, though this is heavily offset by strong project work.",
//   ],
//   overallScore: 94,
//   overallRating: "Great",
//   skillsMatchScore: 95,
//   projectRelevanceScore: 98,
//   experienceSuitabilityScore: 90,
// };

export async function generatefeedbackanalysis(
  resumeData: any,
  feedbackData: any
): Promise<any> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-robotics-er-1.5-preview",
    }); // Use stable gemini-1.5-flash

    const prompt = `
        You are an expert Interview Analyst and Career Coach Agent. Your task is to perform a deep-dive analysis of a candidate by synthesizing their **Resume Data** and **Interview Feedback**.


       ====================
        RESUME DATA
        ====================
        ${JSON.stringify(resumeData, null, 2)}

        ====================
        INTERVIEW FEEDBACK DATA
        ====================
        ${JSON.stringify(feedbackData, null, 2)}

        Analyze the resume and interview feedback deeply.

        ### INSTRUCTIONS:
        1. Extract core data from the resume.
        2. Analyze the feedback for technical, behavioral, and communication patterns.
        3. Compare the resume claims against the interview reality.
        4. Provide specific coaching on **Communication** (tone, pace, clarity).
        5. Output the result in the strict JSON format below.

        ### OUTPUT FORMAT:
        You must output ONLY valid JSON. Do not include markdown formatting, introductions, or explanations. Use the exact schema below:

        {
        "resume_data_extraction": {
            "candidate_name": "String",
            "years_experience": "Number",
            "education": "String",
            "target_role": "String"
        },
        "feedback_analysis": {
            "summary": "String",
            "technical_rating": "String (Low/Med/High)",
            "behavioral_rating": "String (Low/Med/High)",
            "key_observations": ["Array of strings"]
        },
        "overall_assessment": {
            "hiring_status": "String (e.g., Strong Hire, Reject)",
            "match_score": "Number (0-100)",
            "verdict_summary": "String"
        },
        "skill_analysis": {
            "strengths": ["Array of validated skills"],
            "weaknesses": ["Array of struggling areas"],
            "soft_skills": ["Array of communication/culture notes"]
        },
        "resume_vs_reality": {
            "verified_claims": ["Resume points proven true"],
            "exaggerated_claims": ["Resume points proven weak"],
            "missing_skills": ["Skills expected but not found"]
        },
        "strategic_recommendations": {
            "resume_edits": ["Specific changes to the document"],
            "role_fit": ["Better suited job titles"],
            "study_focus": ["High priority topics"]
        },
        "actionable_tips_and_tricks": {
            "immediate_fixes": ["Quick behavioral/technical adjustments"],
            "interview_hacks": ["Psychological tricks to build rapport"]
        },
        "skilltips": {
            "coding_tips": ["Specific advice for their coding style"],
            "system_design_tips": ["Advice for architecture discussions"],
            "behavioral_tips": ["Advice for situational questions"]
        },
        "communication_coaching": {
            "verbal_delivery": ["Tips on tone, pace, volume, and filler words"],
            "structuring_answers": ["Tips on being concise vs detailed (e.g., Bottom Line Up Front)"]
        }
        }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response
      .text()
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating AI report:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to generate report: ${errorMessage}`);
  }
}
