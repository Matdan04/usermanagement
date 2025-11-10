"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUpdateUser, useUser } from "@/lib/api";
import { updateUserSchema, type UpdateUserInput } from "@/types/user";
import { toast } from "sonner";

export default function EditUserPage() {
  const params = useParams();
  const id = String(params?.id);
  const router = useRouter();
  const { data, isLoading, error } = useUser(id);
  const { mutateAsync: update, isPending } = useUpdateUser(id);

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = form;

  useEffect(() => {
    if (data) {
      reset({
        name: data.name ?? "",
        email: data.email ?? "",
        phoneNumber: data.phoneNumber ?? "",
        role: data.role ?? "user",
        active: !!data.active,
        avatar: data.avatar ?? "",
        bio: data.bio ?? "",
      });
    }
  }, [data, reset]);

  useEffect(() => {
    const status = (error as any)?.response?.status;
    if (status === 404) {
      toast.error("User not found. Create a new one.");
      router.replace("/users/new");
    }
  }, [error, router]);

  async function onSubmit(values: UpdateUserInput) {
    try {
      await update({
        name: values.name,
        email: values.email,
        role: values.role,
        active: values.active,
        phoneNumber: values.phoneNumber || undefined,
        avatar: values.avatar || undefined,
        bio: values.bio || undefined,
      }, {
        onError: (err: any) => {
          const status = err?.response?.status;
          if (status === 404) {
            toast.error("User was deleted. Create a new one.");
            router.replace("/users/new");
          } else {
            toast.error("Failed to update user");
          }
        },
      });
      toast.success("User updated");
      router.push("/users");
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 404) {
        toast.error("User was deleted. Create a new one.");
        router.replace("/users/new");
        return;
      }
      toast.error("Failed to update user");
    }
  }

  const active = watch("active");

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit User</h1>
        <Button variant="secondary" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar URL</Label>
          <Input id="avatar" placeholder="https://..." {...register("avatar")} />
          {errors.avatar && <p className="text-sm text-red-600 dark:text-red-400">{errors.avatar.message as string}</p>}
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
            {errors.role && <p className="text-sm text-red-600 dark:text-red-400">{errors.role.message as string}</p>}
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
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                Saving…
              </span>
            ) : (
              "Save"
            )}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </main>
  );
}
