import type { MetadataRoute } from "next";
import { resolveAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/account", "/checkout", "/orders", "/api"] }],
    sitemap: `${resolveAppUrl()}/sitemap.xml`,
  };
}
