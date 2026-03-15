"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBook,
  FaChevronLeft,
  FaFilter,
  FaGithub,
  FaPlus,
  FaSearch,
} from "react-icons/fa";

interface GitHubIssue {
  id: number;
  title: string;
  html_url: string;
  repository_url: string;
  labels: { name: string; color: string }[];
  created_at: string;
}

const LANGUAGES = [
  { label: "JavaScript", value: "javascript" },
  { label: "TypeScript", value: "typescript" },
  { label: "Python", value: "python" },
  { label: "Rust", value: "rust" },
  { label: "Go", value: "go" },
];

const LABELS = [
  { label: "Good First Issue", value: "good first issue" },
  { label: "Help Wanted", value: "help wanted" },
  { label: "Bug", value: "bug" },
  { label: "Documentation", value: "documentation" },
];

const ISSUES_PER_PAGE = 20;

export default function OpenSourcePage() {
  const t = useTranslations("OpenSourcePage");
  const params = useParams();
  const locale = params.locale as string;

  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [selectedLangs, setSelectedLangs] = useState<string[]>([
    "javascript",
    "typescript",
  ]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([
    "good first issue",
    "help wanted",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchIssues = useCallback(
    (pageNum: number, isInitial: boolean = false) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const langQuery = selectedLangs.join(",");
      const labelQuery = selectedLabels.map((l) => `"${l}"`).join(",");
      const keywordQuery = debouncedSearch
        ? `&q=${encodeURIComponent(debouncedSearch)}`
        : "";

      fetch(
        `/api/github-issues?lang=${langQuery}&label=${labelQuery}&per_page=${ISSUES_PER_PAGE}&page=${pageNum}${keywordQuery}`,
      )
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.json();
        })
        .then((data) => {
          const fetchedIssues = data.items || [];
          if (isInitial) {
            setIssues(fetchedIssues);
          } else {
            setIssues((prev) => [...prev, ...fetchedIssues]);
          }

          setHasMore(fetchedIssues.length === ISSUES_PER_PAGE);
          setLoading(false);
          setLoadingMore(false);
        })
        .catch(() => {
          setError(t("error"));
          setLoading(false);
          setLoadingMore(false);
        });
    },
    [selectedLangs, selectedLabels, debouncedSearch, t],
  );

  useEffect(() => {
    setPage(1);
    fetchIssues(1, true);
  }, [fetchIssues]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchIssues(nextPage, false);
  };

  const toggleLang = (val: string) => {
    setSelectedLangs((prev) =>
      prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val],
    );
  };

  const toggleLabel = (val: string) => {
    setSelectedLabels((prev) =>
      prev.includes(val) ? prev.filter((l) => l !== val) : [...prev, val],
    );
  };

  const getRepoFullName = (url: string) => {
    const parts = url.split("/");
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
  };

  const getRepoUrl = (url: string) => {
    const fullName = getRepoFullName(url);
    return `https://github.com/${fullName}`;
  };

  const isNew = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  };

  return (
    <main className="min-h-screen pt-20 pb-12 px-4 max-w-6xl mx-auto">
      <div className="mt-10 mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-primary hover:text-accent transition font-medium"
        >
          <FaArrowLeft className="mr-2" />
          {t("backToHome")}
        </Link>
      </div>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center text-primary hover:underline mb-2 transition-colors font-bold text-sm"
          >
            <FaChevronLeft className="mr-2 text-[10px]" />
            {t("backToHome")}
          </Link>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">
            {t("title")}
          </h1>
          <p className="text-gray-600 dark:text-blue-200 mt-1 font-medium">
            {t("subtitle")}
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium text-gray-900 dark:text-white"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaFilter className="text-primary text-sm" />
              {t("filterByLanguage")}
            </h2>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => toggleLang(lang.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    selectedLangs.includes(lang.value)
                      ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-primary"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FaFilter className="text-primary text-sm" />
              {t("filterByLabel")}
            </h2>
            <div className="flex flex-wrap lg:flex-col gap-2">
              {LABELS.map((label) => (
                <button
                  key={label.value}
                  onClick={() => toggleLabel(label.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                    selectedLabels.includes(label.value)
                      ? "bg-accent text-white border-accent shadow-md shadow-accent/20"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-700 hover:border-accent"
                  }`}
                >
                  {label.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 animate-pulse font-medium">
                {t("loading")}
              </p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-8 rounded-2xl text-center border border-red-100 dark:border-red-900/30">
              <p className="font-bold text-lg mb-2">{error}</p>
              <button
                onClick={() => fetchIssues(1, true)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition"
              >
                {t("retry")}
              </button>
            </div>
          ) : issues.length === 0 ? (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-20 rounded-3xl text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
              <FaGithub className="mx-auto text-5xl text-gray-300 mb-4" />
              <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                {t("noIssuesFound")}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issues.map((issue, index) => (
                  <div
                    key={`${issue.id}-${index}`}
                    className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-6 rounded-2xl shadow-sm transition-all hover:shadow-xl hover:border-primary hover:-translate-y-1 relative overflow-hidden"
                  >
                    {isNew(issue.created_at) && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                          {t("newBadge")}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3 pr-8">
                      <a
                        href={getRepoUrl(issue.repository_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 group/repo"
                      >
                        <img
                          src={`https://github.com/${getRepoFullName(issue.repository_url).split("/")[0]}.png`}
                          alt="Repo Avatar"
                          className="w-5 h-5 rounded-md border border-gray-100 dark:border-gray-800 shadow-sm"
                        />
                        <span className="text-xs font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-md group-hover/repo:bg-primary group-hover/repo:text-white transition-colors">
                          {getRepoFullName(issue.repository_url)}
                        </span>
                      </a>
                    </div>

                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block group/title"
                    >
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight group-hover/title:text-primary transition-colors line-clamp-2">
                        {issue.title}
                      </h3>
                    </a>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {issue.labels.map((label) => (
                        <span
                          key={label.name}
                          className="text-[10px] px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 font-bold uppercase tracking-tighter"
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {t("openedOn")}{" "}
                        {new Date(issue.created_at).toLocaleDateString()}
                      </span>

                      {/* Contributing Guide Link */}
                      <a
                        href={`${getRepoUrl(issue.repository_url)}/blob/main/CONTRIBUTING.md`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-accent hover:text-accent-dark transition-colors uppercase tracking-widest"
                      >
                        <FaBook className="text-[8px]" />
                        {t("contributingGuide")}
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-10">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="flex items-center gap-3 px-10 py-4 bg-primary text-white rounded-2xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    {loadingMore ? (
                      <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaPlus className="text-sm" />
                    )}
                    {t("loadMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
