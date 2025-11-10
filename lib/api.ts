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

export async function fetchUsers(): Promise<User[]> {
  const res = await api.get("/users");
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

export function useUsers() {
  return useQuery({ queryKey: usersKeys.list(), queryFn: fetchUsers });
}

export function useUser(id: string) {
  return useQuery({ queryKey: usersKeys.detail(id), queryFn: () => fetchUser(id), enabled: !!id });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.list() }),
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUserInput) => updateUser(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.list() });
      qc.invalidateQueries({ queryKey: usersKeys.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: usersKeys.list() }),
  });
}

