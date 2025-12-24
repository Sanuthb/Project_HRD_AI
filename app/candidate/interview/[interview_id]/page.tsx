"use client";

import { useContext, useEffect, useRef, useState } from "react";
// import { InterviewContext } from "@/context/InterviewContext";
// import { supabase } from "@/services/superbaseClient";
import { useParams, useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { toast } from "sonner";
import axios from "axios";
import { 
  getCandidateByUserId, 
  getCandidateByUSN,
  markMalpractice
} from "@/lib/services/candidates";
import { getInterviewById } from "@/lib/services/interviews";
import { useAuth } from "@/lib/contexts/auth-context";
import { Candidate, Interview } from "@/lib/types";

import {
  Phone,
  Video,
  VideoOff,
  Mic,
  MicOff,
  BotMessageSquare,
} from "lucide-react";
import AlertConfirmation from "../../../../components/AlertConfirmation";
import { InterviewContext } from "@/lib/contexts/InterviewContext";
import { supabase } from "@/lib/supabase/client";
// import AlertConfirmation from "./_components/AlertConfirmation";

export default function Page() {
  const { user } = useAuth();
  const interviewContext = useContext(InterviewContext);

  const interviewdata = interviewContext?.interviewdata ?? {
    Username: "",
    jobposition: "",
    questionlist: [],
  };

  console.log("interviewdata=", interviewdata);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const handlersRef = useRef<Record<string, unknown>>({});
  const timerRef = useRef<number | null>(null);

  const transcriptRef = useRef<unknown[]>([]);
  const hasEndedRef = useRef<boolean>(false);
  const hasSavedRef = useRef<boolean>(false);
  const conversationBuffer = useRef<any[] | null>(null);

  const { interview_id } = useParams<{ interview_id: string | string[] }>();
  const router = useRouter();

  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [callActive, setCallActive] = useState<boolean>(false);
  const [transcriptDump, setTranscriptDump] = useState<any[]>([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeUser, setActiveUser] = useState(true);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<any[]>([]);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [resumeText, setResumeText] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id || !interview_id) return;
      
      const normalizedInterviewId = Array.isArray(interview_id)
        ? interview_id[0]
        : interview_id;

      try {
        const [candData, intData] = await Promise.all([
          getCandidateByUserId(user.id),
          getInterviewById(normalizedInterviewId)
        ]);

        if (candData) setCandidate(candData);
        if (intData) setInterview(intData);

        // Update InterviewContext with dynamic data
        if (candData && (intData || interviewdata)) {
          interviewContext?.setinterviewdata({
            Username: candData.name,
            jobposition: intData?.title || interviewdata.jobposition,
            questionlist: [] // Force empty as requested
          });
        }

        // If we have a resume URL, we might want to fetch the text if stored separately
        // For now, we'll assume the system prompt can be enhanced with what we have.
      } catch (err) {
        console.error("Error fetching context data:", err);
      }
    };

    fetchData();
  }, [user?.id, interview_id]);

  // -------------------------------------------
  // 💡 Enable Camera + Mic (like Google Meet)
  // -------------------------------------------
  const enableMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      setCameraEnabled(true);
      setMicEnabled(true);

      return true;
    } catch (err) {
      console.error("Media permission error:", err);
      toast.error(
        "Please enable camera and microphone to start the interview."
      );
      return false;
    }
  };

  // Disable stream
  const disableMedia = () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) videoRef.current.srcObject = null;

      setCameraEnabled(false);
      setMicEnabled(false);
    } catch (err) {
      console.log("Failed to disable camera/mic:", err);
    }
  };

  const startCall = async () => {
    const vapi = vapiRef.current;

    // Ensure camera & mic permissions and video stream
    const mediaAllowed = await enableMedia();
    if (!mediaAllowed) {
      toast.error("Camera & Mic are required to start the interview.");
      setInterviewStarted(false);
      return;
    }

    const questionList =
      interviewdata?.questionlist?.map((q) => q.question).join(", ") || "";

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${interviewdata?.Username}, how are you? Ready for your interview on ${interviewdata?.jobposition}?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "playht",
        voiceId: "jennifer",
      },
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `
                          You are an AI voice assistant conducting interviews.
                          Your job is to ask candidates relevant interview questions based on their resume and the job description provided.

                          **Context:**
                          - Job Description: ${interview?.jd_text || interview?.jd_name || interviewdata?.jobposition}
                          - Candidate Name: ${candidate?.name || interviewdata?.Username}
                          - Candidate Resume Text/Info: ${candidate?.resume_url ? `Available at ${candidate.resume_url}. Use the candidate's background to tailor questions.` : "No resume provided. Focus on the job description."}

                          **Instructions:**
                          1. Begin with a friendly, professional introduction.
                          2. Analyze the Job Description and the Candidate's Resume.
                          3. Generate 5-7 strictly relevant interview questions.
                          4. Ask one question at a time and wait for the candidate's response.
                          5. Provide encouraging feedback and ask follow-up questions if needed.
                          6. If the candidate struggles, offer helpful hints.
                          
                          Key Guidelines:
                          - Be friendly, engaging, and witty
                          - Keep responses short and natural
                          - Ensure the interview remains focused on high-quality technical or behavioral assessment suited for the role.
                        `.trim(),
          },
        ],
      },
    };

    try {
      if (!vapi) {
        throw new Error("Vapi client is not initialized.");
      }
      // Cast options to relax strict DTO type requirements while keeping runtime shape
      await vapi.start(assistantOptions as any);
    } catch (error) {
      const err = error as { message?: string };
      const msg = `Could not start the interview: ${
        err.message || "Unknown error"
      }`;
      toast.error(msg);
      setCallError(msg);
      setInterviewStarted(false);
    }
  };

  const GenerateFeedback = async (conversationData: any) => {
    try {
      if (
        !conversationData ||
        !Array.isArray(conversationData) ||
        conversationData.length === 0
      ) {
        toast.error("No conversation data available to generate feedback.");
        return;
      }

      const normalizedInterviewId = Array.isArray(interview_id)
        ? interview_id[0]
        : interview_id;
      const numericInterviewId = Number(normalizedInterviewId);

      if (!numericInterviewId || Number.isNaN(numericInterviewId)) {
        toast.error("Invalid interview id. Could not save feedback.");
        return;
      }

      if (!interviewdata.Username || !interviewdata.jobposition) {
        toast.error(
          "Interview information is incomplete. Could not save feedback."
        );
        return;
      }

      const result = await axios.post("/api/ai-feedback", {
        conversation: conversationData,
        candidateId: candidate?.id,
        interviewId: numericInterviewId,
      });

      if (result.data.success) {
        toast.success("Interview report generated and saved successfully.");
        disableMedia();
        if (timerRef.current !== null) {
          clearInterval(timerRef.current);
        }
        router.push("/candidate/dashboard"); // Redirect to dashboard or appropriate page
      } else {
        throw new Error("Failed to generate/save report");
      }
    } catch (err) {
      const e = err as { message?: string };
      console.error("Error generating feedback:", e.message || err);
      toast.error("Failed to generate feedback.");
    }
  };

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;

    if (!publicKey) {
      console.error("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY for Vapi client.");
      toast.error("Interview service is not configured correctly.");
      return;
    }

    const vapi = new Vapi(publicKey);
    vapiRef.current = vapi;

    const handleCallStart = () => {
      console.log("Vapi: Call has started.");
      toast.success("Interview has started.");
      setElapsedTime(0); // reset timer
      timerRef.current = window.setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    };

    const handleSpeechStart = () => setActiveUser(false);
    const handleSpeechEnd = () => setActiveUser(true);

    const handleCallEnd = () => {
      console.log("Vapi: Call has ended.");
      toast("Interview has ended.");
      setInterviewStarted(false);
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }

      setTimeout(() => {
        if (hasSavedRef.current) return;

        const runGenerate = (data: unknown) => {
          if (!Array.isArray(data)) return;
          if (!data || hasSavedRef.current) return;
          hasSavedRef.current = true;
          setConversation(data);
          console.log("Conversation saved successfully:", data);
          // GenerateFeedback(data);
        };

        if (conversationBuffer.current) {
          runGenerate(conversationBuffer.current);
        } else {
          console.warn("Conversation not yet populated, retrying...");
          setTimeout(() => {
            if (conversationBuffer.current) {
              runGenerate(conversationBuffer.current);
            } else {
              toast.error("Failed to retrieve conversation history.");
            }
          }, 1500);
        }
      }, 1000);
    };

    const handleMessage = (message: { conversation?: any[] }) => {
      console.log("Vapi message conversation=", message?.conversation);
      if (message?.conversation) {
        conversationBuffer.current = message.conversation;
      }
    };

    const handleError = (error: { errorMsg?: string; message?: string }) => {
      console.error("Vapi error:", error);

      const rawMsg = error?.errorMsg || error?.message || "";
      const lowerMsg = rawMsg.toLowerCase();

      // If Vapi says the meeting has ended, treat it as a graceful end
      if (lowerMsg.includes("meeting has ended")) {
        handleCallEnd();
        return;
      }

      const msg = `Vapi Error: ${rawMsg || "An unknown error occurred"}`;
      setCallError(msg);
      toast.error(msg);
      setInterviewStarted(false);
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };

    vapi.on("call-start", handleCallStart);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("call-end", handleCallEnd);
    vapi.on("message", handleMessage);
    vapi.on("error", handleError);

    // Full-screen Malpractice Detection
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement && interviewStarted && !hasEndedRef.current) {
        // If interview is active and they exit full screen
        handleStopInterview();
        if (candidate?.id) {
          markMalpractice(candidate.id);
          toast.error("Malpractice Detected: You exited full-screen mode. Interview ended.");
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullScreenChange);

    return () => {
      vapi.off("call-start", handleCallStart);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-end", handleCallEnd);
      vapi.off("message", handleMessage);
      vapi.off("error", handleError);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [candidate?.id, interviewStarted]);

  const handleStartInterview = () => {
    console.log("vapiRef.current1=", vapiRef.current);

    if (vapiRef.current) {
      console.log("vapiRef.current 2=", vapiRef.current);

      // Enter Full Screen
      const element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.error("Fullscreen request failed:", err);
          toast.error("Please enable full-screen to start the interview.");
        });
      }

      interviewContext?.setIsInterviewing(true);
      setInterviewStarted(true);
      setCallError(null);
      startCall();
    } else {
      const errorMessage =
        "Interview service is not ready. Please refresh the page or try again.";
      toast.error(errorMessage);
      setCallError(errorMessage);
    }
  };

  const handleStopInterview = () => {
    try {
      setLoading(true);
      vapiRef.current?.stop();
      setInterviewStarted(false);
      interviewContext?.setIsInterviewing(false);
      setCallError(null);
      disableMedia();
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    } catch (error: any) {
      const msg = `Error stopping the interview: ${
        error.message || "Unknown error"
      }`;
      toast.error(msg);
      setCallError(msg);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------
  // UI (Google Meet / Zoom Style)
  // -------------------------------------------
  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white">
      {/* TOP BAR */}
      <div className="h-14 bg-black/40 flex items-center justify-between px-6 shadow-lg">
        <h2 className="text-xl font-semibold">
          AI Interview for {interviewdata?.jobposition}
        </h2>
      </div>

      {/* MAIN GRID */}
      <div className="flex-1 grid grid-cols-2 gap-6 p-6">
        {/* AI PANEL */}
        <div className="relative bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
          <div className="bg-gray-900 p-6 rounded-full shadow-xl">
            <BotMessageSquare size={90} className="text-amber-400" />
          </div>
          <span className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded">
            AI Interviewer
          </span>
        </div>

        {/* VIDEO PANEL */}
        <div className="relative bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded">
            {interviewdata?.Username}
          </span>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="h-20 bg-black/40 flex items-center justify-center gap-6">
        {/* MIC TOGGLE */}
        <button
          className={`p-4 rounded-full ${
            micEnabled ? "bg-gray-700" : "bg-red-600"
          }`}
          onClick={() => {
            setMicEnabled(!micEnabled);
            enableMedia();
          }}
        >
          {micEnabled ? <Mic /> : <MicOff />}
        </button>

        {/* CAMERA TOGGLE */}
        <button
          className={`p-4 rounded-full ${
            cameraEnabled ? "bg-gray-700" : "bg-red-600"
          }`}
          onClick={() => {
            setCameraEnabled(!cameraEnabled);
            enableMedia();
          }}
        >
          {cameraEnabled ? <Video /> : <VideoOff />}
        </button>

        {!interviewStarted ? (
          <button
            onClick={handleStartInterview}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Interview
          </button>
        ) : (
          // stop interview
          <AlertConfirmation stopinterview={handleStopInterview}>
            <div className="p-4 rounded-full bg-red-600 hover:bg-red-700">
              <Phone />
            </div>
          </AlertConfirmation>
        )}
      </div>
    </div>
  );
}
