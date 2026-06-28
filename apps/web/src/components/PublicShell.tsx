"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/components/motion";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const evaluationHref = pathname === "/" ? "#categorias" : "/#categorias";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 isolate border-b border-border bg-bg shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="group flex items-center" aria-label="Vendy - início">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-vendy.svg"
              alt="Vendy"
              width={156}
              height={36}
              className="h-9 w-auto transition-transform duration-300 group-hover:scale-105"
            />
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
        <motion.main
          key={pathname}
          className="flex-1"
          {...fadeIn}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-surface px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <div>
              <p className="text-sm font-semibold">Vendy</p>
              <p className="text-xs text-muted">Compra de eletrônicos usados</p>
            </div>
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
