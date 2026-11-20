import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/**
 * Le aree private non vanno indicizzate. ⚠️ /c/ NON va bloccato qui: un
 * Disallow fermerebbe anche i crawler di WhatsApp e social, che leggono
 * l'anteprima del link della vetrina (CLAUDE.md §6). Le vetrine hanno già
 * `noindex, follow` nei metadata.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/admin", "/checkout", "/carrello", "/api/"],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
