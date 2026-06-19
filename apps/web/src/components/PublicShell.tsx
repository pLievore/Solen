"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/components/motion";

function VendyMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-fg shadow-[0_6px_18px_rgba(22,163,74,0.24)] transition-transform duration-300 group-hover:scale-105">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden
        className="h-6 w-6"
      >
        <rect
          x="9"
          y="3.5"
          width="14"
          height="25"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
        />
        <rect x="13" y="6.5" width="6" height="1.8" rx="0.9" fill="currentColor" />
        <path
          d="m12.5 20 2.4 2.4 4.9-6"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const evaluationHref = pathname === "/" ? "#categorias" : "/#categorias";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 isolate border-b border-border bg-bg shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="group flex items-center gap-2.5" aria-label="Vendy - início">
            <VendyMark />
            <span className="text-base font-bold tracking-tight text-fg">
              Vendy
            </span>
          </Link>

          <nav className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/blog"
              className={`text-sm transition hover:text-brand ${
                pathname.startsWith("/blog")
                  ? "font-semibold text-brand"
                  : "font-medium text-fg/70"
              }`}
            >
              Blog
            </Link>
            <Link
              href={evaluationHref}
              className="group flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-brand-fg shadow-brand/40 transition hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-brand active:scale-95"
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden
                className="h-4 w-4"
              >
                <path
                  d="M4 10h12M11.5 5.5 16 10l-4.5 4.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Avaliar agora
            </Link>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          className="flex-1"
          {...fadeIn}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-surface px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold">Vendy</p>
            <p className="text-xs text-muted">Compra de eletrônicos usados</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-xs text-muted">
            <Link href="/blog" className="hover:text-brand transition">Blog</Link>
            <Link href="/privacidade" className="hover:text-brand transition">Privacidade</Link>
          </nav>
          <p className="w-full text-center text-xs text-muted sm:w-auto sm:text-right">
            © {new Date().getFullYear()} Vendy
          </p>
        </div>
      </footer>
    </div>
  );
}
