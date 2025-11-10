"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/types/user";

interface UserMobileCardsProps {
  users: User[];
  onDelete: (id: string) => void;
}

export function UserMobileCards({ users, onDelete }: UserMobileCardsProps) {
  return (
    <div className="grid gap-4 md:hidden">
      <AnimatePresence>
        {users?.map((u) => (
          <motion.div
            key={u.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{u.name}</CardTitle>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{u.email}</p>
                </div>
                <span
                  className={u.active ? "text-xs font-medium text-green-600 dark:text-green-400" : "text-xs text-gray-500 dark:text-gray-400"}
                >
                  {u.active ? "Active" : "Inactive"}
                </span>
              </CardHeader>
              <CardContent className="pt-2">
                <p className="mb-2 text-sm text-gray-700 dark:text-slate-200">
                  Role: <span className="font-medium">{u.role}</span>
                </p>
                <div className="flex gap-2">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/users/${u.id}/edit`}>Edit</Link>
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(u.id)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

