import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";
export const maxDuration = 60;

// In-memory cache for generated questions (per user-day-subject-difficulty)
const questionCache = new Map<string, { questions: any[]; createdAt: number; }>();
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function getCacheKey(profileId: string, subject: string, difficulty: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${profileId}:${today}:${subject}:${difficulty}`;
}

function getSubjectsForBalance(weakSubjects: string): string[] {
  const all = ["Reasoning", "English", "Quant", "Current Affairs", "Banking"];
  const weak = weakSubjects.split(",").map(s => s.trim()).filter(Boolean);
  if (weak.length === 0) return all;
  // Weight weak subjects more heavily
  const balanced: string[] = [];
  for (const w of weak) {
    balanced.push(w, w, w); // 3x weight for weak subjects
  }
  for (const s of all) {
    if (!weak.includes(s)) balanced.push(s);
  }
  return balanced;
}

async function generateQuestionsWithAI(
  subject: string,
  difficulty: string,
  count: number,
  existingQuestionTexts: string[],
  profileName: string
): Promise<{ text: string; options: string[]; answer: number; explanation: string; topic: string }[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return [];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const subjectTopics: Record<string, string> = {
    "Reasoning": "syllogisms, puzzles, coding-decoding, blood relations, direction sense, seating arrangement, inequality, series, analogy, classification",
    "English": "grammar, fill in the blank, error spotting, synonyms, antonyms, idioms, reading comprehension, one-word substitution, sentence rearrangement",
    "Quant": "number series, percentage, ratio & proportion, time & work, profit & loss, simple interest, compound interest, average, data interpretation, simplification, algebra, mensuration, probability",
    "Current Affairs": "RBI policies, government schemes, economic indicators, banking reforms, financial inclusion, digital banking, monetary policy committees",
    "Banking": "banking products, negotiable instruments, accounts, insurance, RBI history, monetary policy, banking regulation, payment systems",
  };

  const topics = subjectTopics[subject] || "general banking exam topics";

  const existingTextsList = existingQuestionTexts.length > 0
    ? `\n\nIMPORTANT: Do NOT use any of these existing question texts (avoid duplicates):\n${existingQuestionTexts.slice(0, 10).join("\n")}`
    : "";

  const prompt = `You are a banking exam question generator for BankOS. Generate ${count} unique, fresh ${difficulty}-difficulty multiple-choice questions for the subject "${subject}".

Topics to cover: ${topics}

Requirements:
- Each question must have exactly 4 options (A, B, C, D)
- Questions should be realistic banking exam questions (like SBI PO, IBPS PO, RBI Grade B)
- ${difficulty} difficulty level
- Provide clear, concise explanations (1-2 sentences)
- Vary the topics within ${subject}
- Make questions different from each other
- Answer should be the 0-based index (0=A, 1=B, 2=C, 3=D)
${existingTextsList}

Return ONLY valid JSON array with no markdown, no code fences, no explanation outside JSON. Format:
[{"text":"question text","options":["option A","option B","option C","option D"],"answer":0,"explanation":"explanation","topic":"specific topic"}]

Generate the questions now:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

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
  const limit = Number(searchParams.get("limit") || "10");
  const refresh = searchParams.get("refresh") === "true";

  const profile = await getProfile();

  // If no profile, return seed questions from DB
  if (!profile) {
    const where: Record<string, unknown> = {};
    if (subject && subject !== "All") where.subject = subject;
    if (difficulty && difficulty !== "All") where.difficulty = difficulty;

    const questions = await db.question.findMany({
      where,
      take: limit,
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
  const cacheKey = getCacheKey(profile.id, subjectKey, diffKey);

  // Check cache (unless refresh is requested)
  if (!refresh) {
    const cached = questionCache.get(cacheKey);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL) {
      return NextResponse.json({ questions: cached.questions });
    }
  }

  // Get existing question texts to avoid duplicates
  const existingQuestions = await db.question.findMany({
    where: {
      ...(subject && subject !== "All" ? { subject } : {}),
      ...(difficulty && difficulty !== "All" ? { difficulty } : {}),
    },
    select: { text: true },
    take: 50,
  });
  const existingTexts = existingQuestions.map(q => q.text);

  // Determine which subjects to generate
  const subjectsToGen = subject && subject !== "All"
    ? [subject]
    : getSubjectsForBalance(profile.weakSubjects);

  const difficultiesToGen = difficulty && difficulty !== "All"
    ? [difficulty]
    : ["Easy", "Medium", "Hard"];

  // Calculate per-subject distribution
  const totalSlots = limit;
  const subjectSlots = Math.ceil(totalSlots / subjectsToGen.length);
  const diffSlots = Math.ceil(subjectSlots / difficultiesToGen.length);

  const allNewQuestions: any[] = [];
  let generated = 0;

  // First, try to get existing DB questions (not yet attempted by this user)
  const attemptedIds = await db.attempt.findMany({
    where: { profileId: profile.id },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  const attemptedSet = new Set(attemptedIds.map(a => a.questionId));

  const dbQuestions = await db.question.findMany({
    where: {
      ...(subject && subject !== "All" ? { subject } : {}),
      ...(difficulty && difficulty !== "All" ? { difficulty } : {}),
      id: { notIn: Array.from(attemptedSet) },
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  if (dbQuestions.length >= limit) {
    const result = dbQuestions.slice(0, limit).map(q => ({
      ...q,
      options: JSON.parse(q.options),
    }));
    // Cache it
    questionCache.set(cacheKey, { questions: result, createdAt: Date.now() });
    return NextResponse.json({ questions: result });
  }

  // Add existing DB questions first
  allNewQuestions.push(...dbQuestions.map(q => ({
    ...q,
    options: JSON.parse(q.options),
  })));
  generated = dbQuestions.length;

  // Generate remaining with AI
  const remaining = Math.max(0, totalSlots - generated);
  if (remaining > 0) {
    // Pick random subjects and difficulties for variety
    const shuffledSubjects = [...subjectsToGen].sort(() => Math.random() - 0.5);
    const shuffledDiffs = [...difficultiesToGen].sort(() => Math.random() - 0.5);

    const perBatch = Math.min(5, remaining); // Generate in small batches
    let subjectsToTry = shuffledSubjects;

    // Use a date-based seed for deterministic daily variation
    const daySeed = new Date().toISOString().slice(0, 10);
    const seedHash = daySeed.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const startSubjectIdx = seedHash % subjectsToTry.length;
    subjectsToTry = [...subjectsToTry.slice(startSubjectIdx), ...subjectsToTry.slice(0, startSubjectIdx)];

    for (const subj of subjectsToTry) {
      if (generated >= totalSlots) break;
      const batchSize = Math.min(perBatch, totalSlots - generated);
      const diff = shuffledDiffs[generated % shuffledDiffs.length];

      try {
        const aiQuestions = await generateQuestionsWithAI(
          subj,
          diff,
          batchSize,
          existingTexts,
          profile.name
        );

        // Save to DB for persistence
        for (const q of aiQuestions) {
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
            allNewQuestions.push({
              ...created,
              options: q.options,
            });
            generated++;
            existingTexts.push(q.text);
          } catch {
            // Duplicate or error, skip
          }
        }
      } catch (err) {
        console.error(`AI question generation failed for ${subj}:`, err);
      }
    }
  }

  // Shuffle for variety (but deterministic per day)
  const dayNum = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const result = allNewQuestions
    .sort((a, b) => {
      const hashA = (dayNum * 31 + a.text.length) % 1000;
      const hashB = (dayNum * 31 + b.text.length) % 1000;
      return hashA - hashB;
    })
    .slice(0, limit);

  // Cache the result
  questionCache.set(cacheKey, { questions: result, createdAt: Date.now() });

  return NextResponse.json({ questions: result });
}