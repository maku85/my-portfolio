import Link from "next/link";

import type { EngineeringContentMeta } from "@/lib/engineering-content";

export const tagClass =
  "rounded border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 text-[11px] text-gray-500 dark:text-gray-400";

export const emptyStateClass = "text-sm text-gray-400";

const metaTag =
  "rounded-md border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-gray-500 dark:text-gray-400";

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
  });
}

interface ContentItemProps {
  item: EngineeringContentMeta;
  featuredLabel: string;
  areaLabel?: string;
}

export default function ContentItem({
  item,
  featuredLabel,
  areaLabel,
}: ContentItemProps) {
  const href = item.url ?? `/engineering/${item.slug}`;
  const external = /^https?:\/\//.test(href);
  const heading = (
    <h3 className="text-lg font-bold text-gray-900 dark:text-primary group-hover:text-accent transition">
      {item.title}
    </h3>
  );

  return (
    <article>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group block"
        >
          {heading}
        </a>
      ) : (
        <Link href={href} className="group block">
          {heading}
        </Link>
      )}

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
        {item.featured && (
          <span className="font-semibold uppercase tracking-wide text-accent">
            {featuredLabel}
          </span>
        )}
        {areaLabel && <span className={metaTag}>{areaLabel}</span>}
        <time dateTime={item.date}>{formatDate(item.date)}</time>
      </div>

      <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
        {item.description}
      </p>

      {item.topics.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {item.topics.map((topic) => (
            <li key={topic} className={tagClass}>
              {topic}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
