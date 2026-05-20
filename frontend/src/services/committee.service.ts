import api from "./api";

export type CommitteeLevel = "Committee" | "Coordinator";
export type CommitteeRole = string;

export interface CommitteeMember {
  id: string;
  eventEditionId: string;
  userId: string;
  level: CommitteeLevel;
  role: CommitteeRole;
  createdAt: string;
  updatedAt: string;
}

export const createCommitteeMember = (dto: {
  eventEditionId: string;
  userId: string;
  level: CommitteeLevel;
  role: string;
}) =>
  api.post<{ data: CommitteeMember; message: string }>(
    "/committee-members",
    dto
  );

export const getCommitteeMembersByEdition = (eventEditionId: string) =>
  api.get<{ data: CommitteeMember[] }>("/committee-members", {
    params: { eventEditionId },
  });

export const deleteCommitteeMember = (id: string) =>
  api.delete(`/committee-members/${id}`);
