"use client";

import Link from "next/link";
import { useUsers, useDeleteUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UsersPage() {
  const { data, isLoading, isError } = useUsers();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Button asChild>
          <Link href="/users/new">New User</Link>
        </Button>
      </div>

      {isLoading && <p>Loading users…</p>}
      {isError && <p className="text-red-600">Failed to load users.</p>}

      {!!data?.length && (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Active</th>
                <th className="px-4 py-2 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">
                    <Link href={`/users/${u.id}`} className="underline">
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2">{u.active ? "Yes" : "No"}</td>
                  <td className="px-4 py-2 space-x-2">
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/users/${u.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={isDeleting}
                      onClick={() =>
                        deleteUser(u.id, {
                          onSuccess: () => toast.success("User deleted"),
                          onError: () => toast.error("Failed to delete user"),
                        })
                      }
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.length === 0 && <p>No users yet. Create one to get started.</p>}
    </main>
  );
}

