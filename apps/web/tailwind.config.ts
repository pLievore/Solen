import type { Config } from "tailwindcss";

/**
 * Cores mapeadas para CSS variables (design tokens) em src/styles/tokens.css.
 * Trocar a identidade visual = editar os tokens, sem mexer nos componentes.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--color-bg)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
        brand: {
          DEFAULT: "var(--color-brand)",
          fg: "var(--color-brand-fg)",
        },
        border: "var(--color-border)",
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
      },
    },
  },
  plugins: [],
};

export default config;
