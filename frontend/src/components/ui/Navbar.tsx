"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./Navbar.module.css";

export interface NavLink {
  label: string;
  href: string;
}

interface NavbarProps {
  links?: NavLink[];
  logoText?: string;
  logoSrc?: string;
  loginHref?: string;
  loginLabel?: string;
  onHamburgerClick?: () => void;
  showHamburger?: boolean;
  children?: React.ReactNode;
}

export default function Navbar({
  links = [],
  logoText = "PGCOMP",
  logoSrc,
  loginHref = "/login",
  loginLabel = "Login",
  onHamburgerClick,
  showHamburger = false,
  children,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.container}`}>
        <Link href="/" className={styles.logo}>
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={logoText || "Logo"}
              height={40}
              width={180}
              className={styles.logoImg}
              unoptimized
            />
          ) : (
            logoText
          )}
        </Link>

        <ul className={`${styles.links} ${mobileOpen ? styles["links--open"] : ""}`}>
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={styles.link}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={styles.right}>
          {children}
          {!showHamburger && (
            <Link href={loginHref} className={styles.loginBtn}>
              {loginLabel}
            </Link>
          )}
          {showHamburger && onHamburgerClick && (
            <button
              className={styles.hamburger}
              onClick={onHamburgerClick}
              aria-label="Menu"
              type="button"
            >
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </button>
          )}
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menu"
            type="button"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>
      </div>
    </nav>
  );
}
