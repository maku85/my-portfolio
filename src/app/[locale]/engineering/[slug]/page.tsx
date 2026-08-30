import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import ReactMarkdown from "react-markdown";

import Breadcrumb from "@/components/engineering/Breadcrumb";
import { competencyHref, getCompetencyForContent } from "@/data/competencies";
import { engineeringAreas } from "@/data/engineering";
import {
  getEngineeringContentBySlug,
  getRelatedEngineeringContent,
  localizeContent,
} from "@/lib/engineering-content";

type Params = { locale: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = getEngineeringContentBySlug(slug);
  if (!item) return {};
  const view = localizeContent(item, locale);
  return { title: view.title, description: view.description };
}

const markdownClass =
  "text-gray-700 dark:text-gray-200 leading-relaxed [&_p]:my-4 " +
  "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl " +
  "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_a]:text-primary [&_a]:underline [&_code]:text-sm " +
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-gray-100 " +
  "[&_pre]:dark:bg-gray-800 [&_pre]:p-4 [&_blockquote]:border-l-4 " +
  "[&_blockquote]:border-gray-200 [&_blockquote]:dark:border-gray-700 [&_blockquote]:pl-4 " +
  "[&_blockquote]:italic";

export default async function EngineeringContentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const item = getEngineeringContentBySlug(slug);
  if (!item) notFound();

  const t = await getTranslations({ locale, namespace: "EngineeringPage" });
  const competency = getCompetencyForContent(item.area, item.topics);
  const related = getRelatedEngineeringContent(item).map((entry) =>
    localizeContent(entry, locale),
  );
  const areaTitle =
    engineeringAreas.find((area) => area.slug === item.area)?.title ??
    item.area;
  const view = localizeContent(item, locale);

  return (
    <main className="pt-8 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Breadcrumb
            label={t("breadcrumbLabel")}
            items={[
              { label: t("title"), href: "/engineering" },
              competency
                ? {
                    label: competency.title,
                    href: competencyHref(competency),
                  }
                : { label: areaTitle },
              { label: view.title },
            ]}
          />
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">
          {t(`type_${item.type}`)}
        </p>
        <h1 className="mb-3 text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          {view.title}
        </h1>
        <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          <span className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-gray-500 dark:text-gray-400">
            {areaTitle}
          </span>
          <time dateTime={item.date}>
            {new Date(item.date).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>
        <p className="mb-8 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          {view.description}
        </p>

        {item.body && (
          <div className={markdownClass}>
            <ReactMarkdown>{item.body}</ReactMarkdown>
          </div>
        )}

        {item.topics.length > 0 && (
          <ul className="mt-8 flex flex-wrap gap-2">
            {item.topics.map((topic) => (
              <li
                key={topic}
                className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400"
              >
                {topic}
              </li>
            ))}
          </ul>
        )}

        {related.length > 0 && (
          <section className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-primary">
              {t("relatedTitle")}
            </h2>
            <ul className="space-y-3">
              {related.map((entry) => (
                <li key={entry.slug}>
                  <Link href={`/engineering/${entry.slug}`} className="group">
                    <span className="font-semibold text-gray-900 dark:text-primary group-hover:text-accent transition">
                      {entry.title}
                    </span>
                    <span className="block text-sm text-gray-500 dark:text-gray-300">
                      {entry.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
