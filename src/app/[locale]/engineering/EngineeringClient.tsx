"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FaArrowLeft } from "react-icons/fa";
import Card from "@/components/Card";
import ContentItem, {
  emptyStateClass,
} from "@/components/engineering/ContentItem";
import {
  type AreaSkill,
  documentedAreas,
  type HubProject,
  skillsForArea,
} from "@/data/competencies";
import { currentFocus } from "@/data/engineering";
import { localize } from "@/data/localized";
import type {
  AreaEvidence,
  EngineeringContentMeta,
} from "@/lib/engineering-content";

interface EngineeringClientProps {
  notes: EngineeringContentMeta[];
  experiments: EngineeringContentMeta[];
  projects: EngineeringContentMeta[];
  competencyProjects: HubProject[];
  evidence: Record<string, AreaEvidence>;
}

const contentHeadingBlock =
  "border-b border-gray-200 dark:border-gray-700 pb-2 mb-6";
const contentHeading = "text-2xl font-bold text-gray-900 dark:text-primary";
const contentDef = "mt-1 text-sm text-gray-500 dark:text-gray-300 max-w-2xl";

function renderSkills(skills: AreaSkill[], areaSlug: string) {
  return skills.map((skill, index) => (
    <span key={skill.slug}>
      {index > 0 ? " · " : ""}
      {skill.hasPage ? (
        <Link
          href={`/engineering/${areaSlug}/${skill.slug}`}
          className="hover:text-accent transition"
        >
          {skill.title}
        </Link>
      ) : (
        skill.title
      )}
    </span>
  ));
}

export default function EngineeringClient({
  notes,
  experiments,
  projects,
  competencyProjects,
  evidence,
}: EngineeringClientProps) {
  const t = useTranslations("EngineeringPage");
  const locale = useLocale();
  const areaLabel = (slug: string) =>
    documentedAreas.find((area) => area.slug === slug)?.title ?? slug;

  const sections: {
    id: string;
    title: string;
    def: string;
    empty: string;
    items: EngineeringContentMeta[];
  }[] = [
    {
      id: "eng-notes",
      title: t("notesTitle"),
      def: t("notesText"),
      empty: t("notesEmpty"),
      items: notes,
    },
    {
      id: "eng-experiments",
      title: t("experimentsTitle"),
      def: t("experimentsText"),
      empty: t("experimentsEmpty"),
      items: experiments,
    },
  ];

  const hasProjects = competencyProjects.length > 0 || projects.length > 0;

  return (
    <main className="pt-8 pb-12 px-4">
      <div className="mt-10 mb-8 flex flex-col items-center">
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-2 text-center italic tracking-tighter">
          {t("title")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-center max-w-2xl">
          {t("intro")}
        </p>
        {currentFocus.length > 0 && (
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 text-center">
            {t("currentFocusLabel")}:{" "}
            {currentFocus.map((f) => localize(f, locale)).join(" · ")}
          </p>
        )}
      </div>

      <div className="mb-12">
        <Link
          href="/"
          className="inline-flex items-center text-stone-500 hover:text-stone-800 dark:hover:text-stone-100 transition font-sans text-sm tracking-wider uppercase"
        >
          <FaArrowLeft className="mr-2" aria-hidden />
          {t("backToHome")}
        </Link>
      </div>

      <div className="max-w-6xl mx-auto space-y-14">
        <section aria-labelledby="eng-areas">
          <h2
            id="eng-areas"
            className="text-2xl font-bold text-gray-900 dark:text-primary mb-2"
          >
            {t("areasTitle")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-300 max-w-2xl mb-6">
            {t("areasText")}
          </p>
          <div className="grid gap-6 md:grid-cols-3 items-start">
            {documentedAreas.map((area) => {
              const counts = evidence[area.slug] ?? {
                notes: 0,
                experiments: 0,
                projects: 0,
              };
              const skills = skillsForArea(area.slug);
              const using = skills.filter((skill) => skill.group === "using");
              const learning = skills.filter(
                (skill) => skill.group === "learning",
              );

              return (
                <Card key={area.slug} title={area.title}>
                  {area.experience && (
                    <p className="text-sm italic text-gray-500 dark:text-gray-300">
                      {localize(area.experience, locale)}
                    </p>
                  )}
                  {using.length > 0 && (
                    <p className="mt-2 text-sm">
                      <span className="font-semibold text-primary">
                        {t("workingWith")}:
                      </span>{" "}
                      <span className="text-gray-700 dark:text-blue-200">
                        {renderSkills(using, area.slug)}
                      </span>
                    </p>
                  )}
                  {learning.length > 0 && (
                    <p className="mt-1 text-sm">
                      <span className="font-semibold text-primary">
                        {t("learning")}:
                      </span>{" "}
                      <span className="text-gray-700 dark:text-blue-200">
                        {renderSkills(learning, area.slug)}
                      </span>
                    </p>
                  )}
                  <p className="mt-3 text-xs text-gray-400">
                    {t("notesCount", { count: counts.notes })}
                    {" · "}
                    {t("experimentsCount", { count: counts.experiments })}
                    {" · "}
                    {t("projectsCount", { count: counts.projects })}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {sections.map((section) => (
          <section key={section.id} aria-labelledby={section.id}>
            <div className={contentHeadingBlock}>
              <h2 id={section.id} className={contentHeading}>
                {section.title}
              </h2>
              <p className={contentDef}>{section.def}</p>
            </div>
            {section.items.length > 0 ? (
              <div className="space-y-8">
                {section.items.map((item) => (
                  <ContentItem
                    key={item.slug}
                    item={item}
                    areaLabel={areaLabel(item.area)}
                    featuredLabel={t("featuredLabel")}
                  />
                ))}
              </div>
            ) : (
              <p className={emptyStateClass}>{section.empty}</p>
            )}
          </section>
        ))}

        <section aria-labelledby="eng-projects">
          <div className={contentHeadingBlock}>
            <h2 id="eng-projects" className={contentHeading}>
              {t("projectsTitle")}
            </h2>
            <p className={contentDef}>{t("projectsText")}</p>
          </div>
          {hasProjects ? (
            <div className="space-y-8">
              {competencyProjects.map((project) => (
                <div
                  key={project.name}
                  className="rounded-md border border-gray-100 dark:border-gray-700 bg-card-background p-6 shadow-sm"
                >
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
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-wide text-primary">
                    <Link
                      href={project.competencyHref}
                      className="hover:text-accent transition"
                    >
                      {t("projectMoreOn", { name: project.competencyTitle })} →
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
              {projects.map((item) => (
                <ContentItem
                  key={item.slug}
                  item={item}
                  areaLabel={areaLabel(item.area)}
                  featuredLabel={t("featuredLabel")}
                />
              ))}
            </div>
          ) : (
            <p className={emptyStateClass}>{t("projectsEmpty")}</p>
          )}
        </section>
      </div>
    </main>
  );
}
