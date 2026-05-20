import api from "./api";
import { Panelist } from "@/types/presentation";

export const createPanelist = (dto: {
  presentationBlockId: string;
  userId: string;
}) => api.post<{ data: Panelist; message: string }>("/panelists", dto);

export const getPanelistsByBlock = (presentationBlockId: string) =>
  api.get<{ data: Panelist[] }>("/panelists", {
    params: { presentationBlockId },
  });

export const deletePanelist = (id: string) => api.delete(`/panelists/${id}`);
