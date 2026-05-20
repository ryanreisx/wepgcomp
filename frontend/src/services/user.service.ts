import api from "./api";
import { User, UserLevel } from "@/types/user";

export const getUsers = () => api.get<{ data: User[] }>("/users");

export const getPendingUsers = () =>
  api.get<{ data: User[] }>("/users/pending");

export const getUserById = (id: string) =>
  api.get<{ data: User }>(`/users/${id}`);

export const updateUser = (id: string, data: Partial<{ name: string }>) =>
  api.patch<{ data: User; message: string }>(`/users/${id}`, data);

export const deleteUser = (id: string) => api.delete(`/users/${id}`);

export const approveUser = (id: string) =>
  api.patch<{ data: User; message: string }>(`/users/${id}/approve`);

export const rejectUser = (id: string) =>
  api.patch<{ data: User; message: string }>(`/users/${id}/reject`);

export const updateUserLevel = (id: string, level: UserLevel) =>
  api.patch<{ data: User; message: string }>(`/users/${id}/level`, { level });
