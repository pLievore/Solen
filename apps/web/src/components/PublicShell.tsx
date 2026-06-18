"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { fadeIn } from "@/components/motion";

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-xs font-bold text-brand-fg">
              S
            </span>
            <span className="text-sm font-semibold tracking-tight">Solen</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/blog"
              className={`text-sm transition hover:text-brand ${
                pathname.startsWith("/blog") ? "text-brand font-medium" : "text-muted"
              }`}
            >
              Blog
            </Link>
            <Link
              href="/"
              className="rounded-lg bg-brand px-4 py-1.5 text-sm font-medium text-brand-fg shadow-brand/40 transition hover:bg-brand-dark active:scale-95"
            >
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
            <p className="text-sm font-semibold">Solen</p>
            <p className="text-xs text-muted">Compra de eletrônicos usados</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-xs text-muted">
            <Link href="/blog" className="hover:text-brand transition">Blog</Link>
            <Link href="/privacidade" className="hover:text-brand transition">Privacidade</Link>
          </nav>
          <p className="w-full text-center text-xs text-muted sm:w-auto sm:text-right">
            © {new Date().getFullYear()} Solen
          </p>
        </div>
      </footer>
    </div>
  );
}
