export type PresentationBlockType = 'General' | 'Presentation';
export type PresentationStatus = 'Scheduled' | 'Completed' | 'Cancelled';
export type PanelistStatus = 'Confirmed' | 'Declined' | 'Pending';

export interface PresentationBlock {
  id: string;
  eventEditionId: string;
  roomId?: string | null;
  type: PresentationBlockType;
  title?: string | null;
  speakerName?: string | null;
  startTime: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationSubmission {
  id: string;
  title: string;
  mainAuthorId: string;
  mainAuthor?: { id: string; name: string };
}

export interface Presentation {
  id: string;
  submissionId: string;
  presentationBlockId: string;
  positionWithinBlock: number;
  status: PresentationStatus;
  publicAverageScore?: number | null;
  evaluatorsAverageScore?: number | null;
  createdAt: string;
  updatedAt: string;
  submission?: PresentationSubmission;
}

export interface Panelist {
  id: string;
  presentationBlockId: string;
  userId: string;
  status: PanelistStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RankingEntry {
  submissionId: string;
  title: string;
  authorName: string;
  averageScore: number;
}
