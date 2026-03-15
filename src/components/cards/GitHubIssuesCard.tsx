"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FaExternalLinkAlt, FaGithub } from "react-icons/fa";

import Card from "@/components/Card";

interface GitHubIssue {
  id: number;
  title: string;
  html_url: string;
  repository_url: string;
  labels: { name: string; color: string }[];
}

const GitHubIssuesCard: React.FC = () => {
  const t = useTranslations("GitHubIssuesCard");
  const params = useParams();
  const locale = params.locale as string;
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/github-issues?per_page=5")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setIssues(data.items || []);
        setLoading(false);
      })
      .catch(() => {
        setError(t("error"));
        setLoading(false);
      });
  }, [t]);

  const getRepoFullName = (url: string) => {
    const parts = url.split("/");
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  };

  return (
    <Card
      title={t("title")}
      subtitle={t("subtitle")}
      text={t("description")}
      buttonLabel={t("buttonLabel")}
      buttonIcon={<FaGithub />}
      buttonHref={`/${locale}/opensource`}
    >
      <div className="mt-2 min-h-[100px]">
        {loading && (
          <span className="text-gray-400 text-sm animate-pulse">
            {t("loading")}
          </span>
        )}
        {error && <span className="text-red-500 text-sm">{error}</span>}
        {!loading && !error && issues.length === 0 && (
          <span className="text-gray-400 text-sm italic">{t("noIssues")}</span>
        )}
        <ul className="space-y-4">
          {issues.map((issue) => (
            <li
              key={issue.id}
              className="group border-b border-gray-100 dark:border-gray-800 pb-3 last:border-0"
            >
              <a
                href={issue.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-primary truncate tracking-tight">
                    {getRepoFullName(issue.repository_url)}
                  </span>
                  <FaExternalLinkAlt className="text-[10px] text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors leading-snug line-clamp-2">
                  {issue.title}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {issue.labels.slice(0, 2).map((label) => (
                    <span
                      key={label.name}
                      className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700"
                    >
                      {label.name}
                    </span>
                  ))}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
};

export default GitHubIssuesCard;
