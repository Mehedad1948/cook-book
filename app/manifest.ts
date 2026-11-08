import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND,
    short_name: BRAND,
    description: "دستور پخت‌های دقیق ایرانی؛ بار اول درست دربیاید.",
    start_url: "/",
    display: "standalone",
    lang: "fa",
    dir: "rtl",
    background_color: "#ffffff",
    theme_color: "#7a58e8",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
