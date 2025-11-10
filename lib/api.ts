"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateUserInput, UpdateUserInput, User, userSchema } from "@/types/user";

const baseURL = process.env.NEXT_PUBLIC_API_URL || "/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const usersKeys = {
  all: ["users"] as const,
  list: () => [...usersKeys.all, "list"] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};

export type UsersQuery = {
  search?: string;
  role?: string;
  sortBy?: "name" | "email" | "createdAt";
  order?: "asc" | "desc";
  dateFrom?: string; // ISO date
  dateTo?: string;   // ISO date
};

export async function fetchUsers(params?: UsersQuery): Promise<User[]> {
  const res = await api.get("/users", { params });
  const data = res.data as unknown[];
  return data.map((u) => userSchema.parse(u));
}

export async function fetchUser(id: string): Promise<User> {
  const res = await api.get(`/users/${id}`);
  return userSchema.parse(res.data);
}

export async function createUser(payload: CreateUserInput): Promise<User> {
  const res = await api.post(`/users`, payload);
  return userSchema.parse(res.data);
}

export async function updateUser(id: string, payload: UpdateUserInput): Promise<User> {
  const res = await api.put(`/users/${id}`, payload);
  return userSchema.parse(res.data);
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}

export function useUsers(params: UsersQuery) {
  return useQuery({
    queryKey: [usersKeys.list(), params],
    queryFn: () => fetchUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({ queryKey: usersKeys.detail(id), queryFn: () => fetchUser(id), enabled: !!id });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onMutate: async (newUser) => {
      await qc.cancelQueries({ queryKey: usersKeys.all });
      const previous = qc.getQueriesData<User[]>({ queryKey: usersKeys.all });

      const tempId = `temp-${Date.now()}`;
      const optimistic: User = {
        id: tempId,
        name: newUser.name,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber ?? "",
        role: newUser.role,
        active: newUser.active ?? true,
        avatar: newUser.avatar ?? "",
        bio: newUser.bio ?? "",
        createdAt: new Date().toISOString(),
      } as User;

      previous.forEach(([key, old]) => {
        if (!Array.isArray(old)) return;
        qc.setQueryData(key, [optimistic, ...old]);
      });

      return { previous } as { previous: [unknown, User[] | undefined][] };
    },
    onError: (_err, _variables, context) => {
      context?.previous?.forEach(([key, old]) => {
        qc.setQueryData(key, old);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserInput) => updateUser(id, payload),
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: usersKeys.all });
      const previousList = qc.getQueriesData<User[]>({ queryKey: usersKeys.all });
      const previousDetail = qc.getQueryData<User>(usersKeys.detail(id));

      previousList.forEach(([key, old]) => {
        if (!Array.isArray(old)) return;
        const next = old.map((u) => (u.id === id ? ({ ...u, ...payload } as User) : u));
        qc.setQueryData(key, next);
      });

      if (previousDetail) {
        qc.setQueryData(usersKeys.detail(id), { ...previousDetail, ...payload });
      }

      return { previousList, previousDetail } as {
        previousList: [unknown, User[] | undefined][];
        previousDetail?: User;
      };
    },
    onError: (_err, _payload, ctx) => {
      ctx?.previousList?.forEach(([key, old]) => qc.setQueryData(key, old));
      if (ctx?.previousDetail) qc.setQueryData(usersKeys.detail(id), ctx.previousDetail);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onMutate: async (id: string) => {
      await qc.cancelQueries({ queryKey: usersKeys.all });
      const previous = qc.getQueriesData<User[]>({ queryKey: usersKeys.all });

      previous.forEach(([key, old]) => {
        if (!Array.isArray(old)) return;
        qc.setQueryData(
          key,
          old.filter((u) => u.id !== id)
        );
      });

      const previousDetail = qc.getQueryData<User>(usersKeys.detail(id));

      return { previous, previousDetail } as {
        previous: [unknown, User[] | undefined][];
        previousDetail?: User;
      };
    },
    onError: (_err, id, context) => {
      context?.previous?.forEach(([key, old]) => qc.setQueryData(key, old));
      if (id && context?.previousDetail) qc.setQueryData(usersKeys.detail(id), context.previousDetail);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}
