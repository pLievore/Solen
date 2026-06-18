import type { Metadata } from "next";
import "./globals.css";
import LgpdBanner from "./_components/LgpdBanner";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://solen.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Solen — Venda seus usados",
    template: "%s — Solen",
  },
  description:
    "Venda iPhones, iPads, Apple Watch, consoles e eletrônicos usados, quebrados ou seminovos. Avaliação rápida e proposta na hora.",
  openGraph: {
    siteName: "Solen",
    locale: "pt_BR",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  return (
    <html lang="pt-BR" data-theme="light">
      <head>
        {gaId && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{page_path:window.location.pathname});`,
              }}
            />
          </>
        )}
      </head>
      <body>
        {children}
        <LgpdBanner />
      </body>
    </html>
  );
}
