import api from "./api";

export interface Guidance {
  id: string;
  eventEditionId: string;
  summary?: string | null;
  authorGuidance?: string | null;
  reviewerGuidance?: string | null;
  audienceGuidance?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createGuidance = (dto: {
  eventEditionId: string;
  summary?: string;
  authorGuidance?: string;
  reviewerGuidance?: string;
  audienceGuidance?: string;
}) => api.post<{ data: Guidance; message: string }>("/guidances", dto);

export const getGuidancesByEdition = (eventEditionId: string) =>
  api.get<{ data: Guidance[] }>(`/guidances/${eventEditionId}`);

export const updateGuidance = (
  id: string,
  dto: Partial<{
    summary: string;
    authorGuidance: string;
    reviewerGuidance: string;
    audienceGuidance: string;
  }>
) => api.patch<{ data: Guidance; message: string }>(`/guidances/${id}`, dto);
