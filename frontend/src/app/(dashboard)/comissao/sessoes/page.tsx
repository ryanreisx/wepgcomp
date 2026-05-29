"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import SessoesPage from "@/components/pages/SessoesPage";

export default function ComissaoSessoesPage() {
  return (
    <ProtectedRoute requireEditionAdmin>
      <SessoesPage />
    </ProtectedRoute>
  );
}
