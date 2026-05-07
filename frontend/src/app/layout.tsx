import type { Metadata } from "next";
import { Poppins, Raleway } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "WEPGCOMP — Workshop de Estudantes da Pós-Graduação em Computação",
  description:
    "Portal do Workshop de Estudantes da Pós-Graduação em Computação da UFBA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${raleway.variable}`}>
      <body>{children}</body>
    </html>
  );
}
