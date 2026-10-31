import { NextRequest, NextResponse } from "next/server";
import { generateText, hasAnyAIProvider } from "@/lib/ai";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_QUESTION_LIMIT = 25;
const ALL_SUBJECTS = ["Reasoning", "English", "Quant", "Banking", "Current Affairs"] as const;

// In-memory cache for generated questions (per user-day-subject-difficulty)
const questionCache = new Map<string, { questions: any[]; createdAt: number; }>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function getCacheKey(profileId: string, subject: string, difficulty: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${profileId}:${today}:${subject}:${difficulty}`;
}

function getSubjectsForBalance(weakSubjects: string): string[] {
  const weak = weakSubjects
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is string => !!s && ALL_SUBJECTS.includes(s as (typeof ALL_SUBJECTS)[number]));

  // Keep all major subjects in the pool so "All" is truly mixed across the
  // complete banking exam syllabus instead of skewing toward a single section.
  if (weak.length === 0) return [...ALL_SUBJECTS];

  const priority = [...new Set([...weak, ...ALL_SUBJECTS.filter((s) => !weak.includes(s))])];
  return priority.length === ALL_SUBJECTS.length ? priority : [...ALL_SUBJECTS];
}

function buildBalancedSelection<T extends { subject: string }>(rows: T[], totalSlots: number, subjects: readonly string[]): T[] {
  if (rows.length === 0 || totalSlots <= 0) return [];

  const bySubject = new Map<string, T[]>();
  for (const row of rows) {
    const current = bySubject.get(row.subject) ?? [];
    current.push(row);
    bySubject.set(row.subject, current);
  }

  const orderedSubjects = subjects.filter((subject) => bySubject.has(subject));
  if (orderedSubjects.length === 0) return rows.slice(0, totalSlots);

  const quotaMap = new Map<string, number>();
  const base = Math.floor(totalSlots / orderedSubjects.length);
  const remainder = totalSlots % orderedSubjects.length;

  orderedSubjects.forEach((subject, index) => {
    const perSubject = base + (index < remainder ? 1 : 0);
    quotaMap.set(subject, Math.min(perSubject, bySubject.get(subject)?.length ?? 0));
  });

  const selected: T[] = [];
  let remaining = totalSlots;

  for (const subject of orderedSubjects) {
    const amount = quotaMap.get(subject) ?? 0;
    const candidates = bySubject.get(subject) ?? [];
    selected.push(...candidates.slice(0, amount));
    remaining -= amount;
  }

  if (remaining > 0) {
    const used = new Set(selected.map((item) => (item as any).id));
    const extras = rows.filter((row) => !used.has((row as any).id));
    selected.push(...extras.slice(0, remaining));
  }

  return selected.slice(0, totalSlots);
}

async function generateQuestionsWithAI(
  subject: string,
  difficulty: string,
  count: number,
  existingQuestionTexts: string[],
  profileName: string,
  topicOverride?: string
): Promise<{ text: string; options: string[]; answer: number; explanation: string; topic: string }[]> {
  if (!hasAnyAIProvider()) {
    return [];
  }

  const subjectTopics: Record<string, string> = {
    "Reasoning": "syllogisms, puzzles, coding-decoding, blood relations, direction sense, seating arrangement, inequality, series, analogy, classification",
    "English": "grammar, fill in the blank, error spotting, synonyms, antonyms, idioms, reading comprehension, one-word substitution, sentence rearrangement",
    "Quant": "number series, percentage, ratio & proportion, time & work, profit & loss, simple interest, compound interest, average, data interpretation, simplification, algebra, mensuration, proportion, speed-time-distance",
    "Current Affairs": "RBI policies, government schemes, economic indicators, banking reforms, financial inclusion, digital banking, monetary policy committees",
    "Banking": "banking products, negotiable instruments, accounts, insurance, RBI history, monetary policy, banking regulation, payment systems",
  };

  // If a specific topic was requested (e.g. clicking a single node in the
  // Skill Tree), generate only for that topic instead of the whole
  // subject's topic list — otherwise "practice this one topic" quietly
  // turned into "practice anything in this subject".
  const topics = topicOverride || subjectTopics[subject] || "general banking exam topics";

  const existingTextsList = existingQuestionTexts.length > 0
    ? `\n\nIMPORTANT: Do NOT use any of these existing question texts (avoid duplicates):\n${existingQuestionTexts.slice(0, 10).join("\n")}`
    : "";

  const prompt = topicOverride
    ? `You are a banking exam question generator for BankOS. Generate ${count} unique, fresh ${difficulty}-difficulty multiple-choice questions for the subject "${subject}", specifically on the topic "${topicOverride}".\n\nRequirements:\n- Each question must have exactly 4 options (A, B, C, D)\n- Questions should be realistic banking exam questions (like SBI PO, IBPS PO, RBI Grade B)\n- ${difficulty} difficulty level\n- Provide clear, concise explanations (1-2 sentences)\n- Every question must stay strictly on the topic "${topicOverride}"\n- Make questions different from each other\n- Answer should be the 0-based index (0=A, 1=B, 2=C, 3=D)\n- Set the "topic" field in your response to exactly "${topicOverride}"\n${existingTextsList}\n\nReturn ONLY valid JSON array with no markdown, no code fences, no explanation outside JSON. Format:\n[{"text":"question text","options":["option A","option B","option C","option D"],"answer":0,"explanation":"explanation","topic":"${topicOverride}"}]\n\nGenerate the questions now:`
    : `You are a banking exam question generator for BankOS. Generate ${count} unique, fresh ${difficulty}-difficulty multiple-choice questions for the subject "${subject}".\n\nTopics to cover: ${topics}\n\nRequirements:\n- Each question must have exactly 4 options (A, B, C, D)\n- Questions should be realistic banking exam questions (like SBI PO, IBPS PO, RBI Grade B)\n- ${difficulty} difficulty level\n- Provide clear, concise explanations (1-2 sentences)\n- Vary the topics within ${subject}\n- Make questions different from each other\n- Answer should be the 0-based index (0=A, 1=B, 2=C, 3=D)\n${existingTextsList}\n\nReturn ONLY valid JSON array with no markdown, no code fences, no explanation outside JSON. Format:\n[{"text":"question text","options":["option A","option B","option C","option D"],"answer":0,"explanation":"explanation","topic":"specific topic"}]\n\nGenerate the questions now:`;

  const text = (await generateText(prompt)).trim();

  // Clean up response - remove markdown code fences if present
  let cleaned = text;
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.filter((q: any) =>
        q.text && Array.isArray(q.options) && q.options.length === 4 &&
        typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3 &&
        q.explanation && q.topic
      ).map((q: any) => ({
        text: q.text,
        options: q.options,
        answer: q.answer,
        explanation: q.explanation,
        topic: q.topic,
      }));
    }
  } catch {
    // If JSON parsing fails, return empty
    console.error("Failed to parse AI-generated questions JSON");
  }

  return [];
}

// GET /api/questions?subject=&difficulty=&limit=&refresh=true
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get("subject");
  const difficulty = searchParams.get("difficulty");
  const topic = searchParams.get("topic");
  const limit = Number(searchParams.get("limit") || String(DEFAULT_QUESTION_LIMIT));
  const refresh = searchParams.get("refresh") === "true";

  const profile = await getProfile();

  // If no profile, return seed questions from DB
  if (!profile) {
    const where: Record<string, unknown> = {};
    if (subject && subject !== "All") where.subject = subject;
    if (difficulty && difficulty !== "All") where.difficulty = difficulty;
    if (topic) where.topic = topic;

    const questions = await db.question.findMany({
      where,
      take: Math.max(1, Math.min(50, limit)),
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      questions: questions.map((q) => ({
        ...q,
        options: JSON.parse(q.options),
      })),
    });
  }

  // Build cache key
  const subjectKey = (!subject || subject === "All") ? "All" : subject;
  const diffKey = (!difficulty || difficulty === "All") ? "All" : difficulty;
  const topicKey = topic || "All";
  const cacheKey = getCacheKey(profile.id, subjectKey, diffKey) + `:${topicKey}`;

  // Current-affairs quiz items are derived from saved news summaries by the
  // news refresh route. Serve those stored questions directly; never invoke AI
  // generation for this subject.
  if (subjectKey === "Current Affairs") {
    const where = {
      subject: "Current Affairs",
      ...(diffKey !== "All" ? { difficulty: diffKey } : {}),
      ...(topic ? { topic } : {}),
    };
    const bank = await db.question.findMany({
      where,
      take: 200,
      orderBy: { createdAt: "desc" },
    });
    const attemptedIds = await db.attempt.findMany({
      where: { profileId: profile.id },
      select: { questionId: true },
      distinct: ["questionId"],
    });
    const attempted = new Set(attemptedIds.map((item) => item.questionId));
    const unseen = bank.filter((question) => !attempted.has(question.id));
    const pool = unseen.length > 0 ? unseen : bank;
    const questions = [...pool]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(1, Math.min(50, limit)))
      .map((question) => ({ ...question, options: JSON.parse(question.options) }));

    return NextResponse.json({ questions, generatedWithAI: false });
  }

  // Check cache (unless refresh is requested)
  if (!refresh) {
    const cached = questionCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
      return NextResponse.json({ questions: cached.questions });
    }
  }

  const totalSlots = Math.max(1, Math.min(50, limit));
  const subjectsToGen = subject && subject !== "All"
    ? [subject]
    : getSubjectsForBalance(profile.weakSubjects);

  const difficultiesToGen = difficulty && difficulty !== "All"
    ? [difficulty]
    : ["Easy", "Medium", "Hard"];

  const attemptedIds = await db.attempt.findMany({
    where: { profileId: profile.id },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  const attemptedSet = new Set(attemptedIds.map((a) => a.questionId));

  const dbRows = subjectKey === "All"
    ? await Promise.all(
        subjectsToGen.map(async (subjectName) => {
          const rows = await db.question.findMany({
            where: {
              subject: subjectName,
              ...(difficulty && difficulty !== "All" ? { difficulty } : {}),
              ...(topic ? { topic } : {}),
              id: { notIn: Array.from(attemptedSet) },
            },
            take: 80,
            orderBy: { createdAt: "desc" },
          });
          return rows;
        })
      ).then((chunks) => chunks.flat())
    : await db.question.findMany({
        where: {
          subject: subjectKey,
          ...(difficulty && difficulty !== "All" ? { difficulty } : {}),
          ...(topic ? { topic } : {}),
          id: { notIn: Array.from(attemptedSet) },
        },
        take: totalSlots * 4,
        orderBy: { createdAt: "desc" },
      });

  const balancedDbQuestions = subjectKey === "All"
    ? buildBalancedSelection(dbRows, totalSlots, subjectsToGen)
    : dbRows.slice(0, totalSlots);

  if (balancedDbQuestions.length >= totalSlots) {
    const result = balancedDbQuestions.slice(0, totalSlots).map((q) => ({
      ...q,
      options: JSON.parse(q.options),
    }));
    questionCache.set(cacheKey, { questions: result, createdAt: Date.now() });
    return NextResponse.json({ questions: result });
  }

  const allNewQuestions: any[] = [...balancedDbQuestions.map((q) => ({ ...q, options: JSON.parse(q.options) }))];
  let generated = balancedDbQuestions.length;

  const remaining = Math.max(0, totalSlots - generated);
  if (remaining > 0) {
    const shuffledSubjects = [...subjectsToGen].sort(() => Math.random() - 0.5);
    const shuffledDiffs = [...difficultiesToGen].sort(() => Math.random() - 0.5);
    const perBatch = Math.min(5, remaining);

    const batchesToRun: { subj: string; diff: string; batchSize: number }[] = [];
    let remainingToPlan = remaining;
    let planCursor = generated;

    for (const subj of shuffledSubjects) {
      if (remainingToPlan <= 0) break;
      const batchSize = Math.min(perBatch, remainingToPlan);
      const diff = shuffledDiffs[planCursor % shuffledDiffs.length];
      batchesToRun.push({ subj, diff, batchSize });
      remainingToPlan -= batchSize;
      planCursor += batchSize;
    }

    const batchResults = await Promise.allSettled(
      batchesToRun.map((b) =>
        generateQuestionsWithAI(b.subj, b.diff, b.batchSize, allNewQuestions.map((q) => q.text), profile.name, topic || undefined).then(
          (aiQuestions) => ({ ...b, aiQuestions })
        )
      )
    );

    for (const result of batchResults) {
      if (result.status !== "fulfilled") {
        console.error("AI question generation failed:", result.reason);
        continue;
      }

      const { subj, diff, aiQuestions } = result.value;
      for (const q of aiQuestions) {
        if (generated >= totalSlots) break;
        try {
          const created = await db.question.create({
            data: {
              subject: subj,
              topic: q.topic,
              difficulty: diff,
              text: q.text,
              options: JSON.stringify(q.options),
              answer: q.answer,
              explanation: q.explanation,
            },
          });
          allNewQuestions.push({ ...created, options: q.options });
          generated += 1;
        } catch {
          // Duplicate or error, skip
        }
      }
    }
  }

  const dayNum = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const finalQuestions = allNewQuestions
    .sort((a, b) => {
      const hashA = (dayNum * 31 + a.text.length) % 1000;
      const hashB = (dayNum * 31 + b.text.length) % 1000;
      return hashA - hashB;
    })
    .slice(0, totalSlots);

  questionCache.set(cacheKey, { questions: finalQuestions, createdAt: Date.now() });
  return NextResponse.json({ questions: finalQuestions });
}

