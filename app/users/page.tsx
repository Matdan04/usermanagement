"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers, useDeleteUser } from "@/lib/api";
import { toast } from "sonner";

type SortBy = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";

function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const debouncedSearch = useDebounced(search, 300);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: role || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy,
      order,
    }),
    [debouncedSearch, role, dateFrom, dateTo, sortBy, order]
  );

  const { data, isLoading, isError, refetch } = useUsers(queryParams);
  const { mutate: deleteUser, isPending: deleting } = useDeleteUser();
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});

  const allSelected = useMemo(() => {
    if (!data?.length) return false;
    return data.every((u) => selected[u.id]);
  }, [data, selected]);

  function toggleAll() {
    if (!data) return;
    if (allSelected) {
      const cleared: Record<string, boolean> = {};
      setSelected(cleared);
    } else {
      const next: Record<string, boolean> = {};
      for (const u of data) next[u.id] = true;
      setSelected(next);
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  async function bulkDelete() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} user(s)?`)) return;
    ids.forEach((id) => {
      setSyncingIds((s) => ({ ...s, [id]: true }));
      deleteUser(id, {
        onSuccess: () => {
          // success toast per id might be noisy; keep one at end via settle check
        },
        onError: () => {
          toast.error(`Failed to delete user`);
        },
        onSettled: () => {
          setSyncingIds((s) => {
            const n = { ...s };
            delete n[id];
            return n;
          });
        },
      });
    });
    toast.success("Deletion requested – syncing…");
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Users</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button asChild>
            <Link href="/users/new">New User</Link>
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <Input
            placeholder="Search name or email"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <select className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">admin</option>
            <option value="editor">editor</option>
            <option value="user">user</option>
          </select>
        </div>
        <div>
          <input type="date" className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div>
          <input type="date" className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <select
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
        >
          <option value="name">Sort by Name</option>
          <option value="email">Sort by Email</option>
          <option value="createdAt">Sort by Created</option>
        </select>
        <select
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm"
          value={order}
          onChange={(e) => setOrder(e.target.value as SortOrder)}
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>
        <Button variant="destructive" onClick={bulkDelete} disabled={deleting}>
          Bulk Delete
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </TableHead>
              <TableHead>Avatar</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Creation Date</TableHead>
              <TableHead>Bio</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`s-${i}`}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                </TableRow>
              ))}

            {isError && (
              <TableRow>
                <TableCell colSpan={10}>
                  <div className="p-4 text-red-600">Failed to load users.</div>
                </TableCell>
              </TableRow>
            )}

            {!isLoading && data?.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <div className="p-4">No users found.</div>
                </TableCell>
              </TableRow>
            )}

            {data?.map((u) => (
              <TableRow key={u.id} data-state={selected[u.id] ? "selected" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={!!selected[u.id]}
                    onChange={() => toggleOne(u.id)}
                    aria-label={`Select ${u.name}`}
                  />
                </TableCell>
                <TableCell>
                  {u.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u.avatar} alt={u.name} className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium">
                      {u.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/users/${u.id}`} className="underline">
                    {u.name}
                  </Link>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phoneNumber || "-"}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <span className={u.active ? "text-green-700" : "text-gray-500"}>{u.active ? "Active" : "Inactive"}</span>
                </TableCell>
                <TableCell>{u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd") : ""}</TableCell>
                <TableCell>
                  {u.bio ? (u.bio.length > 60 ? `${u.bio.slice(0, 57)}...` : u.bio) : "-"}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/users/${u.id}/edit`}>Edit</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (!confirm("Delete this user?")) return;
                      setSyncingIds((s) => ({ ...s, [u.id]: true }));
                      deleteUser(u.id, {
                        onSuccess: () => toast.success("User deleted"),
                        onError: () => toast.error("Failed to delete"),
                        onSettled: () =>
                          setSyncingIds((s) => {
                            const n = { ...s };
                            delete n[u.id];
                            return n;
                          }),
                      });
                    }}
                  >
                    {syncingIds[u.id] ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                        Syncing
                      </span>
                    ) : (
                      "Delete"
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>Showing {data?.length ?? 0} users</TableCaption>
        </Table>
      </div>
    </main>
  );
}
