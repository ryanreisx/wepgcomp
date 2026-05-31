"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import PremiacaoPage from "@/components/pages/PremiacaoPage";

export default function ComissaoPremiacaoPage() {
  return (
    <ProtectedRoute requireEditionAdmin>
      <PremiacaoPage />
    </ProtectedRoute>
  );
}
