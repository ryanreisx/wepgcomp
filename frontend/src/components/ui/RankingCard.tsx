"use client";

import styles from "./RankingCard.module.css";

interface RankingCardProps {
  position: number;
  title: string;
  authorName: string;
  score: number;
  colorVariant?: "default" | "green" | "orange" | "blue";
}

export default function RankingCard({
  position,
  title,
  authorName,
  score,
  colorVariant = "default",
}: RankingCardProps) {
  return (
    <div className={`${styles.card} ${styles[`card--${colorVariant}`]}`}>
      <div className={styles.position}>{position}º</div>
      <div className={styles.info}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.author}>{authorName}</p>
      </div>
      <div className={styles.score}>{score.toFixed(2)}</div>
    </div>
  );
}
