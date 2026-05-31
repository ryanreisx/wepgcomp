"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ApresentacoesAdminPage from "@/components/pages/ApresentacoesAdminPage";

export default function ComissaoApresentacoesPage() {
  return (
    <ProtectedRoute requireEditionAdmin>
      <ApresentacoesAdminPage />
    </ProtectedRoute>
  );
}
