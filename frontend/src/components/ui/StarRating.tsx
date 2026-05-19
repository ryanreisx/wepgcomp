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
            ★
          </button>
        );
      })}
    </div>
  );
}
