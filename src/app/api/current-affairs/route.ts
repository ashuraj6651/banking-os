import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAccount } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 30;

const RAPIDAPI_HOST =
  process.env.RAPIDAPI_HOST ||
  "current-affairs-of-india.p.rapidapi.com";

const RAPIDAPI_ENDPOINTS = [
  "https://current-affairs-of-india.p.rapidapi.com/recent",
  "https://current-affairs-of-india.p.rapidapi.com/international-today",
];

type NormalizedAffair = {
  id: string;
  tag: string;
  title: string;
  summary: string;
  date: string;
  timeLabel: string;
  imageUrl: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
};

type CurrentAffairsResponse = {
  items: NormalizedAffair[];
  count: number;
  providerCount: number;
  source: "provider" | "database" | "error";
  stale: boolean;
  empty: boolean;
};

function timeAgo(date: Date): string {
  const diff = Math.max(0, Date.now() - date.getTime());

  const hour = 1000 * 60 * 60;
  const day = 1000 * 60 * 60 * 24;

  const hours = Math.floor(diff / hour);
  const days = Math.floor(diff / day);

  if (days === 0 && hours === 0) {
    return "Just now";
  }

  if (days === 0) {
    return `${hours}h ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return `${Math.floor(days / 7)} weeks ago`;
}

function getString(
  obj: Record<string, unknown>,
  keys: string[]
): string {
  for (const key of keys) {
    const value = obj[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }

    if (typeof value === "number") {
      return String(value);
    }
  }

  return "";
}

/**
 * Extract article array from different possible API response formats.
 */
function extractItems(payload: unknown): unknown[] {
  // Example:
  // ["Article 1", "Article 2"]
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const obj = payload as Record<string, unknown>;

  const possibleArrays = [
    obj.data,
    obj.items,
    obj.articles,
    obj.results,
    obj.currentAffairs,
    obj.current_affairs,
  ];

  for (const value of possibleArrays) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

/**
 * Extract date from a string like:
 *
 * "Bangladesh Names Asad Siam as New Envoy to India September 23, 2026"
 */
function extractDateFromString(value: string): Date | null {
  const match = value.match(
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i
  );

  if (!match) {
    return null;
  }

  const parsed = new Date(match[0]);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

/**
 * Normalize provider response into BankOS format.
 */
function normalizeArticles(payload: unknown): NormalizedAffair[] {
  const rawItems = extractItems(payload);

  return rawItems
    .map((item, index): NormalizedAffair | null => {
      /**
       * CASE 1:
       * Provider returns simple strings.
       *
       * Example:
       * "Bangladesh Names Asad Siam as New Envoy to India September 23, 2026"
       */
      if (typeof item === "string") {
        const clean = item.trim();

        if (!clean) {
          return null;
        }

        const parsedDate = extractDateFromString(clean);

        const date = parsedDate || new Date();

        const dateMatch = clean.match(
          /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i
        );

        const title = dateMatch
          ? clean.replace(dateMatch[0], "").trim()
          : clean;

        return {
          id: `rapidapi-${index}-${title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .slice(0, 60)}`,

          tag: "International",

          title,

          summary: title,

          date: date.toISOString(),

          timeLabel: timeAgo(date),
          imageUrl: null,
          sourceName: null,
          sourceUrl: null,
          };
        }

      /**
       * CASE 2:
       * Provider returns objects.
       */
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;

        const title = getString(obj, [
          "title",
          "headline",
          "name",
        ]);

        if (!title) {
          return null;
        }

        const summary =
          getString(obj, [
            "summary",
            "description",
            "content",
            "details",
            "detail",
          ]) || "Current affairs update.";

        const rawTag = getString(obj, [
              "tag",
              "category",
              "type",
              "topic",
            ]);

      const imageUrl =
            getString(obj, ["image_url", "imageUrl"]) || null;

        const sourceName =
            getString(obj, ["source_name", "sourceName"]) || null;

        const sourceUrl =
            getString(obj, ["source_url", "sourceUrl"]) || null;

        const tag = normalizeTag(rawTag);
          
        const rawDate = getString(obj, [
          "date",
          "publishedAt",
          "published_at",
          "createdAt",
          "created_at",
        ]);

        let date = new Date();

        if (rawDate) {
          const parsedDate = new Date(rawDate);

          if (!Number.isNaN(parsedDate.getTime())) {
            date = parsedDate;
          }
        }

        const id =
          getString(obj, ["id", "_id", "uuid"]) ||
          `rapidapi-${date.getTime()}-${index}`;

        return {
        id,
        tag,
        title,
        summary,
        date: date.toISOString(),
        timeLabel: timeAgo(date),
        imageUrl,
        sourceName,
        sourceUrl,
      };
      }

      return null;
    })
    .filter(
      (item): item is NormalizedAffair => item !== null
    );
}

function normalizeTag(value: string): string {
  const tag = value.trim();

  if (!tag) {
    return "Economy";
  }

  const lower = tag.toLowerCase();

  if (lower.includes("rbi")) {
    return "RBI";
  }

  if (
    lower.includes("bank") ||
    lower.includes("nbfc") ||
    lower.includes("upi")
  ) {
    return "Banking";
  }

  if (
    lower.includes("scheme") ||
    lower.includes("government")
  ) {
    return "Schemes";
  }

  if (lower.includes("econom")) {
    return "Economy";
  }

  if (
    lower.includes("international") ||
    lower.includes("world") ||
    lower.includes("foreign")
  ) {
    return "International";
  }

  return "Economy";
}

/**
 * Try RapidAPI endpoints in order.
 *
 * 1. /recent
 * 2. /international-today if /recent is empty
 */
async function fetchRapidAPI(): Promise<{
  payload: unknown;
  providerCount: number;
  endpoint: string;
}> {
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    throw new Error("RAPIDAPI_KEY is not configured");
  }

  let lastError: Error | null = null;

  for (const endpoint of RAPIDAPI_ENDPOINTS) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const response = await fetch(endpoint, {
        method: "GET",

        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": RAPIDAPI_HOST,
        },

        cache: "no-store",

        signal: controller.signal,
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error(
          "RapidAPI authentication failed"
        );
      }

      if (response.status === 429) {
        throw new Error(
          "RapidAPI rate limit exceeded"
        );
      }

      if (!response.ok) {
        throw new Error(
          `RapidAPI request failed with status ${response.status}`
        );
      }

      const payload: unknown = await response.json();

      const rawItems = extractItems(payload);

      /**
       * IMPORTANT:
       *
       * Empty /recent response is valid.
       * Continue to the next endpoint instead of treating
       * it as a complete failure.
       */
      if (rawItems.length === 0) {
        console.log(
          `RapidAPI endpoint returned no articles: ${endpoint}`
        );

        continue;
      }

      console.log(
        `RapidAPI returned ${rawItems.length} articles from ${endpoint}`
      );

      return {
        payload,
        providerCount: rawItems.length,
        endpoint,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error(String(error));

      console.error(
        `RapidAPI request failed for ${endpoint}:`,
        lastError.message
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * All endpoints returned empty or failed.
   */
  if (lastError) {
    throw lastError;
  }

  return {
    payload: [],
    providerCount: 0,
    endpoint: RAPIDAPI_ENDPOINTS[0],
  };
}


async function fetchNewsDataAPI(): Promise<NormalizedAffair[]> {
  const apiKey = process.env.NEWSDATA_API_KEY;

  if (!apiKey) {
    console.warn("NEWSDATA_API_KEY is not configured");
    return [];
  }

  const url = new URL("https://newsdata.io/api/1/latest");

  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("country", "in");
  url.searchParams.set("language", "en");
  url.searchParams.set("category", "business,politics,breaking");
  url.searchParams.set("removeduplicate", "1");

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(
        `NewsData API failed: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data?.results)) {
      console.warn("NewsData API returned no results");
      return [];
    }

    return normalizeArticles(data.results);
  } catch (error) {
    console.error("NewsData API error:", error);
    return [];
  }
}

async function getDatabaseFallback(): Promise<
  NormalizedAffair[]
> {
  const items = await db.currentAffair.findMany({
    orderBy: {
      date: "desc",
    },

    take: 50,
  });

  return items.map((item) => ({
  id: item.id,
  tag: item.tag,
  title: item.title,
  summary: item.summary,
  date: item.date.toISOString(),
  timeLabel: timeAgo(item.date),
  imageUrl: null,
  sourceName: null,
  sourceUrl: null,
}));
}

/**
 * Main Current Affairs loader.
 *
 * Priority:
 *
 * 1. RapidAPI /recent
 * 2. RapidAPI /international-today
 * 3. Database fallback if RapidAPI genuinely fails
 */
async function loadCurrentAffairs(): Promise<{
  data: CurrentAffairsResponse;
  status: number;
}> {
  // 1. Try NewsData.io FIRST
  try {
    const newsDataItems = await fetchNewsDataAPI();

    if (newsDataItems.length > 0) {
      console.log(
        `Current Affairs source: NewsData.io (${newsDataItems.length} articles)`
      );

      return {
        status: 200,
        data: {
          items: newsDataItems,
          count: newsDataItems.length,
          providerCount: newsDataItems.length,
          source: "provider",
          stale: false,
          empty: false,
        },
      };
    }

    console.log("NewsData.io returned no usable articles.");
  } catch (error) {
    console.error(
      "NewsData.io Current Affairs request failed:",
      error instanceof Error
        ? error.message
        : error
    );
  }

  // 2. If NewsData.io fails or returns no usable data,
  //    try RapidAPI
  try {
    const {
      payload,
      providerCount,
      endpoint,
    } = await fetchRapidAPI();

    console.log(`Current Affairs source: ${endpoint}`);

    const items = normalizeArticles(payload);

    if (items.length > 0) {
      return {
        status: 200,
        data: {
          items,
          count: items.length,
          providerCount,
          source: "provider",
          stale: false,
          empty: false,
        },
      };
    }

    console.log("RapidAPI returned no usable articles.");
  } catch (error) {
    console.error(
      "RapidAPI Current Affairs request failed:",
      error instanceof Error
        ? error.message
        : error
    );
  }

  // 3. If both APIs fail, use database cache
  try {
    const cachedItems = await getDatabaseFallback();

    if (cachedItems.length > 0) {
      return {
        status: 200,
        data: {
          items: cachedItems,
          count: cachedItems.length,
          providerCount: 0,
          source: "database",
          stale: true,
          empty: false,
        },
      };
    }
  } catch (dbError) {
    console.error(
      "Current Affairs database fallback failed:",
      dbError
    );
  }

  // 4. Nothing available
  return {
    status: 502,
    data: {
      items: [],
      count: 0,
      providerCount: 0,
      source: "error",
      stale: false,
      empty: true,
    },
  };
}

// Build a small, factual headline-matching quiz from saved article summaries.
// This deliberately uses no language model, so refreshes consume provider quota
// only and never AI tokens.
async function saveArticleQuizQuestions(articles: NormalizedAffair[]) {
  const usable = articles.filter((article) => article.title.trim() && article.summary.trim());
  if (usable.length < 4) return 0;

  const created = await Promise.all(usable.map(async (article, index) => {
    const questionText = `Which headline matches this current-affairs report?\n\n${article.summary.slice(0, 900)}`;
    const existing = await db.question.findFirst({ where: { text: questionText } });
    if (existing) return false;

    const otherHeadlines = usable
      .filter((_, otherIndex) => otherIndex !== index)
      .map((item) => item.title)
      .filter((title, titleIndex, all) => all.indexOf(title) === titleIndex);
    const distractors = otherHeadlines.sort(() => Math.random() - 0.5).slice(0, 3);
    if (distractors.length < 3) return false;

    const options = [article.title, ...distractors].sort(() => Math.random() - 0.5);
    const answer = options.indexOf(article.title);
    await db.question.create({
      data: {
        subject: "Current Affairs",
        topic: article.tag || "Current Affairs",
        difficulty: "Medium",
        text: questionText,
        options: JSON.stringify(options),
        answer,
        explanation: `${article.title}. ${article.summary}`,
      },
    });
    return true;
  }));

  return created.filter(Boolean).length;
}

/**
 * GET /api/current-affairs
 *
 * RapidAPI is the primary source.
 */
export async function GET() {
  try {
    const account = await requireAccount();

const parts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).formatToParts(new Date());

const dateParts = Object.fromEntries(
  parts.map((part) => [part.type, part.value])
);

const dayStart = new Date(
  Date.UTC(
    Number(dateParts.year),
    Number(dateParts.month) - 1,
    Number(dateParts.day),
    -5,
    -30
  )
);

const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

const refreshesUsed = await db.currentAffairRefresh.count({
  where: {
    accountId: account.id,
    date: {
      gte: dayStart,
      lt: dayEnd,
    },
  },
});
    const items = await db.currentAffair.findMany({
      orderBy: {
        date: "desc",
      },
      take: 50,
    });

    const normalizedItems = items.map((item) => ({
      id: item.id,
      tag: item.tag,
      title: item.title,
      summary: item.summary,
      date: item.date.toISOString(),
      timeLabel: item.date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      imageUrl: item.imageUrl,
      sourceName: null,
      sourceUrl: null,
    }));

    return NextResponse.json({
      success: true,
      source: "database",
      count: normalizedItems.length,
      items: normalizedItems,
      refreshLimit: 10,
      refreshesUsed,
      refreshesRemaining: Math.max(0, 10 - refreshesUsed),
    });
  } catch (error) {
    console.error("Current Affairs GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load current affairs",
        items: [],
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/current-affairs
 *
 * Used by the existing Refresh / Fetch Now button.
 *
 * No AI generation.
 */
export async function POST() {
  let account;

  try {
    account = await requireAccount();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  // Get today's date according to India Standard Time (IST)
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const dateParts = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const year = Number(dateParts.year);
  const month = Number(dateParts.month);
  const day = Number(dateParts.day);

  // IST = UTC + 5:30
  const dayStart = new Date(
    Date.UTC(year, month - 1, day, -5, -30)
  );

  const dayEnd = new Date(
    dayStart.getTime() + 24 * 60 * 60 * 1000
  );

  // Count today's refreshes for this account
  const used = await db.currentAffairRefresh.count({
    where: {
      accountId: account.id,
      date: {
        gte: dayStart,
        lt: dayEnd,
      },
    },
  });

  const DAILY_LIMIT = 10;

  // Block the 11th refresh
  if (used >= DAILY_LIMIT) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Daily refresh limit reached. You can refresh again after 12:00 AM IST.",
        limit: DAILY_LIMIT,
        used,
        remaining: 0,
      },
      {
        status: 429,
      }
    );
  }

  // Record this refresh
  await db.currentAffairRefresh.create({
    data: {
      accountId: account.id,
    },
  });

  const result = await loadCurrentAffairs();
  let quizQuestionsCreated = 0;
  if (result.data.source === "provider") {
  for (const item of result.data.items) {
    const date = new Date(item.date);

    const existing = await db.currentAffair.findFirst({
      where: {
        title: item.title,
        date,
      },
    });

    if (existing) {
      await db.currentAffair.update({
        where: { id: existing.id },
        data: {
          tag: item.tag,
          summary: item.summary,
          imageUrl: item.imageUrl,
        },
      });
    } else {
      await db.currentAffair.create({
        data: {
          tag: item.tag,
          title: item.title,
          summary: item.summary,
          date,
          imageUrl: item.imageUrl,
        },
      });
      }
    }
  }

  if (result.data.items.length > 0 && result.data.source !== "error") {
    quizQuestionsCreated = await saveArticleQuizQuestions(result.data.items);
  }

  const usedAfter = used + 1;

  return NextResponse.json(
    {
      success: result.status === 200,
      ...result.data,
      newCount:
        result.data.source === "provider"
          ? result.data.count
          : 0,
      refreshLimit: DAILY_LIMIT,
      refreshesUsed: usedAfter,
      refreshesRemaining: DAILY_LIMIT - usedAfter,
      quizQuestionsCreated,
    },
    {
      status: result.status,
    }
  );
}
