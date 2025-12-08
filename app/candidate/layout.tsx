import { Sidebar } from "@/components/sidebar";
import { LayoutDashboard, Upload } from "lucide-react";

const candidateLinks = [
  {
    href: "/candidate/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/candidate/resume-upload",
    label: "Upload Resume",
    icon: <Upload className="h-4 w-4" />,
  },
];

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar links={candidateLinks} title="Candidate Portal" />
      <main className="flex-1 lg:pl-64">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

