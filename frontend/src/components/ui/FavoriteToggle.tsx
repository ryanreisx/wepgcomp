"use client";

import { useState } from "react";
import { addBookmark, removeBookmark } from "@/services/favorite.service";
import styles from "./FavoriteToggle.module.css";

interface FavoriteToggleProps {
  presentationId: string;
  initialIsFavorite: boolean;
  onChange?: (next: boolean) => void;
}

export default function FavoriteToggle({
  presentationId,
  initialIsFavorite,
  onChange,
}: FavoriteToggleProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [toastError, setToastError] = useState<string | null>(null);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    setToastError(null);

    try {
      if (next) {
        await addBookmark(presentationId);
      } else {
        await removeBookmark(presentationId);
      }
      onChange?.(next);
    } catch {
      setIsFavorite(!next);
      setToastError("Erro ao atualizar favorito.");
      setTimeout(() => setToastError(null), 3000);
    }
  };

  return (
    <div className={styles.wrapper}>
      <button
        className={`${styles.star} ${isFavorite ? styles["star--filled"] : ""}`}
        onClick={handleToggle}
        aria-label={isFavorite ? "Remover favorito" : "Favoritar"}
        type="button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill={isFavorite ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
      {toastError && (
        <span className={styles.toast} role="alert">
          {toastError}
        </span>
      )}
    </div>
  );
}
