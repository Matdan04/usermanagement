"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { User } from "@/types/user";

type SortBy = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  isError: boolean;
  selected: Record<string, boolean>;
  syncingIds: Record<string, boolean>;
  allSelected: boolean;
  sortBy: SortBy;
  order: SortOrder;
  isFetching: number;
  total: number;
  onToggleAll: () => void;
  onToggleOne: (id: string) => void;
  onDelete: (id: string) => void;
  onSort: (column: SortBy) => void;
}

export function UserTable({
  users,
  isLoading,
  isError,
  selected,
  syncingIds,
  allSelected,
  sortBy,
  order,
  isFetching,
  total,
  onToggleAll,
  onToggleOne,
  onDelete,
  onSort,
}: UserTableProps) {
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
    <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Table className="hidden md:table">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <input 
                type="checkbox" 
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-500 dark:bg-slate-700 dark:focus:ring-blue-400" 
                checked={allSelected} 
                onChange={onToggleAll} 
                aria-label="Select all" 
              />
            </TableHead>
            <TableHead>Avatar</TableHead>
            <TableHead 
              className="cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-slate-800"
              onClick={() => onSort("name")}
            >
              <div className="flex items-center">
                Name
                {getSortIcon("name")}
              </div>
            </TableHead>
            <TableHead 
              className="cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-slate-800"
              onClick={() => onSort("email")}
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
              onClick={() => onSort("createdAt")}
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
                  onChange={() => onToggleOne(u.id)}
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
                <span className={u.active ? "font-medium text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>
                  {u.active ? "Active" : "Inactive"}
                </span>
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
                    onClick={() => onDelete(u.id)}
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
          Showing {users.length} of {total} users
          {isFetching ? <span className="ml-2 text-gray-500">(syncing…)</span> : null}
        </TableCaption>
      </Table>
    </div>
  );
}

