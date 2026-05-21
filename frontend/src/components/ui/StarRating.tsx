"use client";

import { useState } from "react";
import styles from "./StarRating.module.css";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  maxStars?: number;
  readOnly?: boolean;
  className?: string;
}

export default function StarRating({
  value,
  onChange,
  maxStars = 5,
  readOnly = false,
  className = "",
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const displayValue = hovered || value;

  return (
    <div
      className={`${styles.rating} ${readOnly ? styles["rating--readonly"] : ""} ${className}`}
      role="group"
      aria-label="Avaliação por estrelas"
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;

        return (
          <button
            key={starValue}
            type="button"
            className={`${styles.star} ${filled ? styles["star--filled"] : ""}`}
            onClick={() => !readOnly && onChange?.(starValue)}
            onMouseEnter={() => !readOnly && setHovered(starValue)}
            onMouseLeave={() => !readOnly && setHovered(0)}
            disabled={readOnly}
            aria-label={`${starValue} estrela${starValue > 1 ? "s" : ""}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
