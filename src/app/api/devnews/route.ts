import { NextResponse } from "next/server";

const RSS_FEED = "https://dev.to/feed";

export async function GET() {
  const res = await fetch(RSS_FEED);
  const xml = await res.text();
  return NextResponse.json({ xml });
}
