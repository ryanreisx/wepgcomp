"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import EdicaoForm from "@/components/forms/EdicaoForm";

export default function SuperadminNovaEdicaoPage() {
  return (
    <ProtectedRoute requiredLevel="Admin">
      <EdicaoForm mode="create" />
    </ProtectedRoute>
  );
}
