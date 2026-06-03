"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import EdicoesListagemPage from "@/components/pages/EdicoesListagemPage";

export default function SuperadminEdicoesPage() {
  return (
    <ProtectedRoute requiredLevel="Admin">
      <EdicoesListagemPage />
    </ProtectedRoute>
  );
}
