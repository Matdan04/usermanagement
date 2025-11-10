import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useDeleteUser, useCreateUser } from "@/lib/api";
import type { CreateUserInput, User } from "@/types/user";

const STORAGE_KEY = "users_bulk_delete_pending";

export function useBulkDelete() {
  const { mutateAsync: deleteAsync } = useDeleteUser();
  const { mutateAsync: createAsync } = useCreateUser();
  const [syncingIds, setSyncingIds] = useState<Record<string, boolean>>({});
  const bulkRunningRef = useRef(false);
  const undoTimerRef = useRef<number | null>(null);
  const [pendingUndo, setPendingUndo] = useState<{
    users: CreateUserInput[];
    expiresAt: number;
  } | null>(null);

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

  async function executeBulkDelete(ids: string[], users: User[]) {
    if (ids.length === 0) return;
    if (bulkRunningRef.current) {
      toast.message("Bulk delete already in progress");
      return;
    }

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
          await deleteAsync(id);
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
    } finally {
      bulkRunningRef.current = false;
    }
  }

  async function executeSingleDelete(userId: string) {
    setSyncingIds((s) => ({ ...s, [userId]: true }));
    try {
      await deleteAsync(userId);
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setSyncingIds((s) => {
        const n = { ...s };
        delete n[userId];
        return n;
      });
    }
  }

  return {
    syncingIds,
    executeBulkDelete,
    executeSingleDelete,
  };
}

