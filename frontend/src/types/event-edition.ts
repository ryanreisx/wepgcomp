export interface EventEdition {
  id: string;
  name: string;
  description: string;
  callForPapersText: string;
  partnersText: string;
  location: string;
  startDate: string;
  endDate: string;
  submissionStartDate: string;
  submissionDeadline: string;
  isActive: boolean;
  isEvaluationRestrictToLoggedUsers: boolean;
  presentationDuration: number;
  presentationsPerPresentationBlock: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventEditionDto {
  name: string;
  description: string;
  callForPapersText: string;
  partnersText: string;
  location: string;
  startDate: string;
  endDate: string;
  submissionStartDate: string;
  submissionDeadline: string;
  isActive?: boolean;
  isEvaluationRestrictToLoggedUsers?: boolean;
  presentationDuration?: number;
  presentationsPerPresentationBlock?: number;
}

export type UpdateEventEditionDto = Partial<CreateEventEditionDto>;
