"use client";

import styles from "./StatusBadge.module.css";

export type UserStatus = "Ativo" | "Pendente" | "Inativo";

interface StatusBadgeProps {
  status: UserStatus;
  onClick?: () => void;
  active?: boolean;
}

export default function StatusBadge({
  status,
  onClick,
  active = false,
}: StatusBadgeProps) {
  const variantClass =
    status === "Ativo"
      ? styles.green
      : status === "Pendente"
        ? styles.orange
        : styles.gray;

  return (
    <button
      type="button"
      className={`${styles.badge} ${variantClass} ${active ? styles.active : styles.inactive}`}
      onClick={onClick}
    >
      {status}
    </button>
  );
}
