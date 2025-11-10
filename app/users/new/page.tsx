"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateUser } from "@/lib/api";
import { createUserSchema, type CreateUserInput } from "@/types/user";
import { toast } from "sonner";
import { useState } from "react";

import { motion } from "framer-motion";

export default function NewUserPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      role: "user",
      active: true,
      avatar: "",
      bio: "",
    },
  });
  const { mutateAsync: create, isPending } = useCreateUser();
  const [uploading, setUploading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  async function onSubmit(values: CreateUserInput) {
    try {
      let avatarUrl = values.avatar;
      if (avatarFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append("file", avatarFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) throw new Error("upload failed");
        const json = (await res.json()) as { url: string };
        avatarUrl = json.url;
        // also reflect in form state so UI shows the resulting URL
        setValue("avatar", avatarUrl, { shouldValidate: true });
      }

      await create({
        ...values,
        phoneNumber: values.phoneNumber || undefined,
        avatar: avatarUrl || undefined,
        bio: values.bio || undefined,
      });
      toast.success("User created");
      router.push("/users");
    } catch (e: unknown) {
      const errorMessage = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setAvatarFile(null);
    }
  }

  const active = watch("active");

  return (
    <main className="mx-auto max-w-2xl p-4 md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">New User</h1>
      <motion.form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar</Label>
          <div className="grid gap-2 md:grid-cols-2">
            <Input id="avatar" placeholder="https://..." {...register("avatar")} />
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
          {errors.avatar && <p className="text-sm text-red-600 dark:text-red-400">{errors.avatar.message as string}</p>}
          {uploading ? <p className="text-xs text-gray-500 dark:text-gray-400">Uploading...</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...register("email")} />
          {errors.email && <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select id="role" className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100" {...register("role")}> 
              <option value="admin">admin</option>
              <option value="editor">editor</option>
              <option value="user">user</option>
            </select>
            {errors.role && <p className="text-sm text-red-600 dark:text-red-400">{errors.role.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone</Label>
            <Input id="phoneNumber" {...register("phoneNumber")} />
            {errors.phoneNumber && <p className="text-sm text-red-600 dark:text-red-400">{errors.phoneNumber.message as string}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={4} {...register("bio")} />
          {errors.bio && <p className="text-sm text-red-600 dark:text-red-400">{errors.bio.message as string}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Switch id="active" checked={!!active} onCheckedChange={(v) => setValue("active", !!v)} />
          <Label htmlFor="active">Active</Label>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isPending || uploading}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                Creating…
              </span>
            ) : (
              "Create"
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </motion.form>
    </main>
  );
}
