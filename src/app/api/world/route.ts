import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile, computeSubjectMastery } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/world — region data with progress computed from real attempts
export async function GET() {
  const profile = await getProfile();
  if (!profile) {
    // Return default regions with 0 progress for unauthenticated users
    return NextResponse.json({ empty: true });
  }

  const mastery = await computeSubjectMastery(profile.id);

  const regions = [
    {
      id: "reasoning-city",
      name: "Reasoning City",
      icon: "Brain",
      subject: "Reasoning",
      color: "#8b5cf6",
      desc: "Puzzles, syllogisms, coding-decoding, blood relations, direction sense and more.",
      progress: mastery.find(m => m.subject === "Reasoning")?.mastery ?? 0,
      unlocked: true,
    },
    {
      id: "quant-valley",
      name: "Quant Valley",
      icon: "Sigma",
      subject: "Quant",
      color: "#3b82f6",
      desc: "Arithmetic, algebra, data interpretation, series, and advanced mathematics.",
      progress: mastery.find(m => m.subject === "Quant")?.mastery ?? 0,
      unlocked: true,
    },
    {
      id: "english-kingdom",
      name: "English Kingdom",
      icon: "BookOpen",
      subject: "English",
      color: "#22d3ee",
      desc: "Grammar, vocabulary, reading comprehension, error spotting, and idioms.",
      progress: mastery.find(m => m.subject === "English")?.mastery ?? 0,
      unlocked: true,
    },
    {
      id: "current-district",
      name: "Current Affairs District",
      icon: "Newspaper",
      subject: "Current Affairs",
      color: "#10b981",
      desc: "Banking news, RBI policies, government schemes, and economic updates.",
      progress: mastery.find(m => m.subject === "Current Affairs")?.mastery ?? 0,
      unlocked: true,
    },
    {
      id: "interview-tower",
      name: "Banking Tower",
      icon: "Building2",
      subject: "Banking",
      color: "#f59e0b",
      desc: "Banking awareness, RBI, monetary policy, negotiable instruments, and insurance.",
      progress: mastery.find(m => m.subject === "Banking")?.mastery ?? 0,
      unlocked: true,
    },
  ];

  return NextResponse.json({ regions });
}