import type { MetadataRoute } from "next";

import { publishedCompetencyParams } from "@/data/competencies";
import { routing } from "@/i18n/routing";
import { getAllEngineeringContent } from "@/lib/engineering-content";

const SITE_URL = "https://maurocunsolo.xyz";
const STATIC_PATHS = ["", "/projects", "/npm", "/opensource", "/engineering"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC_PATHS,
    ...getAllEngineeringContent().map((item) => `/engineering/${item.slug}`),
    ...publishedCompetencyParams().map(
      ({ slug, skill }) => `/engineering/${slug}/${skill}`,
    ),
  ];

  return paths.map((path) => ({
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
