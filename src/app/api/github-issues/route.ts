import { type NextRequest, NextResponse } from "next/server";

const EXCLUDE_USER = "maku85";

// Simple in-memory cache (per process)
type CacheEntry = { data: any; expires: number };
const cache: Record<string, CacheEntry> = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minuti

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "javascript,typescript";
  const label = searchParams.get("label") || '"good first issue","help wanted"';
  const perPage = searchParams.get("per_page") || "10";
  const page = searchParams.get("page") || "1";
  const keywords = searchParams.get("q") || "";

  // Prepare filters
  const labs = label
    .split(",")
    .map((l) => (l.startsWith('"') ? l : `"${l}"`))
    .join("+label:");
  const langs = lang
    .split(",")
    .map((l) => `language:${l}`)
    .join("+");
  const keywordSearch = keywords ? `${keywords}+` : "";

  const QUERY = `${keywordSearch}is:open+is:issue+label:${labs}+${langs}+no:assignee+-user:${EXCLUDE_USER}`;
  const GITHUB_API_URL = `https://api.github.com/search/issues?q=${QUERY}&sort=created&order=desc&per_page=${perPage}&page=${page}`;

  // Cache key based on query
  const cacheKey = GITHUB_API_URL;
  const now = Date.now();
  if (cache[cacheKey] && cache[cacheKey].expires > now) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    const res = await fetch(GITHUB_API_URL, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "My-Portfolio-App",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("GitHub API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch from GitHub" },
        { status: res.status },
      );
    }

    const data = await res.json();

    // Store in cache
    cache[cacheKey] = { data, expires: now + CACHE_TTL_MS };

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching GitHub issues:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
