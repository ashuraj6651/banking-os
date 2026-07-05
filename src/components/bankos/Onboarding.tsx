"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Sparkles, Calendar, Clock, Target } from "lucide-react";
import { useBankOS } from "@/lib/store";
import { useOnboard } from "@/lib/hooks";
import { Wordmark, Eyebrow } from "./Primitives";
import { EXAMS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const SUBJECTS = ["Reasoning", "English", "Quant", "Banking", "Current Affairs"];
const HOURS = [2, 3, 4, 5, 6, 7, 8];

// default target date: ~10 months out
function defaultTargetDate() {
  const d = new Date();
  d.setMonth(d.getMonth() + 10);
  return d.toISOString().slice(0, 10);
}

export function Onboarding() {
  const { enterApp, exitToLanding } = useBankOS();
  const onboard = useOnboard();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [exam, setExam] = useState("SBI PO");
  const [targetDate, setTargetDate] = useState(defaultTargetDate());
  const [hours, setHours] = useState(4);
  const [weak, setWeak] = useState<string[]>([]);

  const defaultDate = defaultTargetDate();

  const steps = ["Identity", "Exam", "Schedule", "Weaknesses", "Launch"];

  function next() {
    if (step === 0 && !name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (step === 2 && !targetDate) {
      toast.error("Please pick a target date");
      return;
    }
    setStep((s) => Math.min(steps.length - 1, s + 1));
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function finish() {
    const loading = toast.loading("Your AI Mentor is building your roadmap…");
    try {
      await onboard.mutateAsync({
        name: name.trim(),
        exam,
        targetDate: targetDate || defaultDate,
        studyHoursPerDay: hours,
        weakSubjects: weak,
      });
      toast.dismiss(loading);
      toast.success("Welcome to BankOS. Let's begin.");
      enterApp();
    } catch {
      toast.dismiss(loading);
      toast.error("Something went wrong. Try again.");
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <button
        onClick={exitToLanding}
        className="absolute left-5 top-5 text-sm text-white/40 transition-colors hover:text-white"
      >
        ← Back to landing
      </button>

      <div className="w-full max-w-lg">
        <div className="mb-8 flex justify-center">
          <Wordmark size="lg" />
        </div>

        {/* progress */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold transition-all",
                  i < step && "border-emerald-400/40 bg-emerald-500/20 text-emerald-300",
                  i === step && "border-violet-400/50 bg-violet-500/20 text-violet-200",
                  i > step && "border-white/10 bg-white/[0.03] text-white/30"
                )}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-px w-8", i < step ? "bg-emerald-400/40" : "bg-white/10")} />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card rounded-3xl p-7 sm:p-9">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <Step key="s0">
                <Eyebrow><Sparkles className="h-3 w-3" /> Step 1 of 4</Eyebrow>
                <h2 className="mt-4 text-2xl font-bold text-white">What should we call you?</h2>
                <p className="mt-1.5 text-sm text-white/50">Your Mentor will greet you by name every day.</p>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && next()}
                  placeholder="e.g. Ashu"
                  className="mt-6 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-lg text-white placeholder:text-white/30 focus:border-violet-400/40 focus:outline-none"
                />
              </Step>
            )}

            {step === 1 && (
              <Step key="s1">
                <Eyebrow><Target className="h-3 w-3" /> Step 2 of 4</Eyebrow>
                <h2 className="mt-4 text-2xl font-bold text-white">Which exam are you writing?</h2>
                <p className="mt-1.5 text-sm text-white/50">We'll tailor every question, mock and roadmap to it.</p>
                <div className="mt-6 grid grid-cols-2 gap-2.5">
                  {EXAMS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setExam(e)}
                      className={cn(
                        "rounded-2xl border px-4 py-3 text-left text-sm font-medium transition-all",
                        exam === e
                          ? "border-violet-400/50 bg-violet-500/15 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                      )}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </Step>
            )}

            {step === 2 && (
              <Step key="s2">
                <Eyebrow><Calendar className="h-3 w-3" /> Step 3 of 4</Eyebrow>
                <h2 className="mt-4 text-2xl font-bold text-white">When is your exam?</h2>
                <p className="mt-1.5 text-sm text-white/50">The countdown starts the moment you launch.</p>
                <div className="mt-6 space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/40">
                      Target date
                    </label>
                    <input
                      type="date"
                      value={targetDate || defaultDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-lg text-white focus:border-violet-400/40 focus:outline-none [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-white/40">
                      <Clock className="h-3.5 w-3.5" /> Study hours per day
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {HOURS.map((h) => (
                        <button
                          key={h}
                          onClick={() => setHours(h)}
                          className={cn(
                            "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                            hours === h
                              ? "border-violet-400/50 bg-violet-500/15 text-white"
                              : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                          )}
                        >
                          {h}h
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Step>
            )}

            {step === 3 && (
              <Step key="s3">
                <Eyebrow><Sparkles className="h-3 w-3" /> Step 4 of 4</Eyebrow>
                <h2 className="mt-4 text-2xl font-bold text-white">Any weak subjects?</h2>
                <p className="mt-1.5 text-sm text-white/50">Your AI Mentor will weight these heavier in your daily plan. Pick all that apply.</p>
                <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SUBJECTS.map((s) => {
                    const sel = weak.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() =>
                          setWeak((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
                        }
                        className={cn(
                          "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
                          sel
                            ? "border-rose-400/40 bg-rose-500/10 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20"
                        )}
                      >
                        {s}
                        {sel && <Check className="h-4 w-4 text-rose-300" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-white/30">Optional — you can change this later.</p>
              </Step>
            )}

            {step === 4 && (
              <Step key="s4">
                <Eyebrow><Sparkles className="h-3 w-3" /> Ready</Eyebrow>
                <h2 className="mt-4 text-2xl font-bold text-white">Your operating system is ready.</h2>
                <p className="mt-1.5 text-sm text-white/50">
                  We'll generate today's mission and your AI roadmap the moment you launch.
                </p>
                <div className="mt-6 space-y-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <Row label="Name" value={name} />
                  <Row label="Exam" value={exam} />
                  <Row label="Target" value={targetDate || defaultDate} />
                  <Row label="Daily hours" value={`${hours}h`} />
                  <Row label="Weak spots" value={weak.length ? weak.join(", ") : "—"} />
                </div>
              </Step>
            )}
          </AnimatePresence>

          {/* nav */}
          <div className="mt-8 flex items-center justify-between">
            {step > 0 ? (
              <button
                onClick={back}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.6)]"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={onboard.isPending}
                className="shine inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-violet-500 to-electric-600 px-7 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(139,92,246,0.6)] disabled:opacity-60"
              >
                {onboard.isPending ? "Generating…" : "Launch BankOS"} <Sparkles className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-white/30">
          Real data. Real progress. Everything here is computed from your actual study activity.
        </p>
      </div>
    </div>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/40">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}
