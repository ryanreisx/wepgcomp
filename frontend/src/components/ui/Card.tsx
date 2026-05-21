"use client";

import styles from "./Card.module.css";

interface CardProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onStar?: () => void;
  starred?: boolean;
  className?: string;
}

export default function Card({
  title,
  subtitle,
  children,
  onEdit,
  onDelete,
  onStar,
  starred = false,
  className = "",
}: CardProps) {
  const hasActions = onEdit || onDelete || onStar;

  return (
    <div className={`${styles.card} ${className}`}>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children}
      </div>
      {hasActions && (
        <div className={styles.actions}>
          {onStar && (
            <button
              className={`${styles.action} ${starred ? styles["action--starred"] : styles["action--star"]}`}
              onClick={onStar}
              aria-label={starred ? "Remover favorito" : "Favoritar"}
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          )}
          {onEdit && (
            <button
              className={`${styles.action} ${styles["action--edit"]}`}
              onClick={onEdit}
              aria-label="Editar"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.action} ${styles["action--delete"]}`}
              onClick={onDelete}
              aria-label="Excluir"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
