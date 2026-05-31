"use client";

import Image from "next/image";
import styles from "./Footer.module.css";

interface FooterProps {
  variant?: "full" | "compact";
  className?: string;
}

export default function Footer({
  variant = "full",
  className = "",
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  if (variant === "compact") {
    return (
      <footer className={`${styles.footerCompact} ${className}`}>
        <div className="container text-center">
          <p className={styles.copyrightText}>
            &copy; {currentYear} WEPGCOMP
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`${styles.footer} ${className}`}>
      <div className={styles.logosSection}>
        <div className="container">
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <h4 className={styles.heading}>Realização:</h4>
              <div className={styles.logoGroup}>
                <Image
                  src="/images/logo-computacao-ufba.webp"
                  alt="Computação UFBA"
                  width={220}
                  height={70}
                  className={styles.logoImgRealizacao}
                  unoptimized
                />
              </div>
            </div>
            <div className="col-md-6">
              <h4 className={styles.heading}>Apoio:</h4>
              <div className={styles.logoGroup}>
                <Image
                  src="/images/logo-ufba.svg"
                  alt="UFBA"
                  width={60}
                  height={50}
                  className={styles.logoImgUfba}
                  unoptimized
                />
                <Image
                  src="/images/logo-jusbrasil.png"
                  alt="Jusbrasil"
                  width={100}
                  height={28}
                  className={styles.logoImgJusbrasil}
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.copyrightSection}>
        <div className="container text-center">
          <p className={styles.copyrightText}>
            &copy; {currentYear} WEPGCOMP
          </p>
        </div>
      </div>
    </footer>
  );
}
