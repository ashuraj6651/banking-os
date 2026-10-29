import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

const isDev = process.env.NODE_ENV !== "production";
const VALID_STATUS = new Set(["pending", "done"]);

/** Prisma ke lambe error se kaam ki last lines nikalta hai + hint deta hai. */
function describeError(error: unknown) {
  const raw = error instanceof Error ? error.message : String(error);
  const detail = raw.trim().split("\n").slice(-3).join(" ").slice(0, 400);

  let hint: string | undefined;
  if (/studiedSeconds/i.test(raw)) {
    hint =
      "DB/Prisma mein `studiedSeconds` field nahi mila. schema.prisma ke PlannerTask model mein " +
      "`studiedSeconds Int @default(0)` add karo, phir `npx prisma db push` aur " +
      "`npx prisma generate` chalao aur dev server restart karo.";
  }
  return { detail, hint };
}

function serverError(label: string, error: unknown) {
  console.error(label, error);
  const { detail, hint } = describeError(error);
  return NextResponse.json(
    {
      error: "Internal Server Error",
      ...(isDev ? { detail, hint } : {}),
    },
    { status: 500 }
  );
}

// PATCH /api/planner/[id] — update fields, or toggle status when body = { toggle: true }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

    const existing = await db.plannerTask.findUnique({ where: { id } });
    if (!existing || existing.profileId !== profile.id) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));

    if (body?.toggle) {
      const updated = await db.plannerTask.update({
        where: { id },
        data: { status: existing.status === "done" ? "pending" : "done" },
      });
      return NextResponse.json({ task: updated });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
    if (typeof body.subject === "string") data.subject = body.subject;
    if (typeof body.priority === "string") data.priority = body.priority;
    if (typeof body.status === "string") {
      if (!VALID_STATUS.has(body.status)) {
        return NextResponse.json({ error: "invalid status" }, { status: 400 });
      }
      data.status = body.status;
    }
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.order === "number") data.order = body.order;
    if (body.addStudiedSeconds !== undefined) {
      const seconds = Math.floor(Number(body.addStudiedSeconds));
      if (Number.isFinite(seconds) && seconds > 0) {
        data.studiedSeconds = { increment: Math.min(seconds, 12 * 60 * 60) };
      }
    }
    if (body.estMinutes !== undefined) {
      data.estMinutes = Math.max(5, Math.min(600, Number(body.estMinutes) || 30));
    }
    if (body.date) {
      const d = new Date(body.date);
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "invalid date" }, { status: 400 });
      }
      data.date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ task: existing });
    }

    const updated = await db.plannerTask.update({ where: { id }, data });
    return NextResponse.json({ task: updated });
  } catch (error) {
    return serverError("API PATCH /api/planner/[id] error:", error);
  }
}

// DELETE /api/planner/[id] — remove a task
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

    const existing = await db.plannerTask.findUnique({ where: { id } });
    if (!existing || existing.profileId !== profile.id) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    await db.plannerTask.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError("API DELETE /api/planner/[id] error:", error);
  }
}