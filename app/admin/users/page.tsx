"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  name: string;
  usn: string;
  email: string | null;
  batch: string | null;
  dept: string | null;
  interviewId: string | null;
  interviewTitle: string | null;
  hasAuthUser: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [usn, setUsn] = useState("");
  const [email, setEmail] = useState("");
  const [batch, setBatch] = useState("");
  const [dept, setDept] = useState("");

  const [filterBatch, setFilterBatch] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load users via API
        const res = await fetch("/api/admin/users");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load users");
        }
        const data = await res.json();
        setUsers(data.data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !usn.trim() || !email.trim()) {
      setError("Name, USN and Email are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          usn: usn.trim(),
          email: email.trim(),
          batch: batch.trim() || undefined,
          dept: dept.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create user");
      }

      const data = await res.json();
      const created: AdminUser = {
        ...(data.data.user as AdminUser),
        interviewTitle: data.data.user.interviewTitle || null,
      };

      setUsers((prev) => [created, ...prev]);

      toast.success(
        `User created. Temporary password: ${data.data.auth.tempPassword}`
      );

      setName("");
      setUsn("");
      setEmail("");
      setBatch("");
      setDept("");
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "Failed to create user");
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground">
          Add and manage candidate user accounts with batch and department filters.
        </p>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
          <AlertDescription className="text-red-800 dark:text-red-200">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="usn">USN</Label>
              <Input
                id="usn"
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="1NH20CS001"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="candidate@example.com"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Input
                id="batch"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                placeholder="2024"
                disabled={creating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept">Department</Label>
              <Input
                id="dept"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                placeholder="CSE"
                disabled={creating}
              />
            </div>
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            A Supabase Auth account will be created automatically. Temporary password
            is based on USN (e.g. <code>USN@123</code>).
          </p>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Users</CardTitle>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Filter by Batch
                </span>
                <select
                  className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                >
                  <option value="">All</option>
                  {Array.from(
                    new Set(users.map((u) => u.batch).filter(Boolean))
                  ).map((b) => (
                    <option key={b as string} value={b as string}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <span className="block text-xs font-medium text-muted-foreground">
                  Filter by Department
                </span>
                <select
                  className="w-40 rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                >
                  <option value="">All</option>
                  {Array.from(
                    new Set(users.map((u) => u.dept).filter(Boolean))
                  ).map((d) => (
                    <option key={d as string} value={d as string}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            let filtered = users;
            if (filterBatch) {
              filtered = filtered.filter((u) => u.batch === filterBatch);
            }
            if (filterDept) {
              filtered = filtered.filter((u) => u.dept === filterDept);
            }

            if (loading) {
              return (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading users...
                </div>
              );
            }

            if (filtered.length === 0) {
              return (
                <div className="py-8 text-center text-muted-foreground">
                  No users found. Create a user above or adjust filters.
                </div>
              );
            }

            return (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>USN</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Auth Account</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.usn}</TableCell>
                      <TableCell>{u.email || "-"}</TableCell>
                      <TableCell>{u.batch || "-"}</TableCell>
                      <TableCell>{u.dept || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={u.hasAuthUser ? "default" : "secondary"}
                        >
                          {u.hasAuthUser ? "Linked" : "No Account"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}


