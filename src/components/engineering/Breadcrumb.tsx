import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumb({
  items,
  label,
}: {
  items: Crumb[];
  label: string;
}) {
  return (
    <nav aria-label={label}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-500 dark:text-stone-400">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <Fragment key={item.label}>
              <li>
                {item.href && !last ? (
                  <Link
                    href={item.href}
                    className="hover:text-stone-800 dark:hover:text-stone-100 transition"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={
                      last ? "text-gray-700 dark:text-gray-200" : undefined
                    }
                    aria-current={last ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
              {!last && (
                <li aria-hidden className="text-stone-300 dark:text-stone-600">
                  /
                </li>
              )}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
