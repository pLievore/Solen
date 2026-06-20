import type { Metadata } from "next";
import "./globals.css";
import LgpdBanner from "./_components/LgpdBanner";
import AnalyticsConsent from "./_components/AnalyticsConsent";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.vendybrasil.com"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vendy — Venda seus usados",
    template: "%s — Vendy",
  },
  description:
    "Venda iPhones, iPads, Apple Watch, consoles e eletrônicos usados, quebrados ou seminovos. Avaliação rápida e proposta na hora.",
  openGraph: {
    url: SITE_URL,
    siteName: "Vendy",
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
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Vendy",
        url: SITE_URL,
        logo: `${SITE_URL}/icon.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Vendy",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "pt-BR",
      },
    ],
  };
  return (
    <html lang="pt-BR" data-theme="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body>
        {children}
        <AnalyticsConsent gaId={gaId} />
        <LgpdBanner />
      </body>
    </html>
  );
}
