"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import PremiacaoPage from "@/components/pages/PremiacaoPage";

export default function SuperadminPremiacaoPage() {
  return (
    <ProtectedRoute requiredLevel="Admin">
      <PremiacaoPage />
    </ProtectedRoute>
  );
}
