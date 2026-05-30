"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import CertificadosPage from "@/components/pages/CertificadosPage";

export default function CertificadosRoutePage() {
  return (
    <ProtectedRoute>
      <CertificadosPage />
    </ProtectedRoute>
  );
}
