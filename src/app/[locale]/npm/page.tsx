"use client";

import Link from "next/link";
import { FaArrowLeft } from "react-icons/fa";

import CardMasonry from "@/components/CardMasonry";
import { NpmCard } from "@/components/cards/NpmCard";
import { libraries } from "@/data/libraries";
import { useTranslations } from "next-intl";

export default function NpmProjects() {
const t = useTranslations("NpmProjectsPage");

  return (
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
          className="inline-flex items-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition font-sans text-sm tracking-wider uppercase"
        >
          <FaArrowLeft className="mr-2" />
          {t("backToHome")}
        </Link>
      </div>

      <CardMasonry
        cards={libraries.map((project) => () => (
          <NpmCard key={project.name} project={project} />
        ))}
      />
    </main>
  );
}
