import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Avaliação do aparelho",
  robots: { index: false, follow: false, nocache: true },
};

export default function EvaluationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
