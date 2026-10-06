import type { Metadata } from "next";
import Script from "next/script";
import { Nunito_Sans, Sora } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { HcpBookingModal } from "@/components/sections/hcp-booking-modal";
import { JsonLd } from "@/components/seo/json-ld";
import { company, installationPages, servicePages } from "@/lib/site-data";
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
  metadataBase: new URL(company.url),
  alternates: { canonical: "./" },
  title: "SuperFix Mechanical | Ottawa Appliance Repair",
  description:
    "Reliable appliance repair and maintenance services across Ottawa.",
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "SuperFix Mechanical",
    images: [
      {
        url: "/superfix_logo.png",
        width: 1262,
        height: 597,
        alt: "SuperFix Mechanical logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/superfix_logo.png"],
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  "@id": `${company.url}/#business`,
  name: "SuperFix Mechanical",
  legalName: company.legalName,
  url: company.url,
  logo: `${company.url}/superfix_logo.png`,
  image: `${company.url}/superfix_logo.png`,
  telephone: "+1-613-366-7009",
  email: company.email,
  description:
    "Appliance repair and installation for fridges, washers, dryers, dishwashers, ovens, cooktops, microwaves, and range hoods across Ottawa.",
  address: {
    "@type": "PostalAddress",
    streetAddress: company.address.streetAddress,
    addressLocality: company.address.locality,
    addressRegion: company.address.region,
    addressCountry: company.address.country,
  },
  areaServed: [
    "Ottawa",
    "Kanata",
    "Nepean",
    "Orleans",
    "Barrhaven",
    "Stittsville",
    "Gloucester",
    "Manotick",
    "Riverside South",
    "Westboro",
    "Vanier",
    "Embrun",
  ].map((name) => ({ "@type": "Place", name })),
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Appliance repair and installation in Ottawa",
    itemListElement: [
      ...servicePages.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `${service.name} in Ottawa`,
          url: `${company.url}/repair/${service.slug}`,
        },
      })),
      ...installationPages.map((installation) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `${installation.name} in Ottawa`,
          url: `${company.url}/installation/${installation.slug}`,
        },
      })),
    ],
  },
  hasMap: company.googleMaps,
  sameAs: company.social,
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
        <JsonLd data={localBusinessSchema} />
        <SiteHeader />
        {children}
        <SiteFooter />
        <HcpBookingModal />
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
