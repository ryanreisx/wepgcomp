export interface BookmarkedPresentation {
  id: string;
  submissionId: string;
  presentationBlockId: string;
  positionWithinBlock: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  submission: {
    id: string;
    title: string;
    mainAuthor: {
      id: string;
      name: string;
    };
  };
}
