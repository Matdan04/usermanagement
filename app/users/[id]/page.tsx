"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function UserDetailPage() {
  const params = useParams();
  const id = String(params?.id);
  const { data, isLoading, isError } = useUser(id);
  const router = useRouter();

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">User</h1>
        <div className="space-x-2">
          <Button asChild variant="secondary">
            <Link href={`/users/${id}/edit`}>Edit</Link>
          </Button>
          <Button variant="outline" onClick={() => router.push("/users")}>Back</Button>
        </div>
      </div>

      {isLoading && <p>Loading…</p>}
      {isError && <p className="text-red-600">Failed to load user.</p>}
      {data && (
        <div className="space-y-2 rounded-md border p-4">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="text-base">{data.name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="text-base">{data.email}</div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">Role</div>
              <div className="text-base">{data.role}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Active</div>
              <div className="text-base">{data.active ? "Yes" : "No"}</div>
            </div>
          </div>
          {data.phoneNumber && (
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="text-base">{data.phoneNumber}</div>
            </div>
          )}
          {data.avatar && (
            <div>
              <div className="text-sm text-gray-500">Avatar</div>
              <div className="text-base break-all">{data.avatar}</div>
            </div>
          )}
          {data.bio && (
            <div>
              <div className="text-sm text-gray-500">Bio</div>
              <div className="text-base">{data.bio}</div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

