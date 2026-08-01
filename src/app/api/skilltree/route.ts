import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile, computeSubjectMastery } from "@/lib/metrics";

export const runtime = "nodejs";

// GET /api/skilltree — mastery computed from real attempts
export async function GET() {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ empty: true });

  const mastery = await computeSubjectMastery(profile.id);

  // topic-level under each subject
  const attempts = await db.attempt.findMany({
    where: { profileId: profile.id },
    include: { question: { select: { subject: true, topic: true } } },
  });
  const topicStats: Record<string, Record<string, { total: number; correct: number }>> = {};
  for (const a of attempts) {
    const s = a.question.subject;
    const t = a.question.topic;
    if (!topicStats[s]) topicStats[s] = {};
    if (!topicStats[s][t]) topicStats[s][t] = { total: 0, correct: 0 };
    topicStats[s][t].total++;
    if (a.correct) topicStats[s][t].correct++;
  }

  const tree = mastery.map((m) => {
    const topics = Object.entries(topicStats[m.subject] || {}).map(([topic, v]) => ({
      id: topic,
      name: topic,
      mastery: v.total > 0 ? Math.round((v.correct / v.total) * 100) : 0,
      unlocked: true,
      attempts: v.total,
    }));
    return {
      id: m.subject,
      name: m.subject,
      mastery: m.mastery,
      color: m.color,
      unlocked: true,
      children: topics,
    };
  });

  return NextResponse.json({ tree });
}
