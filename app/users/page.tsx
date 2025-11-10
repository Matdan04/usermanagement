"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useUsers } from "@/lib/api";
import { useIsFetching } from "@tanstack/react-query";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { UserAnalytics } from "@/components/users/user-analytics";
import { UserFilters } from "@/components/users/user-filters";
import { UserTable } from "@/components/users/user-table";
import { UserMobileCards } from "@/components/users/user-mobile-cards";
import { PaginationControls } from "@/components/users/pagination-controls";
import { useDebounced } from "@/hooks/use-debounced";
import { useUserSelection } from "@/hooks/use-user-selection";
import { useBulkDelete } from "@/hooks/use-bulk-delete";

type SortBy = "name" | "email" | "createdAt";
type SortOrder = "asc" | "desc";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("createdAt");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [downloading, setDownloading] = useState(false);

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
  const isFetching = useIsFetching();
  const { syncingIds, executeBulkDelete, executeSingleDelete } = useBulkDelete();

  const users = data?.data || [];
  const pagination = data?.pagination;
  const { selected, allSelected, selectedIds, toggleAll, toggleOne, clearSelection } = useUserSelection(users);

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
    } catch {
      toast.error("Failed to download CSV");
    } finally {
      setDownloading(false);
    }
  }

  function initiateBulkDelete() {
    if (selectedIds.length === 0) {
      toast.message("No users selected");
      return;
    }
    setBulkDeleteDialogOpen(true);
  }

  async function confirmBulkDelete() {
    await executeBulkDelete(selectedIds, users);
    clearSelection();
    setBulkDeleteDialogOpen(false);
  }

  function initiateDelete(userId: string) {
    setUserToDelete(userId);
    setDeleteDialogOpen(true);
  }

  async function confirmDelete() {
    if (!userToDelete) return;
    await executeSingleDelete(userToDelete);
    setUserToDelete(null);
    setDeleteDialogOpen(false);
  }

  function handleHeaderSort(column: SortBy) {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setOrder("asc");
    }
  }

  return (
    <main className="mx-auto max-w-[1400px] p-4 md:p-6">
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

      <UserAnalytics users={users} isLoading={isLoading} />

      <UserFilters
        search={search}
        role={role}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onSearchChange={setSearch}
        onRoleChange={setRole}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="destructive" onClick={initiateBulkDelete}>
            Bulk Delete ({selectedIds.length})
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

      <UserTable
        users={users}
        isLoading={isLoading}
        isError={isError}
        selected={selected}
        syncingIds={syncingIds}
        allSelected={allSelected}
        sortBy={sortBy}
        order={order}
        isFetching={isFetching}
        total={pagination?.total ?? 0}
        onToggleAll={toggleAll}
        onToggleOne={toggleOne}
        onDelete={initiateDelete}
        onSort={handleHeaderSort}
      />

      <PaginationControls
        page={page}
        totalPages={pagination?.totalPages ?? 1}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />

      <UserMobileCards users={users} onDelete={initiateDelete} />

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
        description={`Are you sure you want to delete ${selectedIds.length} user(s)? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmBulkDelete}
        variant="destructive"
      />
    </main>
  );
}
