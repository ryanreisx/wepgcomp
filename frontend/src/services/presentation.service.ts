import api from "./api";
import { Presentation, PresentationBlock } from "@/types/presentation";

export const createPresentationBlock = (dto: {
  eventEditionId: string;
  type: string;
  title?: string;
  speakerName?: string;
  roomId?: string;
  startTime: string;
  duration: number;
}) =>
  api.post<{ data: PresentationBlock; message: string }>(
    "/presentation-blocks",
    dto
  );

export const getPresentationBlocksByEdition = (eventEditionId: string) =>
  api.get<{ data: PresentationBlock[] }>("/presentation-blocks", {
    params: { eventEditionId },
  });

export const updatePresentationBlock = (
  id: string,
  dto: Partial<{
    type: string;
    title: string;
    speakerName: string;
    roomId: string;
    startTime: string;
    duration: number;
  }>
) =>
  api.patch<{ data: PresentationBlock; message: string }>(
    `/presentation-blocks/${id}`,
    dto
  );

export const deletePresentationBlock = (id: string) =>
  api.delete(`/presentation-blocks/${id}`);

export const createPresentation = (dto: {
  submissionId: string;
  presentationBlockId: string;
  positionWithinBlock: number;
}) =>
  api.post<{ data: Presentation; message: string }>("/presentations", dto);

export const getPresentationsByEdition = (eventEditionId: string) =>
  api.get<{ data: Presentation[] }>("/presentations", {
    params: { eventEditionId },
  });

export const getRanking = (
  eventEditionId: string,
  type: "public" | "panelists" | "all"
) =>
  api.get<{ data: Presentation[] }>("/presentations/ranking", {
    params: { eventEditionId, type },
  });

export const updatePresentation = (
  id: string,
  dto: Partial<{
    presentationBlockId: string;
    positionWithinBlock: number;
    status: string;
  }>
) =>
  api.patch<{ data: Presentation; message: string }>(
    `/presentations/${id}`,
    dto
  );

export const deletePresentation = (id: string) =>
  api.delete(`/presentations/${id}`);
