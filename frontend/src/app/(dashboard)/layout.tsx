"use client";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import HamburgerMenu from "@/components/ui/HamburgerMenu";

const PUBLIC_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Programação do Evento", href: "/#programacao" },
  { label: "Orientações", href: "/orientacoes" },
  { label: "Contato", href: "/#contato" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar links={PUBLIC_LINKS} logoSrc="/images/logo-pgcomp.svg" showHamburger>
        <HamburgerMenu />
      </Navbar>
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}
