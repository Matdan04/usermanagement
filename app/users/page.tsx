"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Download, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useUsers, useDeleteUser, useCreateUser } from "@/lib/api";
import { useIsFetching } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateUserInput, User } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const debouncedSearch = useDebounced(search, 300);

  const queryParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      role: role || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sortBy,
      order,
      page,
      perPage,
    }),
    [debouncedSearch, role, dateFrom, dateTo, sortBy, order, page, perPage]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, dateFrom, dateTo, sortBy, order, perPage]);

  const { data, isLoading, isError, refetch } = useUsers(queryParams);
  const { mutate, mutateAsync, isPending: deleting } = useDeleteUser();
  const { mutateAsync: createAsync } = useCreateUser();
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});
  const isFetching = useIsFetching();
  const [downloading, setDownloading] = useState(false);
  const bulkRunningRef = useRef(false);
  const undoTimerRef = useRef<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pendingUndo, setPendingUndo] = useState<{
    users: CreateUserInput[];
    expiresAt: number;
  } | null>(null);

  const STORAGE_KEY = "users_bulk_delete_pending";

  // Load pending undo from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { users: CreateUserInput[]; expiresAt: number };
      const remaining = parsed.expiresAt - Date.now();
      if (remaining > 0) {
        setPendingUndo(parsed);
        showUndoToast(parsed.users, remaining);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clearUndoTimer() {
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }

  function finalizePendingUndo() {
    clearUndoTimer();
    setPendingUndo(null);
    if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
    toast.message("Deletion finalized");
  }

  async function handleDownload() {
    try {
      setDownloading(true);
      const res = await fetch("/api/users/export");
      if (!res.ok) {
        throw new Error("Failed to export");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (e) {
      toast.error("Failed to download CSV");
    } finally {
      setDownloading(false);
    }
  }

  function showUndoToast(usersToRestore: CreateUserInput[], duration = 5000) {
    clearUndoTimer();
    undoTimerRef.current = window.setTimeout(() => finalizePendingUndo(), duration) as unknown as number;
    toast.success("Users deleted — Undo?", {
      duration,
      action: {
        label: "Undo",
        onClick: async () => {
          clearUndoTimer();
          try {
            for (const u of usersToRestore) {
              // eslint-disable-next-line no-await-in-loop
              await createAsync({
                ...u,
                phoneNumber: u.phoneNumber || undefined,
                avatar: u.avatar || undefined,
                bio: u.bio || undefined,
              });
            }
            toast.success("Users restored");
          } catch {
            toast.error("Failed to restore some users");
          } finally {
            setPendingUndo(null);
            if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
          }
        },
      },
    });
  }

  const users: User[] = data?.data || [];
  const pagination = data?.pagination;

  const allSelected = useMemo(() => {
    if (!users?.length) return false;
    return users.every((u: User) => selected[u.id]);
  }, [users, selected]);

  // Analytics derived from current data set
  const roleData = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u: User) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return Object.entries(counts).map(([role, count]) => ({ role, count }));
  }, [users]);

  const activeData = useMemo(() => {
    let active = 0;
    let inactive = 0;
    users.forEach((u: User) => (u.active ? active++ : inactive++));
    return [
      { name: "Active", value: active },
      { name: "Inactive", value: inactive },
    ];
  }, [users]);

  const lineData = useMemo(() => {
    const byDate: Record<string, number> = {};
    users.forEach((u: User) => {
      const d = u.createdAt ? new Date(u.createdAt) : null;
      if (!d || Number.isNaN(d.getTime())) return;
      const key = d.toISOString().slice(0, 10);
      byDate[key] = (byDate[key] || 0) + 1;
    });
    return Object.entries(byDate)
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, count]) => ({ date, count }));
  }, [users]);

  function toggleAll() {
    if (!users.length) return;
    if (allSelected) {
      const cleared: Record<string, boolean> = {};
      setSelected(cleared);
    } else {
      const next: Record<string, boolean> = {};
      for (const u of users) next[u.id] = true;
      setSelected(next);
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function initiateBulkDelete() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (ids.length === 0) return;
    if (bulkRunningRef.current) {
      toast.message("Bulk delete already in progress");
      return;
    }
    setBulkDeleteDialogOpen(true);
  }

  async function confirmBulkDelete() {
    const ids = Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
    bulkRunningRef.current = true;
    try {
      // snapshot users to allow undo (recreate via POST)
      const toRestore: CreateUserInput[] = users
        .filter((u: User) => ids.includes(u.id))
        .map((u: User) => ({
          name: u.name,
          email: u.email,
          role: u.role,
          active: u.active,
          phoneNumber: u.phoneNumber || undefined,
          avatar: u.avatar || undefined,
          bio: u.bio || undefined,
        }));
      for (const id of ids) {
        setSyncingIds((s) => ({ ...s, [id]: true }));
        try {
          await mutateAsync(id);
        } catch {
          toast.error("Failed to delete a user; rolled back");
        } finally {
          setSyncingIds((s) => {
            const n = { ...s };
            delete n[id];
            return n;
          });
        }
      }
      const expiresAt = Date.now() + 5000;
      const pending = { users: toRestore, expiresAt };
      setPendingUndo(pending);
      if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
      showUndoToast(toRestore, 5000);
      setSelected({});
    } finally {
      bulkRunningRef.current = false;
    }
  }

  function initiateDelete(userId: string) {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (!userToDelete) return;
    setSyncingIds((s) => ({ ...s, [userToDelete]: true }));
    mutate(userToDelete, {
      onSuccess: () => toast.success("User deleted"),
      onError: () => toast.error("Failed to delete"),
      onSettled: () =>
        setSyncingIds((s) => {
          const n = { ...s };
          delete n[userToDelete];
          return n;
        }),
    });
    setUserToDelete(null);
  }

  function handleHeaderSort(column: SortBy) {
    if (sortBy === column) {
      // Toggle order if clicking the same column
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending
      setSortBy(column);
      setOrder("asc");
    }
  }

  function getSortIcon(column: SortBy) {
    if (sortBy !== column) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-gray-400" />;
    }
    return order === "asc" ? (
      <ChevronUp className="ml-1 h-4 w-4 text-blue-600 dark:text-blue-400" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 text-blue-600 dark:text-blue-400" />
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isLoading}>
            Refresh
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={downloading || isLoading}>
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Downloading..." : "Download CSV"}
          </Button>
          <Button asChild>
            <Link href="/users/new">New User</Link>
          </Button>
        </div>
      </div>

      {/* Analytics */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="role" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ReTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                    <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active vs Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ReTooltip />
                    <Pie data={activeData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={4}>
                      {activeData.map((_, idx) => (
                        <Cell key={`c-${idx}`} fill={idx === 0 ? "#22c55e" : "#e5e7eb"} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registrations Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="currentColor" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <ReTooltip />
                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
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
          <select className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="admin">admin</option>
            <option value="editor">editor</option>
            <option value="user">user</option>
          </select>
        </div>
        <div>
          <input type="date" className="date-input h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From date" />
        </div>
        <div>
          <input type="date" className="date-input h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To date" />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={initiateBulkDelete} disabled={deleting}>
            Bulk Delete
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">Per page:</span>
          <select
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-700 dark:focus:ring-blue-400" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
              </TableHead>
              <TableHead>Avatar</TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-slate-800"
                onClick={() => handleHeaderSort("name")}
              >
                <div className="flex items-center">
                  Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-slate-800"
                onClick={() => handleHeaderSort("email")}
              >
                <div className="flex items-center">
                  Email
                  {getSortIcon("email")}
                </div>
              </TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead 
                className="cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-slate-800"
                onClick={() => handleHeaderSort("createdAt")}
              >
                <div className="flex items-center">
                  Creation Date
                  {getSortIcon("createdAt")}
                </div>
              </TableHead>
              <TableHead>Bio</TableHead>
              <TableHead className="w-48">Actions</TableHead>
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

            {!isLoading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <div className="p-4">No users found.</div>
                </TableCell>
              </TableRow>
            )}

            {users.map((u: User) => (
              <TableRow key={u.id} data-state={selected[u.id] ? "selected" : undefined}>
                <TableCell>
                  <input
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-700 dark:focus:ring-blue-400"
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-xs font-semibold text-white shadow-sm">
                      {u.name?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Link href={`/users/${u.id}`} className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    {u.name}
                  </Link>
                </TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.phoneNumber || "-"}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>
                  <span className={u.active ? "font-medium text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>{u.active ? "Active" : "Inactive"}</span>
                </TableCell>
                <TableCell>{u.createdAt ? format(new Date(u.createdAt), "yyyy-MM-dd") : ""}</TableCell>
                <TableCell>
                  {u.bio ? (u.bio.length > 60 ? `${u.bio.slice(0, 57)}...` : u.bio) : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button asChild size="sm" variant="secondary" className="min-w-[60px]">
                      <Link href={`/users/${u.id}/edit`}>Edit</Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="min-w-[70px]"
                      onClick={() => initiateDelete(u.id)}
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
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>
            Showing {users.length} of {pagination?.total ?? 0} users
            {isFetching ? <span className="ml-2 text-gray-500">(syncing…)</span> : null}
          </TableCaption>
        </Table>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">Show per page:</span>
            <select
              className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              value={perPage}
              onChange={(e) => setPerPage(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Page {page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(pagination.totalPages)}
              disabled={page === pagination.totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialogs */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        variant="destructive"
      />

      <ConfirmationDialog
        open={bulkDeleteDialogOpen}
        onOpenChange={setBulkDeleteDialogOpen}
        title="Delete Multiple Users"
        description={`Are you sure you want to delete ${
          Object.entries(selected).filter(([, v]) => v).length
        } user(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmBulkDelete}
        variant="destructive"
      />
    </main>
  );
}
