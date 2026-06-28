import Link from "next/link";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/ui";

// Cabecalho padrao das telas do admin: titulo, subtitulo, acoes e voltar opcional.
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  back,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("animate-fade-in-up", className)}>
      {back && (
        <Link
          href={back.href}
          className="mb-3 inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-brand"
        >
          <Icon.arrowLeft size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-subtle text-brand-600 ring-1 ring-inset ring-brand/15">
              {icon}
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
