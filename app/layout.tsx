import type { Metadata } from "next";
import Script from "next/script";
import { Nunito_Sans, Sora } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "SuperFixMech",
  description:
    "Reliable appliance repair and maintenance services across Ottawa.",
};

const tawkPropertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
const tawkWidgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${nunito.variable} ${sora.variable} antialiased`}>
        <SiteHeader />
        {children}
        <SiteFooter />
        {tawkPropertyId && tawkWidgetId ? (
          <Script id="tawkto-widget" strategy="afterInteractive">
            {`
              var Tawk_API = Tawk_API || {};
              var Tawk_LoadStart = new Date();
              (function () {
                var s1 = document.createElement("script");
                var s0 = document.getElementsByTagName("script")[0];
                s1.async = true;
                s1.src = "https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}";
                s1.charset = "UTF-8";
                s1.setAttribute("crossorigin", "*");
                s0.parentNode.insertBefore(s1, s0);
              })();
            `}
          </Script>
        ) : null}
      </body>
    </html>
  );
}
