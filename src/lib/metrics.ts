// BankOS — server-side metric computations from real attempt data
import { db } from "./db";
import { getAccount } from "./auth";

export type Readiness = {
  overall: number;
  selectionProbability: number;
  predictedRank: number | null;
  expectedCutoff: number;
  preparationLevel: string;
  confidence: number;
  focusScore: number;
};

export type SubjectMastery = { subject: string; mastery: number; color: string };

const SUBJECT_COLORS: Record<string, string> = {
  Reasoning: "#8b5cf6",
  English: "#22d3ee",
  Quant: "#3b82f6",
  Banking: "#f59e0b",
  "Current Affairs": "#10b981",
  Computer: "#ec4899",
};

/**
 * Get the profile for the currently-authenticated account.
 * Returns null if not logged in or no profile yet.
 */
export async function getProfile() {
  const account = await getAccount();
  if (!account) return null;
  return db.profile.findUnique({
    where: { accountId: account.id },
  });
}

/**
 * Compute subject mastery from real attempts.
 * mastery(%) = correct / total in that subject. 0 if no attempts.
 */
export async function computeSubjectMastery(profileId: string): Promise<SubjectMastery[]> {
  const subjects = ["Reasoning", "English", "Quant", "Banking", "Current Affairs"];
  const attempts = await db.attempt.findMany({
    where: { profileId },
    include: { question: { select: { subject: true } } },
  });
  const stats: Record<string, { total: number; correct: number }> = {};
  for (const a of attempts) {
    const s = a.question.subject;
    if (!stats[s]) stats[s] = { total: 0, correct: 0 };
    stats[s].total++;
    if (a.correct) stats[s].correct++;
  }
  return subjects.map((subject) => ({
    subject,
    mastery: stats[subject]
      ? Math.round((stats[subject].correct / stats[subject].total) * 100)
      : 0,
    color: SUBJECT_COLORS[subject] ?? "#8b5cf6",
  }));
}

/**
 * Overall readiness = average mastery across subjects with attempts,
 * blended with coverage. Starts at 0.
 */
export async function computeReadiness(profileId: string): Promise<Readiness> {
  const mastery = await computeSubjectMastery(profileId);
  const withData = mastery.filter((m) => m.mastery > 0);
  const avgMastery =
    withData.length > 0
      ? Math.round(withData.reduce((a, b) => a + b.mastery, 0) / withData.length)
      : 0;

  // coverage: how many subjects attempted / total
  const coverage = withData.length / 5;

  const overall = Math.round(avgMastery * 0.7 + coverage * 100 * 0.3);

  // total attempts for confidence
  const totalAttempts = await db.attempt.count({ where: { profileId } });
  const correctAttempts = await db.attempt.count({ where: { profileId, correct: true } });
  const accuracy = totalAttempts > 0 ? correctAttempts / totalAttempts : 0;

  // selection probability grows with readiness + volume of practice
  const volumeFactor = Math.min(1, totalAttempts / 200); // 200 attempts = full volume confidence
  const selectionProbability = Math.round(overall * 0.6 + accuracy * 100 * 0.25 + volumeFactor * 15);

  // predicted rank only meaningful after some mocks; null until then
  const completedMocks = await db.mockTest.count({ where: { profileId, status: "completed" } });
  let predictedRank: number | null = null;
  if (completedMocks > 0) {
    const avgScore =
      (await db.mockTest.aggregate({
        where: { profileId, status: "completed" },
        _avg: { score: true },
      }))._avg.score ?? 0;
    // crude rank estimate: higher score → lower rank number
    predictedRank = Math.max(1, Math.round(10000 - avgScore * 95));
  }

  const expectedCutoff = 78.5; // static exam benchmark, not user data
  const preparationLevel =
    overall >= 85 ? "Elite" : overall >= 70 ? "Advanced" : overall >= 50 ? "Intermediate" : overall > 0 ? "Building" : "Beginner";
  const confidence = Math.round(accuracy * 100);

  // focus score: based on today's sessions
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const todaySessions = await db.studySession.findMany({
    where: { profileId, startedAt: { gte: startOfDay } },
  });
  const todayQuestions = todaySessions.reduce((a, s) => a + s.questionsAttempted, 0);
  const focusScore = Math.min(100, Math.round(todayQuestions * 4 + todaySessions.length * 8));

  return {
    overall,
    selectionProbability,
    predictedRank,
    expectedCutoff,
    preparationLevel,
    confidence,
    focusScore,
  };
}

/**
 * Generate today's missions deterministically from profile settings.
 * Distribution based on study hours + weak subjects emphasis.
 */
export function generateTodayMissions(profile: {
  studyHoursPerDay: number;
  weakSubjects: string;
}) {
  const totalMinutes = profile.studyHoursPerDay * 60;
  const weak = profile.weakSubjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // base missions
  const base: { title: string; type: string; duration: number }[] = [
    { title: "Reading Comprehension", type: "rc", duration: 30 },
    { title: "Puzzle Practice", type: "puzzle", duration: 35 },
    { title: "Quant Drill", type: "quant", duration: 30 },
    { title: "Current Affairs", type: "current", duration: 20 },
    { title: "Mock Test", type: "mock", duration: 45 },
  ];

  // if weak subjects named, add a targeted drill and drop the mock if time tight
  const weakDrills = weak
    .filter((w) => ["Reasoning", "Quant", "English"].includes(w))
    .map((w) => ({
      title: `${w} Weakness Drill`,
      type: w === "Reasoning" ? "puzzle" : w === "Quant" ? "quant" : "rc",
      duration: 25,
    }));

  let missions = [...weakDrills, ...base];
  // trim to fit study hours (prefer keeping variety)
  let budget = 0;
  const kept: typeof missions = [];
  for (const m of missions) {
    if (budget + m.duration <= totalMinutes + 15) {
      kept.push(m);
      budget += m.duration;
    }
  }
  // ensure at least 3 missions even if hours low
  if (kept.length < 3) return base.slice(0, 3);

  const hasCurrentAffairs = kept.some((m) => m.title === "Current Affairs");

  if (!hasCurrentAffairs) {
    const currentMission = {
      title: "Current Affairs",
      type: "current",
      duration: 20,
    };

    if (kept.length >= 6) {
      const replaceIndex = kept.findIndex(
        (m) =>
          m.title === "Quant Drill" ||
          m.title === "Reading Comprehension" ||
          m.title === "Puzzle Practice"
      );

      if (replaceIndex !== -1) {
        kept[replaceIndex] = currentMission;
      } else {
        kept.push(currentMission);
      }
    } else {
      kept.push(currentMission);
    }
  }

  return kept.slice(0, 6);
}

/**
 * Ensure today's missions exist for a profile (idempotent).
 */
export async function ensureTodayMissions(profileId: string) {
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile) return [];

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const existing = await db.mission.findMany({
    where: { profileId, date: { gte: startOfDay, lt: endOfDay } },
    orderBy: { order: "asc" },
  });
  if (existing.length > 0) {
    const hasCurrentAffairs = existing.some((m) => m.title === "Current Affairs");
    if (!hasCurrentAffairs) {
      const currentMissionData = {
        title: "Current Affairs",
        type: "current",
        duration: 20,
      };

      const replaceIndex = existing.findIndex(
        (m) =>
          m.title === "Quant Drill" ||
          m.title === "Reading Comprehension" ||
          m.title === "Puzzle Practice"
      );

      if (replaceIndex !== -1) {
        await db.mission.update({
          where: { id: existing[replaceIndex].id },
          data: currentMissionData,
        });
      } else if (existing.length < 6) {
        await db.mission.create({
          data: {
            date: startOfDay,
            order: existing.length,
            profileId,
            ...currentMissionData,
          },
        });
      } else {
        const fallbackIndex = existing.findIndex((m) => m.title !== "Current Affairs");
        if (fallbackIndex !== -1) {
          await db.mission.update({
            where: { id: existing[fallbackIndex].id },
            data: currentMissionData,
          });
        } else {
          await db.mission.create({
            data: {
              date: startOfDay,
              order: existing.length,
              profileId,
              ...currentMissionData,
            },
          });
        }
      }
      return db.mission.findMany({
        where: { profileId, date: { gte: startOfDay, lt: endOfDay } },
        orderBy: { order: "asc" },
      });
    }
    return existing;
  }

  const generated = generateTodayMissions(profile);
  const created: Awaited<ReturnType<typeof db.mission.create>>[] = [];
  for (let i = 0; i < generated.length; i++) {
    const m = generated[i];
    created.push(
      await db.mission.create({
        data: {
          date: startOfDay,
          title: m.title,
          type: m.type,
          duration: m.duration,
          order: i,
          profileId,
        },
      })
    );
  }
  return created;
}

/**
 * Update streak based on activity today.
 */
export async function touchStreak(profileId: string) {
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile) return;
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const last = profile.lastActiveDate ? new Date(profile.lastActiveDate) : null;
  const lastDay = last ? new Date(last) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);

  if (!lastDay) {
    await db.profile.update({ where: { id: profileId }, data: { streak: 1, lastActiveDate: now } });
  } else {
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
      // already counted today
    } else if (diffDays === 1) {
      await db.profile.update({
        where: { id: profileId },
        data: { streak: profile.streak + 1, lastActiveDate: now },
      });
    } else {
      await db.profile.update({
        where: { id: profileId },
        data: { streak: 1, lastActiveDate: now },
      });
    }
  }
}

/**
 * Award XP and check achievements.
 */
export async function awardXp(profileId: string, xp: number) {
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile) return;
  const newXp = profile.xp + xp;
  const newLevel = Math.floor(newXp / 1000) + 1;
  await db.profile.update({
    where: { id: profileId },
    data: { xp: newXp, level: newLevel, coins: profile.coins + Math.floor(xp / 2) },
  });
}

const ACHIEVEMENT_DEFS: { key: string; check: (s: AchievementStats) => boolean }[] = [
  { key: "first-mock", check: (s) => s.mocks >= 1 },
  { key: "streak-7", check: (s) => s.streak >= 7 },
  { key: "1000-questions", check: (s) => s.attempts >= 1000 },
  { key: "100-questions", check: (s) => s.attempts >= 100 },
  { key: "first-session", check: (s) => s.sessions >= 1 },
  { key: "streak-30", check: (s) => s.streak >= 30 },
  { key: "90-accuracy", check: (s) => s.attempts >= 20 && s.accuracy >= 0.9 },
  { key: "level-10", check: (s) => s.level >= 10 },
];

type AchievementStats = {
  attempts: number;
  sessions: number;
  mocks: number;
  streak: number;
  level: number;
  accuracy: number;
};

export async function checkAchievements(profileId: string) {
  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile) return;
  const attempts = await db.attempt.count({ where: { profileId } });
  const correct = await db.attempt.count({ where: { profileId, correct: true } });
  const sessions = await db.studySession.count({ where: { profileId } });
  const mocks = await db.mockTest.count({ where: { profileId, status: "completed" } });
  const stats: AchievementStats = {
    attempts,
    sessions,
    mocks,
    streak: profile.streak,
    level: profile.level,
    accuracy: attempts > 0 ? correct / attempts : 0,
  };
  const unlocked: string[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (def.check(stats)) {
      const exists = await db.achievement.findUnique({
        where: { profileId_key: { profileId, key: def.key } },
      });
      if (!exists) {
        await db.achievement.create({ data: { key: def.key, profileId } });
        unlocked.push(def.key);
      }
    }
  }
  return unlocked;
}
