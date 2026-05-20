import api from "./api";
import {
  Evaluation,
  EvaluationCriteria,
  CreateEvaluationDto,
} from "@/types/evaluation";

export const createEvaluation = (dto: CreateEvaluationDto) =>
  api.post<{ data: Evaluation; message: string }>("/evaluations", dto);

export const getEvaluationsBySubmission = (submissionId: string) =>
  api.get<{ data: Evaluation[] }>("/evaluations", {
    params: { submissionId },
  });

export const createEvaluationCriteria = (dto: {
  eventEditionId: string;
  title: string;
  description: string;
  weightRadio?: number;
}) =>
  api.post<{ data: EvaluationCriteria; message: string }>(
    "/evaluation-criteria",
    dto
  );

export const getEvaluationCriteria = (eventEditionId: string) =>
  api.get<{ data: EvaluationCriteria[] }>("/evaluation-criteria", {
    params: { eventEditionId },
  });

export const updateEvaluationCriteria = (
  id: string,
  dto: Partial<{ title: string; description: string; weightRadio: number }>
) =>
  api.patch<{ data: EvaluationCriteria; message: string }>(
    `/evaluation-criteria/${id}`,
    dto
  );

export const deleteEvaluationCriteria = (id: string) =>
  api.delete(`/evaluation-criteria/${id}`);
