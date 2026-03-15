"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaArrowLeft } from "react-icons/fa";

import CardMasonry from "@/components/CardMasonry";
import { gameCards } from "@/components/cards";

export default function GamesPage() {
  const t = useTranslations("GamesPage");

  return (
    <>
      <main className="pt-8 pb-12 px-4">
        <div className="mt-10 mb-8 flex flex-col items-center">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 text-center italic tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">
            {t("subtitle")}
          </p>
        </div>

        <div className="mb-12">
          <Link
            href="/"
            className="mb-8 flex items-center gap-2 text-primary hover:text-accent transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <FaArrowLeft /> {t("backToHome")}
          </Link>
        </div>

        <CardMasonry cards={gameCards} shuffleLabel="Shake!" />
      </main>
    </>
  );
}
