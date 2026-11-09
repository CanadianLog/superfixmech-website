import type { MetadataRoute } from "next";

/** Lets phones install the CRM to the home screen and open it full-screen like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SuperFix CRM",
    short_name: "SuperFix",
    description: "Jobs, schedule, customers and invoices for SuperFix Mechanical.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1f1a10",
    theme_color: "#1f1a10",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
