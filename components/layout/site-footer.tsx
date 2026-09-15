import Image from "next/image";
import Link from "next/link";
import { BrandStrip } from "@/components/layout/brand-strip";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { company, legalPages } from "@/lib/site-data";

export function SiteFooter() {
  return (
    <footer>
      <BrandStrip />
      <div className="border-t border-[#d9b557] bg-[#f4c542] pb-8 pt-12 text-[#2f2512] md:pt-14">
        <Container className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-5">
            <Image
              src="/superfix_logo.png"
              alt="SuperFix Mechanical logo"
              width={160}
              height={70}
              className="h-auto w-[160px]"
            />
            <ul className="space-y-3 text-sm text-[#5f4714]">
              <li className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
                  <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
                </svg>
                <a href="tel:+16133667009" className="hover:underline">{company.phone}</a>
              </li>
              <li className="flex items-start gap-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="mt-0.5 shrink-0 opacity-70">
                  <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                <a href={`mailto:${company.email}`} className="hover:underline">{company.email}</a>
              </li>
            </ul>
            <Button href="/online-booking" variant="outline" className="gap-2 border-[#7a5d1f] bg-[#fff8df] text-[#2f2512] hover:bg-[#fff2c9]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Book Now
            </Button>
            <div className="flex gap-3 pt-1">
              <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7a5d1f] transition hover:bg-[#fff2c9]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" /></svg>
              </a>
              <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#7a5d1f] transition hover:bg-[#fff2c9]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-bold">About Company</h3>
            <ul className="space-y-2.5 text-sm text-[#5f4714]">
              <li><Link className="hover:underline" href="/about">About</Link></li>
              <li><Link className="hover:underline" href="/contact">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-bold">Help & Support</h3>
            <ul className="space-y-2.5 text-sm text-[#5f4714]">
              {legalPages.map((item) => (
                <li key={item.href}>
                  <Link className="hover:underline" href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>
    </footer>
  );
}
