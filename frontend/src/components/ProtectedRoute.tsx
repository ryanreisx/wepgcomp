"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Profile, UserLevel } from "@/types/user";

const LEVEL_HIERARCHY: UserLevel[] = ["Default", "Admin", "Superadmin"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredLevel?: UserLevel | UserLevel[];
  requiredProfile?: Profile | Profile[];
  requireEditionAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requiredLevel,
  requiredProfile,
  requireEditionAdmin,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (requiredLevel) {
      const levels = Array.isArray(requiredLevel)
        ? requiredLevel
        : [requiredLevel];
      const userLevelIndex = LEVEL_HIERARCHY.indexOf(user.level);
      const hasLevel = levels.some(
        (level) => userLevelIndex >= LEVEL_HIERARCHY.indexOf(level)
      );
      if (!hasLevel) {
        router.replace("/login");
        return;
      }
    }

    if (requiredProfile) {
      const profiles = Array.isArray(requiredProfile)
        ? requiredProfile
        : [requiredProfile];
      if (!profiles.includes(user.profile)) {
        router.replace("/login");
        return;
      }
    }

    if (requireEditionAdmin) {
      if (!user.isCommitteeOfActiveEdition && user.level !== "Superadmin" && user.level !== "Admin") {
        router.replace("/login");
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredLevel,
    requiredProfile,
    requireEditionAdmin,
    router,
  ]);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (requiredLevel) {
    const levels = Array.isArray(requiredLevel)
      ? requiredLevel
      : [requiredLevel];
    const userLevelIndex = LEVEL_HIERARCHY.indexOf(user.level);
    const hasLevel = levels.some(
      (level) => userLevelIndex >= LEVEL_HIERARCHY.indexOf(level)
    );
    if (!hasLevel) return null;
  }

  if (requiredProfile) {
    const profiles = Array.isArray(requiredProfile)
      ? requiredProfile
      : [requiredProfile];
    if (!profiles.includes(user.profile)) return null;
  }

  if (requireEditionAdmin) {
    if (!user.isCommitteeOfActiveEdition && user.level !== "Superadmin" && user.level !== "Admin") {
      return null;
    }
  }

  return <>{children}</>;
}
