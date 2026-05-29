"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import SessoesPage from "@/components/pages/SessoesPage";

export default function SuperadminSessoesPage() {
  return (
    <ProtectedRoute requiredLevel="Superadmin">
      <SessoesPage />
    </ProtectedRoute>
  );
}
