import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getProfile } from "@/lib/metrics";

export const runtime = "nodejs";

// PATCH /api/planner/[id] — update fields, or toggle status when body = { toggle: true }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (typeof body.status === "string") data.status = body.status;
  if (typeof body.description === "string") data.description = body.description;
  if (typeof body.order === "number") data.order = body.order;
  if (body.estMinutes !== undefined) {
    data.estMinutes = Math.max(5, Math.min(600, Number(body.estMinutes) || 30));
  }
  if (body.date) {
    const d = new Date(body.date);
    data.date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }

  const updated = await db.plannerTask.update({ where: { id }, data });
  return NextResponse.json({ task: updated });
}

// DELETE /api/planner/[id] — remove a task
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "no profile" }, { status: 404 });

  const existing = await db.plannerTask.findUnique({ where: { id } });
  if (!existing || existing.profileId !== profile.id) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.plannerTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
