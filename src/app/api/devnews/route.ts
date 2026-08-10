import { NextResponse } from "next/server";

const RSS_FEED = "https://dev.to/feed";

export async function GET() {
  const res = await fetch(RSS_FEED, { next: { revalidate: 3600 } });
  const xml = await res.text();
  return NextResponse.json(
    { xml },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
