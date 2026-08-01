import { NextResponse } from "next/server";
import { testAllProviders } from "@/lib/ai";

/**
 * GET /api/test-ai
 *
 * Pings Gemini, Groq, and OpenAI directly (bypassing the fallback chain)
 * and reports which ones are configured and actually responding right now.
 *
 * Visit http://localhost:3000/api/test-ai in your browser or:
 *   curl http://localhost:3000/api/test-ai
 */
export async function GET() {
  const results = await testAllProviders();

  const summary = {
    workingCount: results.filter((r) => r.ok).length,
    configuredCount: results.filter((r) => r.configured).length,
    totalProviders: results.length,
  };

  return NextResponse.json({ summary, results });
}
