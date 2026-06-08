"use client";

import { useAuth } from "@/hooks/useAuth";

export type View = "public" | "superadmin" | "committee" | "student" | "professor" | "listener";

export function useUserView(): View {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user) return "public";
  if (user.level === "Superadmin" || user.level === "Admin") return "superadmin";
  if (user.isCommitteeOfActiveEdition) return "committee";
  if (user.profile === "DoctoralStudent") return "student";
  if (user.profile === "Professor") return "professor";
  return "listener";
}
