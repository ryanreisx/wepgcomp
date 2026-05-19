"use client";

import Image from "next/image";
import styles from "./Footer.module.css";

interface FooterProps {
  contactEmail?: string;
  contactPhone?: string;
  location?: string;
  logosSrc?: string[];
  className?: string;
}

export default function Footer({
  contactEmail,
  contactPhone,
  location,
  logosSrc = [],
  className = "",
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} ${className}`}>
      <div className={`container ${styles.container}`}>
        <div className="row">
          <div className="col-md-6">
            <h4 className={styles.heading}>Contato</h4>
            {contactEmail && (
              <p className={styles.text}>
                <a href={`mailto:${contactEmail}`} className={styles.link}>
                  {contactEmail}
                </a>
              </p>
            )}
            {contactPhone && <p className={styles.text}>{contactPhone}</p>}
          </div>
          <div className="col-md-6">
            <h4 className={styles.heading}>Local</h4>
            {location && <p className={styles.text}>{location}</p>}
          </div>
        </div>

        {logosSrc.length > 0 && (
          <div className={styles.logos}>
            {logosSrc.map((src, i) => (
              <Image
                key={i}
                src={src}
                alt={`Logo parceiro ${i + 1}`}
                width={120}
                height={40}
                className={styles.logoImg}
                unoptimized
              />
            ))}
          </div>
        )}

        <div className={styles.copyright}>
          <p className={styles.text}>
            &copy; {currentYear} WEPGCOMP — UFBA. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
