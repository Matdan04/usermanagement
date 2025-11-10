import { useMemo, useState } from "react";
import type { User } from "@/types/user";

export function useUserSelection(users: User[]) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const allSelected = useMemo(() => {
    if (!users?.length) return false;
    return users.every((u: User) => selected[u.id]);
  }, [users, selected]);

  const selectedIds = useMemo(() => {
    return Object.entries(selected)
      .filter(([, v]) => v)
      .map(([k]) => k);
  }, [selected]);

  function toggleAll() {
    if (!users.length) return;
    if (allSelected) {
      setSelected({});
    } else {
      const next: Record<string, boolean> = {};
      for (const u of users) next[u.id] = true;
      setSelected(next);
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function clearSelection() {
    setSelected({});
  }

  return {
    selected,
    allSelected,
    selectedIds,
    toggleAll,
    toggleOne,
    clearSelection,
  };
}

