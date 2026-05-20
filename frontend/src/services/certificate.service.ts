import api from "./api";
import { Certificate } from "@/types/certificate";

export const generateCertificates = (eventEditionId: string) =>
  api.post<{ data: Certificate[]; message: string }>(
    "/certificates/generate",
    null,
    { params: { eventEditionId } }
  );

export const getMyCertificates = () =>
  api.get<{ data: Certificate[] }>("/certificates/my");

export const downloadCertificate = (id: string) =>
  api.get(`/certificates/${id}/download`, { responseType: "blob" });
