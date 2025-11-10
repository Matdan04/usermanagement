"use client";

import axios from "axios";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
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
  page?: number;
  perPage?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
};

export async function fetchUsers(params?: UsersQuery): Promise<PaginatedResponse<User>> {
  const res = await api.get("/users", { params });
  const responseData = res.data as { data: unknown[]; pagination: { page: number; perPage: number; total: number; totalPages: number } };
  return {
    data: responseData.data.map((u) => userSchema.parse(u)),
    pagination: responseData.pagination,
  };
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
  return useQuery<PaginatedResponse<User>>({
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
      const previous = qc.getQueriesData<PaginatedResponse<User>>({ queryKey: usersKeys.all });

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
        if (!old || !old.data) return;
        qc.setQueryData(key, {
          data: [optimistic, ...old.data],
          pagination: { ...old.pagination, total: old.pagination.total + 1 },
        });
      });

      return { previous } as { previous: [QueryKey, PaginatedResponse<User> | undefined][] };
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
      const previousList = qc.getQueriesData<PaginatedResponse<User>>({ queryKey: usersKeys.all });
      const previousDetail = qc.getQueryData<User>(usersKeys.detail(id));

      previousList.forEach(([key, old]) => {
        if (!old || !old.data) return;
        const next = old.data.map((u) => (u.id === id ? ({ ...u, ...payload } as User) : u));
        qc.setQueryData(key, { ...old, data: next });
      });

      if (previousDetail) {
        qc.setQueryData(usersKeys.detail(id), { ...previousDetail, ...payload });
      }

      return { previousList, previousDetail } as {
        previousList: [QueryKey, PaginatedResponse<User> | undefined][];
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
      const previous = qc.getQueriesData<PaginatedResponse<User>>({ queryKey: usersKeys.all });

      previous.forEach(([key, old]) => {
        if (!old || !old.data) return;
        qc.setQueryData(key, {
          data: old.data.filter((u) => u.id !== id),
          pagination: { ...old.pagination, total: old.pagination.total - 1 },
        });
      });

      const previousDetail = qc.getQueryData<User>(usersKeys.detail(id));

      return { previous, previousDetail } as {
        previous: [QueryKey, PaginatedResponse<User> | undefined][];
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
