"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import UsuariosPage from "@/components/pages/UsuariosPage";

export default function SuperadminUsuariosPage() {
  return (
    <ProtectedRoute requiredLevel="Superadmin">
      <UsuariosPage />
    </ProtectedRoute>
  );
}
