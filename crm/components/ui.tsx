import Link from "next/link";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/format";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_TONE[status] ?? "bg-stone-100 text-stone-700 ring-stone-300"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-1 inline-block text-sm text-stone-500 hover:text-stone-800">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-stone-500">{subtitle}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  title,
  actions,
  children,
  className = "",
  pad = true,
}: {
  title?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  pad?: boolean;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3">
          <h2 className="text-sm font-bold text-stone-800">{title}</h2>
          {actions}
        </header>
      )}
      <div className={pad ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Empty({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-sm text-stone-500">
      <p>{children}</p>
      {action}
    </div>
  );
}

export function Field({
  label,
  children,
  className = "",
  hint,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    </label>
  );
}

export function Stat({ label, value, hint, href }: { label: string; value: React.ReactNode; hint?: React.ReactNode; href?: string }) {
  const body = (
    <div className="card h-full p-4 transition hover:border-amber-300">
      <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-stone-900">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-stone-500">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export function Tabs({ items, current }: { items: { href: string; label: string; key: string; count?: number }[]; current: string }) {
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold ${
            t.key === current ? "border-amber-500 text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"
          }`}
        >
          {t.label}
          {t.count !== undefined && <span className="ml-1.5 rounded-full bg-stone-100 px-1.5 text-xs text-stone-600">{t.count}</span>}
        </Link>
      ))}
    </nav>
  );
}

export function TechDot({ color, name }: { color?: string | null; name?: string | null }) {
  if (!name) return <span className="text-stone-400">Unassigned</span>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color ?? "#999" }} />
      {name}
    </span>
  );
}
