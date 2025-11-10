"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateUser } from "@/lib/api";
import { toast } from "sonner";

export default function NewUserPage() {
  const router = useRouter();
  const { mutateAsync: create, isPending } = useCreateUser();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    active: true,
    avatar: "",
    bio: "",
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!form.name || !form.email || !form.role) {
        toast.error("Name, Email and Role are required");
        return;
      }
      await create({
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
        phoneNumber: form.phoneNumber || undefined,
        avatar: form.avatar || undefined,
        bio: form.bio || undefined,
      });
      toast.success("User created");
      router.push("/users");
    } catch (err) {
      toast.error("Failed to create user");
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">New User</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input id="role" value={form.role} onChange={(e) => set("role", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone</Label>
            <Input id="phoneNumber" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input id="avatar" value={form.avatar} onChange={(e) => set("avatar", e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending}>Create</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}

