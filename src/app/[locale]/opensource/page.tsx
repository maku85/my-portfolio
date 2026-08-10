import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import OpenSourceClient from "./OpenSourceClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "Metadata.opensource",
  });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function OpenSourcePage() {
  return <OpenSourceClient />;
}
