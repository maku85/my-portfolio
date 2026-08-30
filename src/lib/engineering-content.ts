import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import { cache } from "react";

import { competencyProjectCount } from "@/data/competencies";
import { engineeringAreaSlugs } from "@/data/engineering";

const CONTENT_DIR = path.join(process.cwd(), "src/content/engineering");

export const ENGINEERING_CONTENT_TYPES = [
  "note",
  "experiment",
  "project",
] as const;
export type EngineeringContentType = (typeof ENGINEERING_CONTENT_TYPES)[number];

export const ENGINEERING_CONTENT_STATUSES = [
  "draft",
  "published",
  "archived",
] as const;
export type EngineeringContentStatus =
  (typeof ENGINEERING_CONTENT_STATUSES)[number];

export interface EngineeringContent {
  slug: string;
  title: string;
  type: EngineeringContentType;
  area: string;
  topics: string[];
  description: string;
  date: string;
  status: EngineeringContentStatus;
  featured: boolean;
  related: string[];
  url?: string;
  titleIt?: string;
  descriptionIt?: string;
  body: string;
}

export type EngineeringContentMeta = Omit<EngineeringContent, "body">;

export function localizeContent<T extends EngineeringContentMeta>(
  item: T,
  locale: string,
): T {
  if (locale !== "it") return item;
  return {
    ...item,
    title: item.titleIt ?? item.title,
    description: item.descriptionIt ?? item.description,
  };
}

const areaSlugs = new Set(engineeringAreaSlugs);

function fail(file: string, message: string): never {
  throw new Error(`[engineering-content] ${file}: ${message}`);
}

function requireString(value: unknown, file: string, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    fail(file, `"${field}" is required and must be a non-empty string`);
  }
  return value.trim();
}

function stringArray(value: unknown, file: string, field: string): string[] {
  if (value == null) return [];
  if (
    !Array.isArray(value) ||
    value.some((entry) => typeof entry !== "string")
  ) {
    fail(file, `"${field}" must be a list of strings`);
  }
  return (value as string[]).map((entry) => entry.trim()).filter(Boolean);
}

function normalizeDate(value: unknown, file: string): string {
  const iso =
    value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    fail(file, `"date" must be an ISO date (YYYY-MM-DD)`);
  }
  return iso;
}

function parse(file: string, raw: string): EngineeringContent {
  const { data, content } = matter(raw);

  const type = data.type as EngineeringContentType;
  if (!ENGINEERING_CONTENT_TYPES.includes(type)) {
    fail(
      file,
      `"type" must be one of: ${ENGINEERING_CONTENT_TYPES.join(", ")}`,
    );
  }

  const area = requireString(data.area, file, "area");
  if (!areaSlugs.has(area)) {
    fail(
      file,
      `"area" must be a known area slug: ${[...areaSlugs].join(", ")}`,
    );
  }

  const status = (data.status ?? "published") as EngineeringContentStatus;
  if (!ENGINEERING_CONTENT_STATUSES.includes(status)) {
    fail(
      file,
      `"status" must be one of: ${ENGINEERING_CONTENT_STATUSES.join(", ")}`,
    );
  }

  const slug =
    typeof data.slug === "string" && data.slug.trim()
      ? data.slug.trim()
      : file.replace(/\.md$/, "");

  return {
    slug,
    title: requireString(data.title, file, "title"),
    type,
    area,
    topics: stringArray(data.topics, file, "topics"),
    description: requireString(data.description, file, "description"),
    date: normalizeDate(data.date, file),
    status,
    featured: data.featured === true,
    related: stringArray(data.related, file, "related"),
    url:
      typeof data.url === "string" && data.url.trim()
        ? data.url.trim()
        : undefined,
    titleIt:
      typeof data.title_it === "string" && data.title_it.trim()
        ? data.title_it.trim()
        : undefined,
    descriptionIt:
      typeof data.description_it === "string" && data.description_it.trim()
        ? data.description_it.trim()
        : undefined,
    body: content.trim(),
  };
}

export const getAllEngineeringContent = cache((): EngineeringContent[] => {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const items = fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".md") && !file.startsWith("_"))
    .map((file) =>
      parse(file, fs.readFileSync(path.join(CONTENT_DIR, file), "utf8")),
    )
    .filter((item) => item.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date));

  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.slug)) {
      fail(`${item.slug}.md`, `duplicate slug "${item.slug}"`);
    }
    seen.add(item.slug);
  }

  return items;
});

export function getEngineeringContentByType(
  type: EngineeringContentType,
): EngineeringContent[] {
  return getAllEngineeringContent()
    .filter((item) => item.type === type)
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function getEngineeringContentByArea(
  areaSlug: string,
): EngineeringContent[] {
  return getAllEngineeringContent().filter((item) => item.area === areaSlug);
}

export function getEngineeringContentByTags(
  areaSlug: string,
  tags: string[],
  type?: EngineeringContentType,
): EngineeringContent[] {
  const needles = new Set(tags.map((tag) => tag.toLowerCase()));
  return getAllEngineeringContent()
    .filter(
      (item) =>
        item.area === areaSlug &&
        (!type || item.type === type) &&
        item.topics.some((topic) => needles.has(topic.toLowerCase())),
    )
    .sort((a, b) => Number(b.featured) - Number(a.featured));
}

export function getEngineeringContentBySlug(
  slug: string,
): EngineeringContent | null {
  return getAllEngineeringContent().find((item) => item.slug === slug) ?? null;
}

export function getRelatedEngineeringContent(
  item: EngineeringContentMeta,
): EngineeringContent[] {
  if (item.related.length === 0) return [];
  const bySlug = new Map(getAllEngineeringContent().map((c) => [c.slug, c]));
  return item.related
    .map((slug) => bySlug.get(slug))
    .filter((c): c is EngineeringContent => Boolean(c));
}

export interface AreaEvidence {
  notes: number;
  experiments: number;
  projects: number;
}

export function getAreaEvidence(areaSlug: string): AreaEvidence {
  const items = getEngineeringContentByArea(areaSlug);
  return {
    notes: items.filter((item) => item.type === "note").length,
    experiments: items.filter((item) => item.type === "experiment").length,
    projects:
      items.filter((item) => item.type === "project").length +
      competencyProjectCount(areaSlug),
  };
}
