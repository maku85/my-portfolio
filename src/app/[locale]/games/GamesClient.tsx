"use client";

import { useLocale, useTranslations } from "next-intl";
import { FaArrowLeft, FaGamepad, FaPlay } from "react-icons/fa";

import CardMasonry from "@/components/CardMasonry";
import ProjectCard from "@/components/cards/ProjectCard";
import { games } from "@/data/games";
import { localize } from "@/data/localized";
import { Link } from "@/i18n/navigation";

export default function GamesClient() {
  const locale = useLocale();
  const t = useTranslations("GamesPage");

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
          className="mb-8 flex items-center gap-2 text-primary hover:text-accent transition-colors font-bold uppercase text-xs tracking-widest"
        >
          <FaArrowLeft aria-hidden="true" /> {t("backToHome")}
        </Link>
      </div>

      {games.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-blue-200 mt-20">
          <FaGamepad size={40} className="mx-auto mb-4" aria-hidden="true" />
          <p className="text-2xl mb-4">{t("noGames")}</p>
          <p>{t("checkBackLater")}</p>
        </div>
      ) : (
        <CardMasonry
          cards={games.map((game) => () => (
            <ProjectCard
              key={game.name}
              imageUrl={game.imageUrl ?? "/games.webp"}
              title={game.name}
              subtitle="Unity"
              text={localize(game.description, locale)}
              buttonLabel={t("play")}
              buttonIcon={<FaPlay aria-hidden="true" />}
              buttonHref={game.playUrl}
            />
          ))}
        />
      )}
    </main>
  );
}
