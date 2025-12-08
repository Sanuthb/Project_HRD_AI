import { Sidebar } from "@/components/sidebar";
import { LayoutDashboard, FileText, PlusCircle } from "lucide-react";

const adminLinks = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    href: "/admin/create-interview",
    label: "Create Interview",
    icon: <PlusCircle className="h-4 w-4" />,
  },
  {
    href: "/admin/interviews",
    label: "Interviews",
    icon: <FileText className="h-4 w-4" />,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminLinks} title="Admin Panel" />
      <main className="flex-1 lg:pl-64">
        <div className="container mx-auto p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

