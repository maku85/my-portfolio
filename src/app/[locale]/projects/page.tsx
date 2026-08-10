import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import ProjectsClient from "./ProjectsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Metadata.projects" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function ProjectsPage() {
  return <ProjectsClient />;
}
