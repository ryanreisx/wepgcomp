import api from "./api";
import {
  EventEdition,
  CreateEventEditionDto,
  UpdateEventEditionDto,
} from "@/types/event-edition";

export const createEventEdition = (dto: CreateEventEditionDto) =>
  api.post<{ data: EventEdition; message: string }>("/event-editions", dto);

export const getEventEditions = () =>
  api.get<{ data: EventEdition[] }>("/event-editions");

export const getActiveEventEdition = () =>
  api.get<{ data: EventEdition }>("/event-editions/active");

export const getEventEditionById = (id: string) =>
  api.get<{ data: EventEdition }>(`/event-editions/${id}`);

export const updateEventEdition = (id: string, dto: UpdateEventEditionDto) =>
  api.patch<{ data: EventEdition; message: string }>(
    `/event-editions/${id}`,
    dto
  );
