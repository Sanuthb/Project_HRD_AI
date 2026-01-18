'use client';

import { PlayCircle } from "lucide-react";
import { AdminRecordingPlayer } from "./AdminRecordingPlayer";

// ... inside component

  const [showResume, setShowResume] = useState(false);
  const [showRecording, setShowRecording] = useState(false);
  const interviewId = candidate.interview_ids?.[0] || "";

// ... inside DropdownMenuContent
          <DropdownMenuItem onClick={() => setShowResume(true)}>
            <FileText className="mr-2 h-4 w-4" />
            View Resume
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowRecording(true)}>
            <PlayCircle className="mr-2 h-4 w-4 text-blue-500" />
            View Recording
          </DropdownMenuItem>
          <DropdownMenuSeparator />

// ... inside render return (near ResumeViewer)
      {showResume && (
        <ResumeViewer 
          candidate={candidate} 
          open={showResume} 
          onOpenChange={setShowResume} 
        />
      )}
      
      {showRecording && (
        <AdminRecordingPlayer
          interviewId={interviewId}
          candidateId={candidate.id}
          candidateName={candidate.name}
          open={showRecording}
          onOpenChange={setShowRecording}
        />
      )}
    </>
  );
}
