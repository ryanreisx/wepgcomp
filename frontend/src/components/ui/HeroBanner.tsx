"use client";

import styles from "./HeroBanner.module.css";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  backgroundImage?: string;
  overlayVariant?: "cool" | "warm";
}

export default function HeroBanner({
  title,
  subtitle,
  ctaText,
  ctaHref,
  backgroundImage = "/images/hero-salvador.jpg",
  overlayVariant = "cool",
}: HeroBannerProps) {
  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})` }
    : undefined;

  return (
    <section className={styles.hero} style={bgStyle}>
      <div className={`${styles.overlay} ${overlayVariant === "warm" ? styles["overlay--warm"] : ""}`} />
      <div className={`container ${styles.content}`}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {ctaText && ctaHref && (
          <a href={ctaHref} className={styles.cta}>
            {ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
