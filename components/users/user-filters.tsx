"use client";

import { Input } from "@/components/ui/input";

interface UserFiltersProps {
  search: string;
  role: string;
  dateFrom: string;
  dateTo: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
}

export function UserFilters({
  search,
  role,
  dateFrom,
  dateTo,
  onSearchChange,
  onRoleChange,
  onDateFromChange,
  onDateToChange,
}: UserFiltersProps) {
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
      <div className="md:col-span-2">
        <Input
          placeholder="Search name or email"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div>
        <select 
          className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" 
          value={role} 
          onChange={(e) => onRoleChange(e.target.value)}
        >
          <option value="">All roles</option>
          <option value="admin">admin</option>
          <option value="editor">editor</option>
          <option value="user">user</option>
        </select>
      </div>
      <div>
        <input 
          type="date" 
          className="date-input h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]" 
          value={dateFrom} 
          onChange={(e) => onDateFromChange(e.target.value)} 
          placeholder="From date" 
        />
      </div>
      <div>
        <input 
          type="date" 
          className="date-input h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm transition-colors dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:[color-scheme:dark]" 
          value={dateTo} 
          onChange={(e) => onDateToChange(e.target.value)} 
          placeholder="To date" 
        />
      </div>
    </div>
  );
}

