"use client";

import { useTranslations } from "next-intl";

import CardMasonry from "@/components/CardMasonry";
import { initialCards } from "@/components/cards";
import Navbar from "@/components/Navbar";

export default function HomeClient() {
  const t = useTranslations("HomePage");

  return (
    <>
      <Navbar />
      <main className="pb-12 px-4">
        <h1 className="sr-only">{t("title")}</h1>
        <div className="text-center opacity-70 mt-10 md:mt-4 mb-6">
          {t("subtitle")}
        </div>

        <CardMasonry cards={initialCards} shuffleLabel="Shake!" />
      </main>
    </>
  );
}
