import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Solen — Venda seus usados",
    template: "%s — Solen",
  },
  description:
    "Venda iPhones, iPads, Apple Watch, consoles e eletronicos usados, quebrados ou seminovos. Avaliacao rapida e proposta na hora.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" data-theme="light">
      <body>{children}</body>
    </html>
  );
}
