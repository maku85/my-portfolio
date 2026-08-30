import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { documentedAreas, hubProjects } from "@/data/competencies";
import {
  type AreaEvidence,
  getAreaEvidence,
  getEngineeringContentByType,
  localizeContent,
} from "@/lib/engineering-content";

import EngineeringClient from "./EngineeringClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Metadata.engineering",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function EngineeringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const byType = (type: "note" | "experiment" | "project") =>
    getEngineeringContentByType(type).map(({ body, ...meta }) =>
      localizeContent(meta, locale),
    );

  const evidence: Record<string, AreaEvidence> = Object.fromEntries(
    documentedAreas.map((area) => [area.slug, getAreaEvidence(area.slug)]),
  );

  return (
    <EngineeringClient
      notes={byType("note")}
      experiments={byType("experiment")}
      projects={byType("project")}
      competencyProjects={hubProjects()}
      evidence={evidence}
    />
  );
}
