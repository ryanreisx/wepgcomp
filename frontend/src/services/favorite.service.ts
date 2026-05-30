import api from "./api";
import { BookmarkedPresentation } from "@/types/favorite";

export const addBookmark = (presentationId: string) =>
  api.post<{ data: unknown; message: string }>(
    `/presentations/${presentationId}/bookmark`
  );

export const removeBookmark = (presentationId: string) =>
  api.delete(`/presentations/${presentationId}/bookmark`);

export const getMyBookmarks = () =>
  api.get<{ data: BookmarkedPresentation[] }>("/presentations/bookmarks/my");

export const checkBookmark = (presentationId: string) =>
  api.get<{ data: { isBookmarked: boolean } }>(
    `/presentations/${presentationId}/bookmark/check`
  );
