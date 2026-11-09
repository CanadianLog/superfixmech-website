"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Role } from "@/lib/types";

const NAV: { href: string; label: string; icon: string; roles?: Role[] }[] = [
  { href: "/", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" },
  { href: "/schedule", label: "Schedule", icon: "M8 2v4M16 2v4M3 9h18M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z" },
  { href: "/jobs", label: "Jobs", icon: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z" },
  { href: "/customers", label: "Customers", icon: "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM21 21v-2a4 4 0 00-3-3.9M16 3.1a4 4 0 010 7.8", roles: ["admin", "dispatcher"] },
  { href: "/estimates", label: "Estimates", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4", roles: ["admin", "dispatcher"] },
  { href: "/invoices", label: "Invoices", icon: "M9 7h6M9 11h6M9 15h4M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z", roles: ["admin", "dispatcher"] },
  { href: "/pricebook", label: "Parts catalogue", icon: "M7 7h.01M3 11.5V4a1 1 0 011-1h7.5l9.3 9.3a1 1 0 010 1.4l-7.6 7.6a1 1 0 01-1.4 0z", roles: ["admin", "dispatcher"] },
  { href: "/reports", label: "Reports", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2", roles: ["admin", "dispatcher"] },
  { href: "/team", label: "Team", icon: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0", roles: ["admin"] },
  { href: "/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z", roles: ["admin"] },
];

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export function Shell({
  user,
  company,
  logout,
  children,
}: {
  user: { name: string; role: Role; color: string };
  company: string;
  logout: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user.role));
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3">
      {items.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          onClick={() => setOpen(false)}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
            active(n.href) ? "bg-brand text-brand-ink" : "text-stone-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Icon d={n.icon} />
          {n.label}
        </Link>
      ))}
    </nav>
  );

  const footer = (
    <div className="border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-white" style={{ background: user.color }}>
          {user.name
            .split(/\s+/)
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{user.name}</div>
          <div className="text-xs capitalize text-stone-400">{user.role === "tech" ? "Technician" : user.role}</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 text-xs">
        <Link href="/account" className="text-stone-400 hover:text-white" onClick={() => setOpen(false)}>
          My account
        </Link>
        <span className="text-stone-600">·</span>
        <form action={logout}>
          <button className="text-stone-400 hover:text-white">Sign out</button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/" className="flex items-center gap-2 px-6 py-5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-brand-ink">SF</span>
      <span className="truncate text-sm font-bold text-white">{company}</span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:flex">
      <aside className="no-print hidden w-60 shrink-0 flex-col bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-screen">
        {brand}
        {nav}
        {footer}
      </aside>

      <header className="no-print sticky top-0 z-30 flex items-center justify-between bg-sidebar px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-black text-brand-ink">SF</span>
          <span className="text-sm font-bold text-white">{company}</span>
        </Link>
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-white hover:bg-white/10" aria-label="Open menu">
          <Icon d="M4 6h16M4 12h16M4 18h16" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar">
            {brand}
            {nav}
            {footer}
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
