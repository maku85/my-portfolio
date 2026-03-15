import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaArrowLeft } from "react-icons/fa";
import StoriesList from "@/components/StoriesList";
import { getCollectionsAndChapters } from "@/lib/stories";

export default function StoriesPage() {
  const t = useTranslations("StoriesPage");
  const lang = "it";
  const collections = getCollectionsAndChapters(lang);

  return (
    <main className="pt-8 pb-12 px-4 max-w-7xl mx-auto">
      <div className="mt-10 mb-8 flex flex-col items-center">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-4 text-center italic tracking-tighter uppercase">
          {t("title")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-lg text-lg">
          {t("subtitle")}
        </p>
      </div>

      <div className="mb-12 flex justify-start">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary hover:text-accent transition-colors font-bold uppercase text-xs tracking-widest bg-slate-100 dark:bg-slate-800/50 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700"
        >
          <FaArrowLeft /> {t("backToHome")}
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-20 italic text-stone-500">
          <p className="text-xl">{t("noStories")}</p>
        </div>
      ) : (
        <StoriesList collections={collections} />
      )}
    </main>
  );
}
