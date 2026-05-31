"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import EdicaoForm from "@/components/forms/EdicaoForm";

export default function ComissaoEdicaoPage() {
  return (
    <ProtectedRoute requireEditionAdmin>
      <EdicaoForm mode="committee" />
    </ProtectedRoute>
  );
}
