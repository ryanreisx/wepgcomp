import api from "./api";

export interface Room {
  id: string;
  eventEditionId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const createRoom = (dto: {
  eventEditionId: string;
  name: string;
  description?: string;
}) => api.post<{ data: Room; message: string }>("/rooms", dto);

export const getRoomsByEdition = (eventEditionId: string) =>
  api.get<{ data: Room[] }>("/rooms", { params: { eventEditionId } });

export const deleteRoom = (id: string) => api.delete(`/rooms/${id}`);
