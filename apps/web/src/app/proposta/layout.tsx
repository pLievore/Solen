import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enviar proposta",
  robots: { index: false, follow: false, nocache: true },
};

export default function ProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
