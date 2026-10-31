"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Check, Database, Download, FileUp, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { GlassCard } from "./GlassCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImportQuestions, useQuestionBankStats, type ImportResult } from "@/lib/hooks";
import { CSV_TEMPLATE, JSON_TEMPLATE } from "@/lib/question-bank/import";
import { cn } from "@/lib/utils";

const MAX_BYTES = 2_500_000;

function download(name: string, content: string, mime: string) {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Shows how big the question bank is and lets the user add a new list
 * (JSON or CSV — typically once a month) straight into it.
 */
export function QuestionBankPanel({ perChallenge = 25 }: { perChallenge?: number }) {
  const { data, isLoading } = useQuestionBankStats();
  const importQ = useImportQuestions();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const challengesLeft = data ? Math.floor(data.fresh / perChallenge) : 0;
  const low = !!data && challengesLeft < 5;

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("File is too large (max ~2.5 MB). Split it into two uploads.");
      return;
    }
    setContent(await file.text());
    setFileName(file.name);
    setResult(null);
    setErrorMsg("");
  }

  async function submit() {
    setResult(null);
    setErrorMsg("");
    try {
      const res = await importQ.mutateAsync({ content });
      setResult(res);
      if (res.added > 0) toast.success(`${res.added} new questions added to the bank`);
      else toast.info("No new questions — they were all already in the bank");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Import failed");
    }
  }

  function close(next: boolean) {
    setOpen(next);
    if (!next) {
      setContent("");
      setFileName("");
      setResult(null);
      setErrorMsg("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <GlassCard className="p-6 border-white/10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-electric-500/20 bg-electric-500/15">
              <Database className="h-6 w-6 text-electric-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white/50">Question Bank</h3>
              {isLoading || !data ? (
                <p className="mt-1 text-sm text-white/40">Loading bank…</p>
              ) : (
                <p className="mt-1 text-sm text-white/70">
                  <span className="font-semibold text-white">{data.total}</span> questions ·{" "}
                  <span className="font-semibold text-emerald-300">{data.fresh}</span> you haven&apos;t seen yet
                  {" · "}
                  <span className={cn("font-semibold", low ? "text-amber-300" : "text-white")}>
                    ~{challengesLeft} fresh challenge{challengesLeft === 1 ? "" : "s"} left
                  </span>
                </p>
              )}
              {low && (
                <p className="mt-1 text-xs text-amber-300/80">
                  Running low on new questions — add this month&apos;s list so challenges stay fresh.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Add questions
          </button>
        </div>

        {data && data.bySubject.length > 0 && (
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {data.bySubject.map((s) => (
              <div key={s.subject} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="text-[11px] uppercase tracking-wider text-white/40">{s.subject}</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  {s.fresh}
                  <span className="font-normal text-white/40"> / {s.total} new</span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-electric-500"
                    style={{ width: `${s.total ? Math.round((s.fresh / s.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add questions to the bank</DialogTitle>
            <DialogDescription>
              Upload or paste a JSON / CSV list. New questions are added to the bank and start showing up in Daily
              Challenge (and Practice). Questions already in the bank are skipped automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".json,.csv,.txt,application/json,text/csv,text/plain"
                className="hidden"
                onChange={(e) => onFile(e.target.files?.[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/80 hover:bg-white/10"
              >
                <FileUp className="h-4 w-4" />
                {fileName || "Choose .json / .csv file"}
              </button>
              <button
                onClick={() => download("questions-template.csv", CSV_TEMPLATE, "text/csv")}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/60 hover:bg-white/5"
              >
                <Download className="h-3.5 w-3.5" /> CSV template
              </button>
              <button
                onClick={() => download("questions-template.json", JSON_TEMPLATE, "application/json")}
                className="flex min-h-[40px] items-center gap-2 rounded-xl border border-white/10 px-3 text-xs text-white/60 hover:bg-white/5"
              >
                <Download className="h-3.5 w-3.5" /> JSON template
              </button>
            </div>

            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setResult(null);
                setErrorMsg("");
              }}
              placeholder={"…or paste here.\n\nCSV columns: subject, topic, difficulty, question, option_a, option_b, option_c, option_d, answer (A–D), explanation"}
              className="h-56 w-full resize-y rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-xs text-white/80 outline-none placeholder:text-white/25 focus:border-violet-500/50"
              spellCheck={false}
            />

            <p className="text-xs leading-relaxed text-white/40">
              Subject must be Reasoning, English, Quant, Banking or Current Affairs. Answer is A, B, C or D (or 1–4).
              Difficulty (Easy / Medium / Hard) and topic are optional.
            </p>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {result && (
              <div className="space-y-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                <div className="flex items-center gap-2 font-semibold">
                  <Check className="h-4 w-4" /> {result.added} added · {result.duplicates} already in bank ·{" "}
                  {result.invalid} invalid (of {result.total})
                </div>
                {result.errors.length > 0 && (
                  <ul className="max-h-32 list-disc space-y-0.5 overflow-y-auto pl-5 text-xs text-amber-200/90">
                    {result.errors.map((e, i) => (
                      <li key={i}>
                        Row {e.row}: {e.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => close(false)}
                className="min-h-[44px] rounded-xl border border-white/10 px-5 text-sm font-medium text-white/70 hover:bg-white/5"
              >
                {result ? "Done" : "Cancel"}
              </button>
              <button
                onClick={submit}
                disabled={!content.trim() || importQ.isPending}
                className="flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-electric-600 px-6 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importQ.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {importQ.isPending ? "Adding…" : "Add to bank"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
