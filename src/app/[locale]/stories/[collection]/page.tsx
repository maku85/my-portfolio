import Link from "next/link";
import { useTranslations } from "next-intl";
import { FaArrowLeft } from "react-icons/fa";
import { getCollectionsAndChapters } from "@/lib/stories";

interface Props {
  params: { collection: string; locale: string };
}

export default function CollectionPage({ params }: Props) {
  const t = useTranslations("StoriesPage");
  const lang = params.locale || "it";
  const collectionName = params.collection;
  const collections = getCollectionsAndChapters(lang);
  const collection = collections.find((c) => c.name === collectionName);

  if (!collection) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <p className="text-xl text-stone-500">{t("noStories")}</p>
        <Link href="/stories" className="mt-8 inline-block text-primary underline">{t("backToHome")}</Link>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <Link
          href="/stories"
          className="inline-flex items-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition font-sans text-sm tracking-wider uppercase"
        >
          <FaArrowLeft className="mr-2" />
          {t("backToHome")}
        </Link>
      </div>

      <main className="bg-[#fdfbf7] dark:bg-stone-900 shadow-2xl rounded-sm mb-12 p-8 sm:p-12 md:p-16 text-stone-800 dark:text-stone-300 font-serif book-page">
        <div className="text-center mb-16 border-b border-stone-200 dark:border-stone-800 pb-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-stone-900 dark:text-stone-100 tracking-tight">
            {collection.name.replace(/-/g, " ")}
          </h1>
          <p className="text-xl text-stone-500 italic mt-4">
            {collection.chapters[0]?.frontmatter.excerpt || ""}
          </p>
        </div>

        <ul className="flex flex-col space-y-4">
          {collection.chapters.map((chapter, index) => {
            const pageNumber = index * 14 + 9;
            return (
              <li key={chapter.slug} className="group">
                <Link
                  href={`/stories/${collection.name}/${chapter.slug}`}
                  className="flex items-baseline w-full text-stone-800 dark:text-stone-200 hover:text-stone-500 dark:hover:text-stone-400 transition-colors"
                >
                  <span className="text-xl md:text-2xl font-bold group-hover:italic pr-2 bg-[#fdfbf7] dark:bg-stone-900 z-10 shrink-0">
                    {index +1}. {chapter.frontmatter.title}
                  </span>
                  <span className="flex-grow border-b-2 border-dotted border-stone-300 dark:border-stone-700 mx-2 mb-1 relative top-[-6px]" />
                  <span className="text-lg md:text-xl font-serif pl-2 bg-[#fdfbf7] dark:bg-stone-900 z-10 shrink-0">
                    {pageNumber}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
