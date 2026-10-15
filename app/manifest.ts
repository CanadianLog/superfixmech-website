import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SuperFix Mechanical",
    short_name: "SuperFix",
    description: "Appliance repair and installation in Ottawa.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffdf6",
    theme_color: "#f4c542",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
