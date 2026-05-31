"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import ApresentacaoSubmissaoForm from "@/components/forms/ApresentacaoSubmissaoForm";

export default function NovaApresentacaoPage() {
  return (
    <ProtectedRoute>
      <ApresentacaoSubmissaoForm />
    </ProtectedRoute>
  );
}
