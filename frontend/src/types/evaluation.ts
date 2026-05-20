export interface EvaluationCriteria {
  id: string;
  eventEditionId: string;
  title: string;
  description: string;
  weightRadio?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Evaluation {
  id: string;
  userId?: string | null;
  evaluationCriteriaId: string;
  submissionId: string;
  score: number;
  comments?: string | null;
  name?: string | null;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationDto {
  evaluationCriteriaId: string;
  submissionId: string;
  score: number;
  comments?: string;
  name?: string;
  email?: string;
}
