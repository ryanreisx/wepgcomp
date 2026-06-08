"use client";

import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

const PUBLIC_LINKS = [
  { label: "Inicio", href: "/" },
  { label: "Programação do Evento", href: "/#programacao" },
  { label: "Orientações", href: "/orientacoes" },
  { label: "Contato", href: "/#contato" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar links={PUBLIC_LINKS} logoSrc="/images/logo-pgcomp.svg" />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer variant="compact" />
    </div>
  );
}
