"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { User } from "@/types/user";

interface UserAnalyticsProps {
  users: User[];
  isLoading: boolean;
}

export function UserAnalytics({ users, isLoading }: UserAnalyticsProps) {
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

  return (
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
  );
}

