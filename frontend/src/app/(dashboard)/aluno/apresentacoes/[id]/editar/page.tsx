"use client";

import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ApresentacaoSubmissaoForm from "@/components/forms/ApresentacaoSubmissaoForm";

export default function EditarApresentacaoPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <ProtectedRoute>
      <ApresentacaoSubmissaoForm submissionId={id} />
    </ProtectedRoute>
  );
}
