"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import EdicaoForm from "@/components/forms/EdicaoForm";

export default function SuperadminNovaEdicaoPage() {
  return (
    <ProtectedRoute requiredLevel="Superadmin">
      <EdicaoForm mode="create" />
    </ProtectedRoute>
  );
}
