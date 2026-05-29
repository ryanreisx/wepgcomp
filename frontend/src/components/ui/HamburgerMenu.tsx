"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useUserView, View } from "@/hooks/useUserView";
import styles from "./HamburgerMenu.module.css";

interface MenuItem {
  label: string;
  href: string;
}

const MENU_ITEMS: Record<Exclude<View, "public">, MenuItem[]> = {
  superadmin: [
    { label: "Sessões", href: "/superadmin/sessoes" },
    { label: "Apresentações", href: "/superadmin/apresentacoes" },
    { label: "Edições do Evento", href: "/superadmin/edicoes" },
    { label: "Premiação", href: "/superadmin/premiacao" },
    { label: "Usuários", href: "/superadmin/usuarios" },
    { label: "Emitir Certificado", href: "/certificados" },
  ],
  committee: [
    { label: "Sessões", href: "/comissao/sessoes" },
    { label: "Apresentações", href: "/comissao/apresentacoes" },
    { label: "Edição do Evento", href: "/comissao/edicao" },
    { label: "Premiação", href: "/comissao/premiacao" },
    { label: "Emitir Certificado", href: "/certificados" },
  ],
  student: [
    { label: "Minhas Apresentações", href: "/aluno/apresentacoes" },
    { label: "Emitir Certificado", href: "/certificados" },
  ],
  listener: [
    { label: "Avaliação", href: "/ouvinte/avaliacao" },
    { label: "Emitir Certificado", href: "/certificados" },
  ],
};

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const view = useUserView();
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (view === "public") return null;

  const items = MENU_ITEMS[view];

  async function handleLogout() {
    setOpen(false);
    await logout();
    router.push("/");
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-label="Menu do usuário"
        aria-expanded={open}
        type="button"
      >
        <span className={styles.triggerLine} />
        <span className={styles.triggerLine} />
        <span className={styles.triggerLine} />
      </button>

      {open && (
        <ul className={styles.dropdown} role="menu">
          {items.map((item) => (
            <li key={item.href} role="none">
              <Link
                href={item.href}
                className={styles.item}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
          <li role="none">
            <div className={styles.divider} />
          </li>
          <li role="none">
            <button
              className={styles.logout}
              role="menuitem"
              onClick={handleLogout}
              type="button"
            >
              Sair
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
