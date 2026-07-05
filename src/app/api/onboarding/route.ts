import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { ensureTodayMissions, touchStreak, getProfile } from "@/lib/metrics";
import { getAccount } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/onboarding — create the prep profile for the authenticated account
export async function POST(req: NextRequest) {
  try {
    const account = await getAccount();

    if (!account) {
      return NextResponse.json(
        { error: "Login required" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      exam,
      targetDate,
      studyHoursPerDay,
      weakSubjects,
    } = body;

    if (!name || !exam || !targetDate) {
      return NextResponse.json(
        { error: "name, exam, targetDate required" },
        { status: 400 }
      );
    }

    const weakStr = Array.isArray(weakSubjects)
      ? weakSubjects.join(",")
      : weakSubjects || "";

    const existing = await getProfile();

    const profile = existing
      ? await db.profile.update({
          where: { id: existing.id },
          data: {
            name,
            exam,
            targetDate: new Date(targetDate),
            studyHoursPerDay: Number(studyHoursPerDay) || 4,
            weakSubjects: weakStr,
          },
        })
      : await db.profile.create({
          data: {
            accountId: account.id,
            name,
            exam,
            targetDate: new Date(targetDate),
            studyHoursPerDay: Number(studyHoursPerDay) || 4,
            weakSubjects: weakStr,
          },
        });

    touchStreak(profile.id);

    let roadmap = "";

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error("GEMINI_API_KEY not found");
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const daysLeft = Math.max(
        1,
        Math.ceil(
          (new Date(targetDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      );

      const prompt = `
You are Mentor, the AI planner inside BankOS.

Create a concise personalized roadmap.

Name: ${name}
Exam: ${exam}
Target Date: ${targetDate}
Days Left: ${daysLeft}
Study Hours Per Day: ${studyHoursPerDay}
Weak Subjects: ${weakStr || "None"}

Return markdown with these sections:

# Foundation
# Practice
# Revision
# Final Sprint

Keep the roadmap under 220 words and make it actionable.
`;

      const result = await model.generateContent(prompt);

      roadmap = result.response.text();
    } catch (err) {
      console.error(err);

      roadmap = `**Your ${exam} Roadmap**

- **Foundation (next 60 days):** Build core concepts across all sections.
- **Acceleration (Day 61–180):** Timed practice and first full mocks.
- **Refinement (Day 181–270):** Weakness elimination, revision engine active.
- **Final Lap (last 50 days):** Full-length mocks, interview prep, peak tuning.`;
    }

    await db.profile.update({
      where: { id: profile.id },
      data: { roadmap },
    });

    await ensureTodayMissions(profile.id);

    return NextResponse.json({
      profile: {
        ...profile,
        roadmap,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";

    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
