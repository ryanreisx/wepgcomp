"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import EdicaoForm from "@/components/forms/EdicaoForm";

export default function SuperadminEditarEdicaoPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ProtectedRoute requiredLevel="Admin">
      <EdicaoForm mode="edit" editionId={id} />
    </ProtectedRoute>
  );
}
