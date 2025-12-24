"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AddCandidateModalProps {
  interviewId: string;
}

export function AddCandidateModal({ interviewId }: AddCandidateModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/interviews/${interviewId}/candidates?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAdd = async (usn: string) => {
    setIsAdding(usn);
    try {
      const res = await fetch(`/api/admin/interviews/${interviewId}/candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usn }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add candidate");
      }

      toast.success("Candidate added successfully");
      setResults(prev => prev.filter(r => r.usn !== usn));
      router.refresh();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to add candidate");
    } finally {
      setIsAdding(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Registered Candidate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSearch} className="flex gap-2 py-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or USN..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </Button>
        </form>

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {results.length > 0 ? (
            results.map((user) => (
              <div
                key={user.usn}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.usn} • {user.dept} • Batch {user.batch}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdd(user.usn)}
                  disabled={isAdding === user.usn}
                >
                  {isAdding === user.usn ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    "Add"
                  )}
                </Button>
              </div>
            ))
          ) : query && !isSearching ? (
            <p className="text-center py-4 text-muted-foreground text-sm">
              No matching registered users found.
            </p>
          ) : (
            <p className="text-center py-4 text-muted-foreground text-sm">
              Enter a name or USN to search for registered users not yet in this interview.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
