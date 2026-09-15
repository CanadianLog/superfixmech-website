"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { company, installationPages, servicePages } from "@/lib/site-data";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);
  const [desktopServicesOpen, setDesktopServicesOpen] = useState(false);
  const [desktopInstallOpen, setDesktopInstallOpen] = useState(false);
  const desktopServicesRef = useRef<HTMLDivElement | null>(null);
  const desktopInstallRef = useRef<HTMLDivElement | null>(null);
  const navItemClass =
    "rounded px-1.5 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[#2f2512] transition hover:text-[#5f4714]";

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
    setInstallOpen(false);
    setDesktopServicesOpen(false);
    setDesktopInstallOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!desktopServicesOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!desktopServicesRef.current?.contains(target)) {
        setDesktopServicesOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [desktopServicesOpen]);

  useEffect(() => {
    if (!desktopInstallOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (!desktopInstallRef.current?.contains(target)) {
        setDesktopInstallOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [desktopInstallOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ead39a] bg-[#fff9e8] text-[#2f2512]">
      <Container className="flex h-[82px] items-center justify-between gap-5 md:h-[98px] md:gap-8 lg:h-[112px]">
        <Link href="/" className="shrink-0" aria-label="Home">
          <Image
            src="/superfix_logo.png"
            alt="SuperFix Mechanical logo"
            width={160}
            height={70}
            className="h-auto w-[120px] md:w-[130px] lg:w-[160px]"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          <div
            ref={desktopServicesRef}
            className="relative"
            onMouseEnter={() => setDesktopServicesOpen(true)}
            onMouseLeave={() => setDesktopServicesOpen(false)}
          >
            <button
              type="button"
              className={`${navItemClass} flex items-center gap-1.5`}
              onClick={() => setDesktopServicesOpen((prev) => !prev)}
              aria-expanded={desktopServicesOpen}
              aria-haspopup="menu"
            >
              Appliance Service
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="mt-px opacity-70">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className={cn(
                "absolute left-0 top-full mt-3 w-56 rounded-xl border border-[#efddae] bg-[#fffdf6] p-2 text-[#5f4714] shadow-2xl transition-all duration-200",
                desktopServicesOpen ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              {servicePages.map((service) => (
                <Link
                  key={service.slug}
                  href={`/repair/${service.slug}`}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium normal-case tracking-normal hover:bg-[#fff5d6]"
                  onClick={() => setDesktopServicesOpen(false)}
                >
                  {service.name}
                </Link>
              ))}
            </div>
          </div>
          <div
            ref={desktopInstallRef}
            className="relative"
            onMouseEnter={() => setDesktopInstallOpen(true)}
            onMouseLeave={() => setDesktopInstallOpen(false)}
          >
            <button
              type="button"
              className={`${navItemClass} flex items-center gap-1.5`}
              onClick={() => setDesktopInstallOpen((prev) => !prev)}
              aria-expanded={desktopInstallOpen}
              aria-haspopup="menu"
            >
              Appliance Installation
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="mt-px opacity-70">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div
              className={cn(
                "absolute left-0 top-full mt-3 w-56 rounded-xl border border-[#efddae] bg-[#fffdf6] p-2 text-[#5f4714] shadow-2xl transition-all duration-200",
                desktopInstallOpen ? "visible opacity-100" : "invisible opacity-0",
              )}
            >
              {installationPages.map((installation) => (
                <Link
                  key={installation.slug}
                  href={`/installation/${installation.slug}`}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium normal-case tracking-normal hover:bg-[#fff5d6]"
                  onClick={() => setDesktopInstallOpen(false)}
                >
                  {installation.name}
                </Link>
              ))}
            </div>
          </div>
          <Link
            href="/about"
            className={cn(
              navItemClass,
              pathname === "/about" && "text-[#5f4714]",
            )}
          >
            About
          </Link>
          <Link
            href="/contact"
            className={cn(
              navItemClass,
              pathname === "/contact" && "text-[#5f4714]",
            )}
          >
            Contact
          </Link>
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="tel:+16133667009"
            className="flex h-11 items-center gap-2 rounded-full border border-[#9b7a2d] px-4 text-[12px] font-semibold tracking-[0.04em] transition hover:bg-[#fff1c9] lg:h-12"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
              <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
            </svg>
            {company.phone}
          </a>
          <Button href="/online-booking" variant="outline" className="h-11 gap-2 border-[#9b7a2d] bg-[#fffdf6] px-4 text-[12px] tracking-[0.04em] text-[#2f2512] hover:bg-[#fff1c9] lg:h-12">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Book Now
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <a
            href="tel:+16133667009"
            className="flex h-10 items-center gap-1.5 rounded-md border border-[#9b7a2d] px-2.5 text-xs font-semibold text-[#2f2512] transition hover:bg-[#fff1c9]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="opacity-80">
              <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
            </svg>
            <span className="sm:hidden">Call</span>
            <span className="hidden sm:inline">{company.phone}</span>
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="flex h-10 items-center gap-2 rounded-md border border-[#9b7a2d] px-3 text-sm font-semibold text-[#2f2512]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
            {mobileOpen ? "Close" : "Menu"}
          </button>
        </div>
      </Container>

      {mobileOpen && (
        <div className="border-t border-[#ead39a] bg-[#fff9e8] pb-5 text-[#2f2512] lg:hidden">
          <Container className="flex flex-col gap-2 pt-4">
            <button
              type="button"
              className="flex items-center justify-between rounded-md border border-[#9b7a2d] px-3 py-2.5 text-left text-sm font-semibold"
              onClick={() => setServicesOpen((prev) => !prev)}
            >
              Appliance Service
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={cn("transition", servicesOpen && "rotate-180")}>
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {servicesOpen &&
              servicePages.map((service) => (
                <Link
                  key={service.slug}
                  href={`/repair/${service.slug}`}
                  className="ml-3 rounded-md bg-[#fff2d0] px-3 py-2 text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {service.name}
                </Link>
              ))}
            <button
              type="button"
              className="flex items-center justify-between rounded-md border border-[#9b7a2d] px-3 py-2.5 text-left text-sm font-semibold"
              onClick={() => setInstallOpen((prev) => !prev)}
            >
              Appliance Installation
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={cn("transition", installOpen && "rotate-180")}>
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {installOpen &&
              installationPages.map((installation) => (
                <Link
                  key={installation.slug}
                  href={`/installation/${installation.slug}`}
                  className="ml-3 rounded-md bg-[#fff2d0] px-3 py-2 text-sm"
                  onClick={() => setMobileOpen(false)}
                >
                  {installation.name}
                </Link>
              ))}
            <Link href="/about" className="rounded-md border border-[#9b7a2d] px-3 py-2.5 text-sm font-semibold" onClick={() => setMobileOpen(false)}>About</Link>
            <Link href="/contact" className="rounded-md border border-[#9b7a2d] px-3 py-2.5 text-sm font-semibold" onClick={() => setMobileOpen(false)}>Contact</Link>
            <div className="mt-2 flex items-center gap-3">
              <a href="tel:+16133667009" className="rounded-full border border-[#9b7a2d] px-4 py-2 text-sm font-semibold">{company.phone}</a>
              <Button href="/online-booking" variant="outline" className="border-[#9b7a2d] bg-[#fffdf6] text-[#2f2512] hover:bg-[#fff1c9]">Book Now</Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
