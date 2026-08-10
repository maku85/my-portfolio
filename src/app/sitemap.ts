import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

const SITE_URL = "https://maurocunsolo.xyz";
const PATHS = ["", "/projects", "/npm", "/opensource"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    alternates: {
      languages: Object.fromEntries(
        routing.locales.map((locale: string) => [
          locale,
          locale === routing.defaultLocale
            ? `${SITE_URL}${path}`
            : `${SITE_URL}/${locale}${path}`,
        ]),
      ),
    },
  }));
}
