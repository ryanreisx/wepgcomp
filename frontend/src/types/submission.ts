export type SubmissionStatus = 'Submitted' | 'UnderReview' | 'Accepted' | 'Rejected' | 'Withdrawn';

export interface Submission {
  id: string;
  advisorId: string;
  mainAuthorId: string;
  eventEditionId: string;
  title: string;
  abstract: string;
  pdfFile: string;
  phoneNumber: string;
  proposedPresentationBlockId?: string | null;
  proposedPositionWithinBlock?: number | null;
  coAdvisor?: string | null;
  status: SubmissionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubmissionDto {
  advisorId: string;
  eventEditionId: string;
  title: string;
  abstract: string;
  phoneNumber: string;
  proposedPresentationBlockId?: string;
  proposedPositionWithinBlock?: number;
  coAdvisor?: string;
}

export type UpdateSubmissionDto = Partial<CreateSubmissionDto>;
