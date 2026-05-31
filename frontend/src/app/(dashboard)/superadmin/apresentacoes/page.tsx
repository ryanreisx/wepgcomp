"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ApresentacoesAdminPage from "@/components/pages/ApresentacoesAdminPage";

export default function SuperadminApresentacoesPage() {
  return (
    <ProtectedRoute requiredLevel="Superadmin">
      <ApresentacoesAdminPage />
    </ProtectedRoute>
  );
}
