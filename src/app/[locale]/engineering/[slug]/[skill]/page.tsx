import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import Breadcrumb from "@/components/engineering/Breadcrumb";
import ContentItem, {
  emptyStateClass,
  tagClass,
} from "@/components/engineering/ContentItem";
import {
  areaTitleFor,
  competencyHref,
  contentTags,
  getCompetency,
  isPublished,
  resolveProjects,
  resolveRelated,
} from "@/data/competencies";
import { baseText, type LocalizedText, localize } from "@/data/localized";
import {
  type EngineeringContentMeta,
  getEngineeringContentBySlug,
  getEngineeringContentByTags,
  localizeContent,
} from "@/lib/engineering-content";

type Params = { locale: string; slug: string; skill: string };

const NOTES_ON_PAGE = 8;

const sectionHeadingBlock =
  "border-b border-gray-200 dark:border-gray-700 pb-2 mb-6";
const sectionHeading = "text-2xl font-bold text-gray-900 dark:text-primary";
const lightHeading = "text-xl font-bold text-gray-900 dark:text-primary mb-3";
const stepLabel =
  "text-[11px] font-semibold uppercase tracking-wide text-gray-400";
const stepConnector = "ml-1 my-3 h-5 w-px bg-gray-200 dark:bg-gray-700";

const slugifyTopic = (value: string) =>
  value.toLowerCase().replace(/[()]/g, "").trim().replace(/\s+/g, "-");

const topicKeyOf = (topic: LocalizedText) => slugifyTopic(baseText(topic));

function TopicPill({
  label,
  topicKey,
  basePath,
  activeTopic,
  hasContent,
}: {
  label: string;
  topicKey: string;
  basePath: string;
  activeTopic?: string;
  hasContent: boolean;
}) {
  if (!hasContent) {
    return <li className={`${tagClass} opacity-60`}>{label}</li>;
  }
  const active = activeTopic === topicKey;
  return (
    <li>
      <Link
        href={active ? basePath : `${basePath}?topic=${topicKey}`}
        aria-current={active ? "true" : undefined}
        className={`${tagClass} transition ${
          active ? "border-primary text-primary" : "hover:border-primary"
        }`}
      >
        {label}
      </Link>
    </li>
  );
}

const monthYear = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, slug, skill } = await params;
  const competency = getCompetency(slug, skill);
  if (!competency || !isPublished(competency)) return {};
  return {
    title: competency.title,
    description: localize(competency.description, locale),
  };
}

function SectionHead({
  id,
  title,
  def,
  heavy,
}: {
  id: string;
  title: string;
  def?: string;
  heavy: boolean;
}) {
  if (!heavy) {
    return (
      <h2 id={id} className={lightHeading}>
        {title}
      </h2>
    );
  }
  return (
    <div className={sectionHeadingBlock}>
      <h2 id={id} className={sectionHeading}>
        {title}
      </h2>
      {def && (
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
          {def}
        </p>
      )}
    </div>
  );
}

function Feed({
  items,
  featuredLabel,
  empty,
}: {
  items: EngineeringContentMeta[];
  featuredLabel: string;
  empty: string;
}) {
  if (items.length === 0) {
    return <p className={emptyStateClass}>{empty}</p>;
  }
  return (
    <div className="space-y-8">
      {items.map((item) => (
        <ContentItem
          key={item.slug}
          item={item}
          featuredLabel={featuredLabel}
        />
      ))}
    </div>
  );
}

export default async function EngineeringCompetencyPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ topic?: string }>;
}) {
  const { locale, slug, skill } = await params;
  const { topic: rawTopic } = await searchParams;
  const competency = getCompetency(slug, skill);
  if (!competency || !isPublished(competency)) notFound();

  const t = await getTranslations({ locale, namespace: "EngineeringPage" });
  const basePath = competencyHref(competency);
  const tags = contentTags(competency);
  const areaTitle = areaTitleFor(competency);

  const allItems = getEngineeringContentByTags(competency.area, tags);
  const topicCounts = new Map<string, number>();
  for (const item of allItems) {
    for (const raw of item.topics) {
      const key = slugifyTopic(raw);
      topicCounts.set(key, (topicCounts.get(key) ?? 0) + 1);
    }
  }
  const hasTopicContent = (topic: LocalizedText) =>
    (topicCounts.get(topicKeyOf(topic)) ?? 0) > 0;

  const activeTopic =
    rawTopic && topicCounts.has(rawTopic) ? rawTopic : undefined;
  const activeTopicRaw = competency.topics.find(
    (topic) => topicKeyOf(topic) === activeTopic,
  );

  const localizeMeta = (item: EngineeringContentMeta) =>
    localizeContent(item, locale);
  const byTopic = (items: EngineeringContentMeta[]) =>
    activeTopic
      ? items.filter((item) =>
          item.topics.some((raw) => slugifyTopic(raw) === activeTopic),
        )
      : items;

  const notes = byTopic(
    getEngineeringContentByTags(competency.area, tags, "note").map(
      ({ body, ...meta }) => meta,
    ),
  ).map(localizeMeta);
  const experiments = byTopic(
    getEngineeringContentByTags(competency.area, tags, "experiment").map(
      ({ body, ...meta }) => meta,
    ),
  ).map(localizeMeta);
  const contentProjects = getEngineeringContentByTags(
    competency.area,
    tags,
    "project",
  )
    .map(({ body, ...meta }) => meta)
    .map(localizeMeta);
  const visibleNotes = notes.slice(0, NOTES_ON_PAGE);

  const projects = resolveProjects(competency);
  const related = resolveRelated(competency);
  const hasProjects = projects.length > 0 || contentProjects.length > 0;

  const builtOnNotes = new Map<string, { slug: string; title: string }[]>();
  for (const project of projects) {
    if (!project.builtOn) continue;
    builtOnNotes.set(
      project.name,
      project.builtOn.noteSlugs
        .map((noteSlug) => getEngineeringContentBySlug(noteSlug))
        .filter((note): note is NonNullable<typeof note> => note !== null)
        .map((note) => ({
          slug: note.slug,
          title: localizeContent(note, locale).title,
        })),
    );
  }

  const emptyNotes = activeTopic ? t("filterNoMatch") : t("notesEmpty");
  const emptyExperiments = activeTopic
    ? t("filterNoMatch")
    : t("experimentsEmpty");

  return (
    <main className="pt-8 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb
          label={t("breadcrumbLabel")}
          items={[
            { label: t("title"), href: "/engineering" },
            { label: areaTitle },
            { label: competency.title },
          ]}
        />

        <header className="mt-8">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {competency.title}
          </h1>
          {competency.tagline && (
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-primary">
              {localize(competency.tagline, locale)}
            </p>
          )}

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <div className="flex items-baseline gap-1.5">
              <dt className="font-semibold text-primary">{t("levelBadge")}</dt>
              <dd className="text-gray-700 dark:text-blue-200">
                {t(`level_${competency.experienceLevel}`)}
              </dd>
            </div>
            <div className="flex items-baseline gap-1.5">
              <dt className="font-semibold text-gray-500 dark:text-gray-400">
                {t("statusBadge")}
              </dt>
              <dd className="text-gray-600 dark:text-gray-300">
                {t(`status_${competency.status}`)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            {localize(competency.description, locale)}
          </p>

          {(competency.startedAt || competency.updatedAt) && (
            <p className="mt-2 text-xs text-gray-400">
              {competency.startedAt && (
                <span>
                  {t("startedLabel")}{" "}
                  {new Date(competency.startedAt).getFullYear()}
                </span>
              )}
              {competency.startedAt && competency.updatedAt && " · "}
              {competency.updatedAt && (
                <span>
                  {t("updatedLabel")} {monthYear(competency.updatedAt)}
                </span>
              )}
            </p>
          )}
        </header>

        <div className="mt-12 space-y-12">
          {competency.experience && (
            <section aria-labelledby="competency-background">
              <h2 id="competency-background" className={lightHeading}>
                {t("backgroundTitle")}
              </h2>
              <p className="max-w-2xl text-gray-700 dark:text-gray-200 leading-relaxed">
                {localize(competency.experience, locale)}
              </p>
            </section>
          )}

          <p className="max-w-2xl text-sm text-gray-500 dark:text-gray-400">
            {t("competencyOverview")}
            {competency.scope ? ` ${localize(competency.scope, locale)}` : ""}
          </p>

          {activeTopic && activeTopicRaw && (
            <p className="text-sm text-gray-500 dark:text-gray-300">
              {t("filterActive")}{" "}
              <span className="font-semibold text-primary">
                {localize(activeTopicRaw, locale)}
              </span>
              {" · "}
              <Link href={basePath} className="hover:text-accent transition">
                {t("filterClear")}
              </Link>
            </p>
          )}

          <section aria-labelledby="competency-notes">
            <SectionHead
              id="competency-notes"
              title={t("notesTitle")}
              def={t("notesText")}
              heavy
            />
            <Feed
              items={visibleNotes}
              featuredLabel={t("featuredLabel")}
              empty={emptyNotes}
            />
            {notes.length > NOTES_ON_PAGE && (
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
                {t("notesTruncated", {
                  shown: visibleNotes.length,
                  total: notes.length,
                })}
              </p>
            )}
          </section>

          <section aria-labelledby="competency-experiments">
            <SectionHead
              id="competency-experiments"
              title={t("experimentsTitle")}
              def={experiments.length > 0 ? t("experimentsText") : undefined}
              heavy={experiments.length > 0}
            />
            <Feed
              items={experiments}
              featuredLabel={t("featuredLabel")}
              empty={emptyExperiments}
            />
          </section>

          <section aria-labelledby="competency-projects">
            <SectionHead
              id="competency-projects"
              title={t("projectsTitle")}
              def={hasProjects ? t("projectsText") : undefined}
              heavy={hasProjects}
            />
            {hasProjects ? (
              <div className="space-y-8">
                {projects.map((project) => (
                  <div
                    key={project.name}
                    className="rounded-md border border-gray-100 dark:border-gray-700 bg-card-background p-6 shadow-sm"
                  >
                    {project.builtOn && (
                      <div className="mb-4">
                        {project.builtOn.topics.length > 0 && (
                          <>
                            <p className={stepLabel}>
                              {t("chainConceptsLabel")}
                            </p>
                            <ul className="mt-1.5 flex flex-wrap gap-1.5">
                              {project.builtOn.topics.map((topic) => (
                                <TopicPill
                                  key={topicKeyOf(topic)}
                                  label={localize(topic, locale)}
                                  topicKey={topicKeyOf(topic)}
                                  basePath={basePath}
                                  activeTopic={activeTopic}
                                  hasContent={hasTopicContent(topic)}
                                />
                              ))}
                            </ul>
                            <div className={stepConnector} aria-hidden />
                          </>
                        )}
                        {(builtOnNotes.get(project.name)?.length ?? 0) > 0 && (
                          <>
                            <p className={stepLabel}>{t("chainNotesLabel")}</p>
                            <ul className="mt-1.5 space-y-1">
                              {builtOnNotes.get(project.name)?.map((note) => (
                                <li key={note.slug}>
                                  <Link
                                    href={`/engineering/${note.slug}`}
                                    className="text-sm font-semibold text-gray-900 dark:text-primary hover:text-accent transition"
                                  >
                                    {note.title}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                            <div className={stepConnector} aria-hidden />
                          </>
                        )}
                        <p className={stepLabel}>{t("chainProjectLabel")}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-primary">
                        {project.name}
                      </h3>
                      {project.authored && (
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                          {t("projectAuthoredLabel")}
                        </span>
                      )}
                    </div>
                    {project.description && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {localize(project.description, locale)}
                      </p>
                    )}
                    {project.authored && !project.builtOn && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {t("projectSameAnalysis")}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      <Link
                        href={project.href}
                        className="hover:text-accent transition"
                      >
                        {project.primaryLink === "npm"
                          ? t("npmPageLink")
                          : t("projectOpenLink")}{" "}
                        →
                      </Link>
                      {project.sourceHref && (
                        <a
                          href={project.sourceHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-accent transition"
                        >
                          {t("sourceLink")} →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                {contentProjects.map((item) => (
                  <ContentItem
                    key={item.slug}
                    item={item}
                    featuredLabel={t("featuredLabel")}
                  />
                ))}
              </div>
            ) : (
              <p className={emptyStateClass}>{t("projectsEmpty")}</p>
            )}
          </section>

          {competency.topics.length > 0 && (
            <section aria-labelledby="competency-topics">
              <h2 id="competency-topics" className={lightHeading}>
                {t("topicsTitle")}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {competency.topics.map((topic) => (
                  <TopicPill
                    key={topicKeyOf(topic)}
                    label={localize(topic, locale)}
                    topicKey={topicKeyOf(topic)}
                    basePath={basePath}
                    activeTopic={activeTopic}
                    hasContent={hasTopicContent(topic)}
                  />
                ))}
              </ul>
            </section>
          )}

          {related.length > 0 && (
            <section aria-labelledby="competency-related">
              <h2 id="competency-related" className={lightHeading}>
                {t("relatedTitle")}
              </h2>
              <p className="mb-3 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
                {t("relatedText")}
              </p>
              <ul className="flex flex-wrap gap-2">
                {related.map((entry) => (
                  <li key={entry.label}>
                    {entry.href ? (
                      <Link
                        href={entry.href}
                        className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:border-primary hover:text-primary transition"
                      >
                        {entry.label}
                      </Link>
                    ) : (
                      <span className="rounded-md border border-gray-200 dark:border-gray-700 px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                        {entry.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
