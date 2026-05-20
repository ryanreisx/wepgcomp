"use client";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import HamburgerMenu from "@/components/ui/HamburgerMenu";
import { useAuth } from "@/hooks/useAuth";

const PUBLIC_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Programação do Evento", href: "/programacao" },
  { label: "Orientações", href: "/orientacoes" },
  { label: "Contato", href: "/contato" },
];

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar
        links={PUBLIC_LINKS}
        showHamburger={isAuthenticated}
      >
        {isAuthenticated && <HamburgerMenu />}
      </Navbar>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer
        contactEmail="pgcomp@ufba.br"
        location="Salvador, BA — UFBA"
      />
    </div>
  );
}
