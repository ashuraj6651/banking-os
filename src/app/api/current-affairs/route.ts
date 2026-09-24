import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 20;

const RAPIDAPI_URL = "https://current-affairs-of-india.p.rapidapi.com/recent";
const FALLBACK_ITEMS_LIMIT = 50;

type CurrentAffairItem = {
  id: string;
  tag: string;
  title: string;
  summary: string;
  date: string;
  timeLabel: string;
};

function timeAgo(date: Date): string {
  const diff = Math.max(0, Date.now() - date.getTime());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (hours === 0) return "Just now";
  if (days === 0) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function textField(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function getItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ["items", "articles", "results", "data", "currentAffairs", "current_affairs"]) {
    if (Array.isArray(record[key])) return record[key] as unknown[];
  }
  return [];
}

function normalize(payload: unknown): CurrentAffairItem[] {
  return getItems(payload).flatMap((value, index) => {
    const item = asRecord(value);
    if (!item) return [];

    // Keep the mapper defensive until the provider returns a populated sample.
    const title = textField(item, ["title", "headline", "name"]);
    const summary = textField(item, ["summary", "description", "content", "details"]);
    if (!title && !summary) return [];

    const rawDate = textField(item, ["publishedAt", "published_at", "date", "createdAt", "created_at"]);
    const parsedDate = rawDate ? new Date(rawDate) : new Date();
    const date = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    return [{
      id: textField(item, ["id", "_id", "slug"]) || `rapidapi-${date.getTime()}-${index}`,
      tag: textField(item, ["tag", "category", "topic", "section"]) || "Current Affairs",
      title: title || summary,
      summary: summary || title,
      date: date.toISOString(),
      timeLabel: timeAgo(date),
    }];
  });
}

function configError(): string | null {
  if (!process.env.RAPIDAPI_KEY) return "RAPIDAPI_KEY is not configured";
  if (!process.env.RAPIDAPI_HOST) return "RAPIDAPI_HOST is not configured";
  return null;
}

async function fetchRapidApi(): Promise<CurrentAffairItem[]> {
  const error = configError();
  if (error) throw new Error(error);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(RAPIDAPI_URL, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY!,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST!,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error("RapidAPI authentication failed. Check RAPIDAPI_KEY and RAPIDAPI_HOST.");
    }
    if (response.status === 429) {
      throw new Error("RapidAPI quota limit reached. Please try again later.");
    }
    if (!response.ok) throw new Error(`RapidAPI request failed (${response.status}).`);

    const payload: unknown = await response.json();
    const items = normalize(payload);
    // [] is a valid provider response, not an API error.
    return items;
  } finally {
    clearTimeout(timeout);
  }
}

async function databaseFallback(): Promise<CurrentAffairItem[]> {
  const items = await db.currentAffair.findMany({
    orderBy: { date: "desc" },
    take: FALLBACK_ITEMS_LIMIT,
  });
  return items.map((item) => ({
    id: item.id,
    tag: item.tag,
    title: item.title,
    summary: item.summary,
    date: item.date.toISOString(),
    timeLabel: timeAgo(item.date),
  }));
}

async function responseForRequest() {
  try {
    const items = await fetchRapidApi();
    return NextResponse.json({ items, source: "rapidapi" });
  } catch (error) {
    const fallback = await databaseFallback();
    if (fallback.length > 0) {
      return NextResponse.json({ items: fallback, source: "database", stale: true });
    }

    const message = error instanceof Error ? error.message : "Current affairs provider unavailable.";
    const status = message.includes("not configured") ? 503 : message.includes("authentication") ? 502 : message.includes("quota") ? 429 : 503;
    return NextResponse.json({ error: message, items: [] }, { status });
  }
}

// GET /api/current-affairs — server-side RapidAPI proxy.
export async function GET() {
  return responseForRequest();
}

// Existing UI uses POST for Refresh; keep that behavior while using the same source.
export async function POST(_request: NextRequest) {
  return responseForRequest();
}
