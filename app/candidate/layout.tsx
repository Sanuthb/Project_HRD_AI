"use client";

import { Sidebar } from "@/components/sidebar";
import { LayoutDashboard, Upload } from "lucide-react";
import { useContext } from "react";
import { InterviewContext } from "@/lib/contexts/InterviewContext";

const candidateLinks = [
  {
    href: "/candidate/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
];

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const interviewContext = useContext(InterviewContext);
  const isInterviewing = interviewContext?.isInterviewing;

  return (
    <div className="flex min-h-screen">
      {!isInterviewing && (
        <Sidebar links={candidateLinks} title="Candidate Portal" />
      )}
      <main className={`flex-1 ${!isInterviewing ? "lg:pl-64" : ""}`}>
        <div className={`container mx-auto ${!isInterviewing ? "p-6 lg:p-8" : "p-0"}`}>
          {children}
        </div>
      </main>
    </div>
  );
}

