"use client";

import { useTranslations } from "next-intl";

import CardMasonry from "@/components/CardMasonry";
import { initialCards } from "@/components/cards";

export default function Home() {
  const t = useTranslations("HomePage");

  return (
    <main className="pb-12 px-4">
      <div className="text-center opacity-70 mt-10 md:mt-4 mb-2">
        {t("subtitle")}
      </div>

      <CardMasonry cards={initialCards} shuffleLabel="Shake!" />
    </main>
  );
}
