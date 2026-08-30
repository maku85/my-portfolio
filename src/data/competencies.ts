import { engineeringAreaSlugs, engineeringAreas } from "@/data/engineering";
import { libraries } from "@/data/libraries";
import type { LocalizedText } from "@/data/localized";

export const EXPERIENCE_LEVELS = [
  "production",
  "professional",
  "familiar",
  "none",
] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const COMPETENCY_STATUSES = [
  "active",
  "maintained",
  "exploring",
  "paused",
  "not-started",
] as const;
export type CompetencyStatus = (typeof COMPETENCY_STATUSES)[number];

export interface ProjectDerivation {
  topics?: LocalizedText[];
  notes?: string[];
}

interface CompetencyProjectBase {
  authored?: boolean;
  builtOn?: ProjectDerivation;
}

export type CompetencyProject =
  | ({ library: string; blurb?: LocalizedText } & CompetencyProjectBase)
  | ({
      name: string;
      href: string;
      description?: LocalizedText;
    } & CompetencyProjectBase);

export interface Competency {
  slug: string;
  area: string;
  title: string;
  tagline?: LocalizedText;
  description: LocalizedText;
  experience?: LocalizedText;
  scope?: LocalizedText;
  experienceLevel: ExperienceLevel;
  status: CompetencyStatus;
  topics: LocalizedText[];
  contentMatch?: string[];
  projects?: CompetencyProject[];
  relatedCompetencies?: string[];
  startedAt?: string;
  updatedAt?: string;
  published?: boolean;
}

export const competencies: Competency[] = [
  {
    slug: "mongodb",
    area: "data",
    title: "MongoDB",
    tagline: {
      en: "Field notes on query performance",
      it: "Appunti sulle performance delle query",
    },
    description: {
      en: "MongoDB is part of the backend stack I work with, used through Mongoose on Node.js services.",
      it: "MongoDB fa parte dello stack backend con cui lavoro, usato tramite Mongoose su servizi Node.js.",
    },
    experience: {
      en: "The material here comes from query-performance and indexing work in Mongoose/Node.js backends, and from mongoose-lens, the tool that grew out of it. It isn't exhaustive and it isn't the manual — it's what actually came up.",
      it: "Il materiale qui nasce dal lavoro su performance delle query e indici in backend Mongoose/Node.js, e da mongoose-lens, lo strumento che ne è derivato. Non è esaustivo e non è il manuale: è ciò che è emerso davvero.",
    },
    scope: {
      en: "This collection is about query performance and indexing. Schema design, aggregation pipelines and database operations are out of scope here.",
      it: "Questa raccolta riguarda le performance delle query e l'indicizzazione. Schema design, aggregation pipeline e operazioni sul database sono fuori ambito.",
    },
    experienceLevel: "professional",
    status: "active",
    topics: [
      "MongoDB",
      "Mongoose",
      { en: "Indexes", it: "Indici" },
      { en: "Query optimization", it: "Ottimizzazione query" },
      { en: "Query planner", it: "Query planner" },
      "explain()",
      { en: "ESR indexing rule", it: "Regola di indicizzazione ESR" },
    ],
    projects: [
      {
        library: "mongoose-lens",
        authored: true,
        blurb: {
          en: "Slow query interceptor and index advisor for Mongoose 8+. Automatically runs explain() on slow queries, detects COLLSCAN/SORT stages, and suggests optimal indexes following the ESR rule.",
          it: "Interceptor per query lente e advisor di indici per Mongoose 8+. Esegue automaticamente explain() sulle query lente, rileva gli stage COLLSCAN/SORT e suggerisce indici ottimali secondo la regola ESR.",
        },
        builtOn: {
          topics: [
            { en: "Query optimization", it: "Ottimizzazione query" },
            "explain()",
            "COLLSCAN",
            { en: "Indexes", it: "Indici" },
            { en: "ESR indexing rule", it: "Regola di indicizzazione ESR" },
          ],
          notes: [
            "understanding-mongodb-query-plans",
            "understanding-mongodb-index-selection",
          ],
        },
      },
    ],
    relatedCompetencies: ["backend/nodejs", "data/postgresql"],
    updatedAt: "2026-08-26",
    published: true,
  },

  {
    slug: "nodejs",
    area: "backend",
    title: "Node.js",
    description: "The runtime behind the backend work I do day to day.",
    experienceLevel: "professional",
    status: "active",
    topics: [],
  },
  {
    slug: "typescript",
    area: "backend",
    title: "TypeScript",
    description: "Used across the backend and tooling work.",
    experienceLevel: "professional",
    status: "active",
    topics: [],
  },
  {
    slug: "aws",
    area: "cloud-infrastructure",
    title: "AWS",
    description: "The cloud provider behind the infrastructure I work with.",
    experienceLevel: "familiar",
    status: "active",
    topics: [],
  },
  {
    slug: "aws-cdk",
    area: "cloud-infrastructure",
    title: "AWS CDK",
    description: "Infrastructure as code for AWS, in TypeScript.",
    experienceLevel: "familiar",
    status: "active",
    topics: [],
  },
  {
    slug: "postgresql",
    area: "data",
    title: "PostgreSQL",
    description: {
      en: "I've worked with the fundamentals of PostgreSQL and am currently deepening my understanding of relational modelling, query planning, transactions and performance.",
      it: "Ho lavorato con le basi di PostgreSQL e sto approfondendo modellazione relazionale, query planning, transazioni e performance.",
    },
    experience: {
      en: "This sits at familiarity level: PostgreSQL fundamentals, not production experience. The areas below are what I'm working through.",
      it: "Siamo a livello di familiarità: basi di PostgreSQL, non esperienza di produzione. Gli argomenti qui sotto sono ciò che sto affrontando.",
    },
    scope: {
      en: "Everything here is early — the topics below are a plan, not a demonstration.",
      it: "Qui è tutto agli inizi: gli argomenti qui sotto sono un piano, non una dimostrazione.",
    },
    experienceLevel: "familiar",
    status: "exploring",
    topics: [
      {
        en: "SQL and relational modelling",
        it: "SQL e modellazione relazionale",
      },
      { en: "Indexes", it: "Indici" },
      "EXPLAIN / EXPLAIN ANALYZE",
      { en: "Query planner", it: "Query planner" },
      { en: "Transactions", it: "Transazioni" },
      "MVCC",
      { en: "Isolation levels", it: "Livelli di isolamento" },
      { en: "Locks", it: "Lock" },
      { en: "Connection pooling", it: "Connection pooling" },
      { en: "Performance tuning", it: "Tuning delle performance" },
    ],
    relatedCompetencies: ["data/mongodb"],
    updatedAt: "2026-08-26",
    published: true,
  },
];

const compositeKey = (area: string, slug: string) => `${area}/${slug}`;

const byKey = new Map(
  competencies.map((competency) => [
    compositeKey(competency.area, competency.slug),
    competency,
  ]),
);

{
  const areaSet = new Set(engineeringAreaSlugs);
  const seen = new Set<string>();
  for (const competency of competencies) {
    const id = compositeKey(competency.area, competency.slug);
    if (!areaSet.has(competency.area)) {
      throw new Error(
        `[competencies] ${id}: unknown area "${competency.area}"`,
      );
    }
    if (seen.has(id)) throw new Error(`[competencies] duplicate entry "${id}"`);
    seen.add(id);
    for (const field of ["startedAt", "updatedAt"] as const) {
      const value = competency[field];
      if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`[competencies] ${id}: "${field}" must be YYYY-MM-DD`);
      }
    }
    for (const ref of competency.relatedCompetencies ?? []) {
      if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(ref)) {
        throw new Error(
          `[competencies] ${id}: relatedCompetencies entry "${ref}" must be "<area>/<slug>"`,
        );
      }
    }
    if (competency.published) {
      if (competency.experienceLevel === "none") {
        throw new Error(
          `[competencies] ${id}: cannot publish with level "none"`,
        );
      }
      if (competency.status === "not-started") {
        throw new Error(
          `[competencies] ${id}: cannot publish with status "not-started"`,
        );
      }
    }
  }
}

export function getCompetency(area: string, slug: string): Competency | null {
  return byKey.get(compositeKey(area, slug)) ?? null;
}

export function isPublished(competency: Competency): boolean {
  return competency.published === true;
}

export const publishedCompetencies = competencies.filter(isPublished);

export function competencyHref(competency: Competency): string {
  return `/engineering/${competency.area}/${competency.slug}`;
}

export function competencyHasPage(area: string, slug: string): boolean {
  const competency = getCompetency(area, slug);
  return competency ? isPublished(competency) : false;
}

const HUB_GROUP: Partial<Record<CompetencyStatus, "using" | "learning">> = {
  active: "using",
  maintained: "using",
  exploring: "learning",
  paused: "learning",
};

export interface AreaSkill {
  slug: string;
  title: string;
  group: "using" | "learning";
  hasPage: boolean;
}

export function skillsForArea(areaSlug: string): AreaSkill[] {
  return competencies.flatMap((competency) => {
    const group = HUB_GROUP[competency.status];
    return competency.area === areaSlug && group
      ? [
          {
            slug: competency.slug,
            title: competency.title,
            group,
            hasPage: isPublished(competency),
          },
        ]
      : [];
  });
}

export const documentedAreas = engineeringAreas.filter(
  (area) => skillsForArea(area.slug).length > 0,
);

export function publishedCompetencyParams(): { slug: string; skill: string }[] {
  return publishedCompetencies.map((competency) => ({
    slug: competency.area,
    skill: competency.slug,
  }));
}

export function areaTitleFor(competency: Competency): string {
  return (
    engineeringAreas.find((area) => area.slug === competency.area)?.title ??
    competency.area
  );
}

export function contentTags(competency: Competency): string[] {
  return [competency.slug, ...(competency.contentMatch ?? [])];
}

export interface ResolvedProject {
  name: string;
  description?: LocalizedText;
  href: string;
  primaryLink: "npm" | "open";
  sourceHref?: string;
  authored: boolean;
  builtOn?: { topics: LocalizedText[]; noteSlugs: string[] };
}

export function resolveProjects(competency: Competency): ResolvedProject[] {
  return (competency.projects ?? []).map((project) => {
    const builtOn = project.builtOn
      ? {
          topics: project.builtOn.topics ?? [],
          noteSlugs: project.builtOn.notes ?? [],
        }
      : undefined;
    if ("library" in project) {
      const lib = libraries.find((entry) => entry.name === project.library);
      return {
        name: project.library,
        description: project.blurb ?? lib?.description,
        href: `/npm#${project.library}`,
        primaryLink: "npm" as const,
        sourceHref: lib?.link,
        authored: project.authored ?? true,
        builtOn,
      };
    }
    return {
      name: project.name,
      description: project.description,
      href: project.href,
      primaryLink: "open" as const,
      authored: project.authored ?? false,
      builtOn,
    };
  });
}

export interface ResolvedRelated {
  label: string;
  href?: string;
}

export function resolveRelated(competency: Competency): ResolvedRelated[] {
  return (competency.relatedCompetencies ?? []).map((ref) => {
    const [area, slug] = ref.split("/");
    const target = area && slug ? getCompetency(area, slug) : null;
    if (target) {
      return {
        label: target.title,
        href: isPublished(target) ? competencyHref(target) : undefined,
      };
    }
    return { label: ref };
  });
}

export function getCompetencyForContent(
  area: string,
  topics: string[],
): Competency | null {
  const lowered = new Set(topics.map((topic) => topic.toLowerCase()));
  const matches = publishedCompetencies.filter(
    (competency) =>
      competency.area === area &&
      contentTags(competency).some((tag) => lowered.has(tag.toLowerCase())),
  );
  return matches.length === 1 ? matches[0] : null;
}

export interface HubProject extends ResolvedProject {
  competencyTitle: string;
  competencyHref: string;
}

export function hubProjects(): HubProject[] {
  return publishedCompetencies.flatMap((competency) =>
    resolveProjects(competency).map((project) => ({
      ...project,
      competencyTitle: competency.title,
      competencyHref: competencyHref(competency),
    })),
  );
}

export function competencyProjectCount(area: string): number {
  return publishedCompetencies
    .filter((competency) => competency.area === area)
    .reduce(
      (total, competency) => total + (competency.projects?.length ?? 0),
      0,
    );
}
