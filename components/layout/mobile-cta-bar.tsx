import Link from "next/link";
import { company } from "@/lib/site-data";

/**
 * Call / Book bar pinned to the bottom of the screen on phones. Book Now links to
 * /online-booking, which the HCP booking modal intercepts to open the form in place.
 */
export function MobileCtaBar() {
  return (
    <>
      {/* Spacer so the bar never covers the end of the footer */}
      <div aria-hidden className="h-[72px] md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#d9b557] bg-[#fffdf6]/95 px-3 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-12px_rgba(47,37,18,0.35)] backdrop-blur md:hidden">
        <div className="flex gap-2.5">
          <a
            href="tel:+16133667009"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#9b7a2d] bg-white text-sm font-bold text-[#2f2512]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.25 1.01l-2.2 2.2z" />
            </svg>
            Call {company.phone}
          </a>
          <Link
            href="/online-booking"
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-[#f4c542] text-sm font-bold text-[#2f2512] shadow-[0_8px_18px_-10px_rgba(141,97,14,0.7)]"
          >
            Book Now
          </Link>
        </div>
      </div>
    </>
  );
}
