import api from "./api";
import { User, RegisterData } from "@/types/user";

export const login = (email: string, password: string) =>
  api.post<{ user: User }>("/auth/login", { email, password });

export const logout = () => api.post("/auth/logout");

export const register = (data: RegisterData) =>
  api.post<{ data: User; message: string }>("/auth/register", data);

export const getMe = () => api.get<{ data: User }>("/auth/me");

export const verifyEmail = (token: string) =>
  api.get<{ data: unknown; message: string }>("/auth/verify-email", {
    params: { token },
  });

export const resendVerification = (email: string) =>
  api.post<{ message: string }>("/auth/resend-verification", { email });

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>("/auth/forgot-password", { email });

export const resetPassword = (token: string, password: string) =>
  api.post<{ message: string }>("/auth/reset-password", { token, password });
