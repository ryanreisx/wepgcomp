"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import MinhasApresentacoesPage from "@/components/pages/MinhasApresentacoesPage";

export default function AlunoApresentacoesPage() {
  return (
    <ProtectedRoute requiredProfile="DoctoralStudent">
      <MinhasApresentacoesPage />
    </ProtectedRoute>
  );
}
