import api from "./api";
import { ContactFormData } from "@/types/contact";

export const sendContact = (data: ContactFormData) =>
  api.post<{ message: string }>("/contact", data);
