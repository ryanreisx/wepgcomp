"use client";

import { useParams } from "next/navigation";
import AvaliacaoFormPage from "@/components/pages/AvaliacaoFormPage";

export default function OuvinteAvaliacaoFormPage() {
  const params = useParams();
  const submissionId = params.submissionId as string;

  return <AvaliacaoFormPage submissionId={submissionId} />;
}
