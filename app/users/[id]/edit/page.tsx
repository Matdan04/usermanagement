"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateUser, useUser } from "@/lib/api";
import { toast } from "sonner";

export default function EditUserPage() {
  const params = useParams();
  const id = String(params?.id);
  const router = useRouter();
  const { data } = useUser(id);
  const { mutateAsync: update, isPending } = useUpdateUser(id);
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    active: true,
    avatar: "",
    bio: "",
  });

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        role: data.role || "",
        active: !!data.active,
        avatar: data.avatar || "",
        bio: data.bio || "",
      });
    }
  }, [data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      let avatarUrl = form.avatar;
      if (avatarFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", avatarFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("upload failed");
        const json = (await res.json()) as { url: string };
        avatarUrl = json.url;
        setForm((f) => ({ ...f, avatar: avatarUrl }));
      }
      await update({
        name: form.name,
        email: form.email,
        role: form.role,
        active: form.active,
        phoneNumber: form.phoneNumber || undefined,
        avatar: avatarUrl || undefined,
        bio: form.bio || undefined,
      });
      toast.success("User updated");
      router.push(`/users/${id}`);
    } catch {
      toast.error("Failed to update user");
    } finally {
      setUploading(false);
      setAvatarFile(null);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Edit User</h1>
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
          <Label htmlFor="avatar">Avatar</Label>
          <div className="grid gap-2 md:grid-cols-2">
            <Input id="avatar" value={form.avatar} onChange={(e) => set("avatar", e.target.value)} />
            <input
              id="avatarFile"
              type="file"
              accept="image/*"
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm file:mr-3 file:rounded file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setAvatarFile(file);
              }}
              disabled={uploading}
            />
          </div>
          {uploading ? <p className="text-xs text-gray-500 dark:text-gray-400">Uploading...</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Input id="bio" value={form.bio} onChange={(e) => set("bio", e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="active" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:focus:ring-blue-400" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending || uploading}>Save</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
