import api from "./api";
import { Submission, CreateSubmissionDto, UpdateSubmissionDto } from "@/types/submission";

export const createSubmission = (dto: CreateSubmissionDto, pdfFile: File) => {
  const formData = new FormData();
  Object.entries(dto).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, String(value));
  });
  formData.append("pdfFile", pdfFile);
  return api.post<{ data: Submission; message: string }>(
    "/submissions",
    formData
  );
};

export const getSubmissions = (eventEditionId?: string) =>
  api.get<{ data: Submission[] }>("/submissions", {
    params: eventEditionId ? { eventEditionId } : undefined,
  });

export const getMySubmissions = () =>
  api.get<{ data: Submission[] }>("/submissions/my");

export const getSubmissionById = (id: string) =>
  api.get<{ data: Submission }>(`/submissions/${id}`);

export const updateSubmission = (
  id: string,
  dto: UpdateSubmissionDto,
  pdfFile?: File
) => {
  const formData = new FormData();
  Object.entries(dto).forEach(([key, value]) => {
    if (value !== undefined) formData.append(key, String(value));
  });
  if (pdfFile) formData.append("pdfFile", pdfFile);
  return api.patch<{ data: Submission; message: string }>(
    `/submissions/${id}`,
    formData
  );
};

export const deleteSubmission = (id: string) =>
  api.delete(`/submissions/${id}`);
