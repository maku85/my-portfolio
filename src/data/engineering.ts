import type { LocalizedText } from "@/data/localized";

export interface EngineeringArea {
  slug: string;
  title: string;
  experience?: LocalizedText;
}

export const engineeringAreas: EngineeringArea[] = [
  {
    slug: "backend",
    title: "Backend",
    experience: {
      en: "Node.js in production at Artshell since 2019; full-stack engineering roles since 2016.",
      it: "Node.js in produzione in Artshell dal 2019; ruoli di full-stack engineering dal 2016.",
    },
  },
  { slug: "cloud-infrastructure", title: "Cloud & Infrastructure" },
  { slug: "data", title: "Data" },
];

export const currentFocus: LocalizedText[] = [
  { en: "AWS architecture", it: "Architettura AWS" },
];

export const engineeringAreaSlugs: string[] = engineeringAreas.map(
  (area) => area.slug,
);
