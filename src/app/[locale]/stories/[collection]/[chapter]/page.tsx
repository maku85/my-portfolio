import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import { getChapterByPath } from "@/lib/stories";

interface Props {
  params: { collection: string; chapter: string; locale: string };
}

export default function ChapterPage({ params }: Props) {
  const { collection, chapter, locale } = params;
  const lang = locale || "it";
  const story = getChapterByPath(lang, collection, chapter);

  if (!story) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-12">
        <Link
          href={`/stories/${collection}`}
          className="inline-flex items-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition font-sans text-sm tracking-wider uppercase"
        >
          <FaArrowLeft className="mr-2" />
          Torna all'indice
        </Link>
      </div>

      <main className="bg-[#fdfbf7] font-serif dark:bg-stone-900 shadow-2xl rounded-sm mb-12 p-8 sm:p-12 md:p-16 text-stone-800 dark:text-stone-300 book-page">
        <article
          className="prose prose-stone prose-lg max-w-none dark:prose-invert font-serif text-justify
          [&>p]:indent-8 [&>p]:mb-4 [&>p]:leading-relaxed
          [&>p:first-of-type]:indent-0 [&>p:first-of-type]:mt-10
          [&>p:first-of-type::first-letter]:text-7xl [&>p:first-of-type::first-letter]:font-bold [&>p:first-of-type::first-letter]:float-left [&>p:first-of-type::first-letter]:mr-3 [&>p:first-of-type::first-letter]:mt-[-0.1em] [&>p:first-of-type::first-letter]:text-stone-900 dark:[&>p:first-of-type::first-letter]:text-stone-100
          [&>p:first-of-type::first-letter]:font-serif
          "
        >
          <header className="mt-12 mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-stone-900 dark:text-stone-100 leading-tight">
              {story.frontmatter.title}
            </h1>
          </header>

          <ReactMarkdown>{story.content}</ReactMarkdown>
        </article>

        <div className="mt-20 pt-8 flex justify-center text-stone-400">
          <span className="text-2xl space-x-4">
            <span>&#10086;</span>
            <span>&#10086;</span>
            <span>&#10086;</span>
          </span>
        </div>
      </main>
    </div>
  );
}
