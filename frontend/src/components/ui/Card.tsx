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
              ★
            </button>
          )}
          {onEdit && (
            <button
              className={`${styles.action} ${styles["action--edit"]}`}
              onClick={onEdit}
              aria-label="Editar"
              type="button"
            >
              ✏
            </button>
          )}
          {onDelete && (
            <button
              className={`${styles.action} ${styles["action--delete"]}`}
              onClick={onDelete}
              aria-label="Excluir"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
