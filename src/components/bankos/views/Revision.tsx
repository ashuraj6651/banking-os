"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { RefreshCw, Clock, Brain, ChevronRight, Zap, Loader2, Check, Layers, X, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard, GlassPanel } from "../GlassCard";
import { useRevision, useReviewItem } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function Revision() {
  const { data, isLoading } = useRevision();
  const review = useReviewItem();
  const items = data?.items ?? [];
  const dueToday = items.filter((i) => i.due === "Today").length;

  // Flashcard state
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  async function handleReview(id: string) {
    try {
      await review.mutateAsync(id);
      toast.success("Reviewed — strength increased");
    } catch {
      toast.error("Could not update");
    }
  }

  const currentCard = items[cardIndex] ?? null;

  function exitFlashcard() {
    setFlashcardMode(false);
    setCardIndex(0);
    setFlipped(false);
  }

  const advanceCard = useCallback((reviewed: boolean) => {
    if (!currentCard) return;
    if (reviewed) {
      handleReview(currentCard.id);
    }
    setFlipped(false);
    if (cardIndex < items.length - 1) {
      setCardIndex((i) => i + 1);
    } else {
      // All cards reviewed
      setFlashcardMode(false);
      toast.success("All cards reviewed!");
    }
  }, [currentCard, cardIndex, items.length, handleReview]);

  // Swipe handling via drag
  const dragX = useMotionValue(0);
  const cardRotation = useTransform(dragX, [-200, 200], [-18, 18]);
  const cardOpacity = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const exitOverlayColor = useTransform(dragX, [-200, -80, 0, 80, 200], [
    "rgba(244,63,94,0.2)",
    "rgba(244,63,94,0.05)",
    "rgba(0,0,0,0)",
    "rgba(16,185,129,0.05)",
    "rgba(16,185,129,0.2)",
  ]);
  const leftTextOpacity = useTransform(dragX, [-200, -80, 0], [1, 0, 0]);
  const rightTextOpacity = useTransform(dragX, [0, 80, 200], [0, 0, 1]);

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.x > 100) {
      advanceCard(true);
    } else if (info.offset.x < -100) {
      advanceCard(false);
    }
  }

  // --- Flashcard Mode ---
  if (flashcardMode && items.length > 0 && currentCard) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={exitFlashcard}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Exit
            </button>
            <span className="text-sm text-white/50">
              {cardIndex + 1} of {items.length} cards
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: `${((cardIndex + 1) / items.length) * 100}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </div>
        </div>

        {/* Flashcard container with perspective */}
        <div className="flex items-center justify-center py-4">
          <div className="relative w-full max-w-md" style={{ perspective: 1200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.9}
                  onDragEnd={handleDragEnd}
                  style={{ x: dragX, rotate: cardRotation, opacity: cardOpacity }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {/* Exit overlay */}
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-10 rounded-3xl"
                    style={{ backgroundColor: exitOverlayColor }}
                  />
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl"
                    style={{ opacity: leftTextOpacity }}
                  >
                    <span className="text-lg font-bold text-rose-300">Needs work</span>
                  </motion.div>
                  <motion.div
                    className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-3xl"
                    style={{ opacity: rightTextOpacity }}
                  >
                    <span className="text-lg font-bold text-emerald-300">Got it!</span>
                  </motion.div>

                  {/* 3D flip container */}
                  <motion.div
                    className="relative w-full"
                    style={{ transformStyle: "preserve-3d" }}
                    animate={{ rotateY: flipped ? 180 : 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    onClick={() => setFlipped((f) => !f)}
                  >
                    {/* Front face */}
                    <div
                      className="glass-card relative flex min-h-[320px] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-white/[0.08] p-8 sm:min-h-[380px]"
                      style={{ backfaceVisibility: "hidden" }}
                    >
                      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
                      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
                      <div className="relative z-10 text-center">
                        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-cyan-500/10">
                          <Brain className="h-8 w-8 text-violet-300" />
                        </div>
                        <h2 className="mt-6 text-2xl font-bold text-white sm:text-3xl">{currentCard.topic}</h2>
                        <span className="mt-3 inline-block rounded-full border border-white/10 px-3 py-1 text-sm text-white/50">
                          {currentCard.subject}
                        </span>
                        <p className="mt-6 text-xs text-white/30">Tap to reveal details</p>
                      </div>
                    </div>

                    {/* Back face */}
                    <div
                      className="glass-card absolute inset-0 flex min-h-[320px] w-full cursor-pointer flex-col items-center justify-center rounded-3xl border border-cyan-400/15 p-8 sm:min-h-[380px]"
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                    >
                      <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-cyan-500/15 blur-3xl" />
                      <div className="absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl" />
                      <div className="relative z-10 w-full space-y-5">
                        <div className="text-center">
                          <h2 className="text-lg font-semibold text-white">{currentCard.topic}</h2>
                          <span className="text-xs text-white/40">{currentCard.subject}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <GlassPanel className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                            <Clock className="h-5 w-5 text-amber-300" />
                            <span className="mt-2 text-lg font-bold text-white">{currentCard.due}</span>
                            <span className="text-[10px] text-white/40">Due</span>
                          </GlassPanel>
                          <GlassPanel className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                            <Zap className="h-5 w-5 text-violet-300" />
                            <span className="mt-2 text-lg font-bold text-white">{currentCard.strength}%</span>
                            <span className="text-[10px] text-white/40">Strength</span>
                          </GlassPanel>
                          <GlassPanel className="flex flex-col items-center rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                            <RotateCcw className="h-5 w-5 text-cyan-300" />
                            <span className="mt-2 text-lg font-bold text-white">{currentCard.interval}d</span>
                            <span className="text-[10px] text-white/40">Interval</span>
                          </GlassPanel>
                        </div>
                        <p className="text-center text-xs text-white/30">Tap to flip back</p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => advanceCard(false)}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-6 py-3 text-sm font-medium text-rose-300 transition-colors hover:border-rose-400/40 hover:bg-rose-500/20"
          >
            <ThumbsDown className="h-4 w-4" />
            Needs work
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFlipped((f) => !f)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
          >
            <Layers className="h-4 w-4" />
            Flip
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => advanceCard(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-6 py-3 text-sm font-medium text-emerald-300 transition-colors hover:border-emerald-400/40 hover:bg-emerald-500/20"
          >
            <ThumbsUp className="h-4 w-4" />
            Got it
          </motion.button>
        </div>
      </div>
    );
  }

  // --- Normal List View ---
  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Spaced Repetition"
        badgeIcon={<RefreshCw className="h-3 w-3" />}
        title="Revision Engine"
        subtitle="AI schedules your revision automatically. Never forget a concept again."
        actions={
          items.length > 0 ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setCardIndex(0); setFlipped(false); setFlashcardMode(true); }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200 transition-colors hover:border-violet-400/40 hover:bg-violet-500/20"
            >
              <Layers className="h-3.5 w-3.5" />
              Flashcard Mode
            </motion.button>
          ) : undefined
        }
      />

      {items.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Review progress</span>
            <span className="font-medium text-white">{items.filter((i) => i.strength >= 80).length} / {items.length} mastered</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${items.length > 0 ? (items.filter((i) => i.strength >= 80).length / items.length) * 100 : 0}%` }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <GlassCard>
          <div className="p-5">
            <Clock className="h-5 w-5 text-amber-300" />
            <div className="mt-3 text-3xl font-bold text-white">{dueToday}</div>
            <div className="text-xs text-white/40">Due today</div>
          </div>
        </GlassCard>
        <GlassCard delay={0.05}>
          <div className="p-5">
            <Brain className="h-5 w-5 text-violet-300" />
            <div className="mt-3 text-3xl font-bold text-white">{items.length}</div>
            <div className="text-xs text-white/40">Concepts tracked</div>
          </div>
        </GlassCard>
        <GlassCard delay={0.1}>
          <div className="p-5">
            <Zap className="h-5 w-5 text-emerald-300" />
            <div className="mt-3 text-3xl font-bold text-white">
              {items.length > 0 ? Math.round(items.reduce((a, i) => a + i.strength, 0) / items.length) : 0}%
            </div>
            <div className="text-xs text-white/40">Avg retention</div>
          </div>
        </GlassCard>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading revision queue…
        </div>
      )}

      {items.length === 0 && !isLoading && (
        <GlassCard hover={false}>
          <div className="p-12 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/10">
              <Brain className="h-7 w-7 text-violet-300" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">No revision queued</h3>
            <p className="mt-1.5 text-sm text-white/50">When you answer a question wrong, the topic appears here for spaced revision.</p>
          </div>
        </GlassCard>
      )}

      {items.length > 0 && (
        <GlassCard hover={false}>
          <div className="p-6">
            <h3 className="text-sm font-semibold text-white">Revision Queue</h3>
            <div className="mt-4 space-y-2">
              {items.map((r, i) => {
                const due = r.due === "Today";
                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border p-4 transition-colors",
                      due ? "border-amber-400/20 bg-amber-500/[0.05]" : "border-white/[0.06] bg-white/[0.02]"
                    )}
                  >
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", due ? "border-amber-400/30 bg-amber-500/10 text-amber-300" : "border-white/10 bg-white/[0.03] text-white/50")}>
                      <Brain className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{r.topic}</span>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/40">{r.subject}</span>
                        {due && <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">Due today</span>}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-white/40">
                        <span>Due: {r.due}</span>
                        <span>· Interval: {r.interval} days</span>
                        <span>· Strength: {r.strength}%</span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div className="h-full rounded-full" style={{ width: `${r.strength}%`, background: r.strength >= 70 ? 'linear-gradient(90deg, #f59e0b, #10b981)' : r.strength >= 40 ? 'linear-gradient(90deg, #f43f5e, #f59e0b)' : '#f43f5e' }} />
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleReview(r.id)}
                      disabled={review.isPending}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-violet-400/40 hover:text-violet-200 disabled:opacity-50",
                        due && "animate-pulse"
                      )}
                    >
                      {r.strength >= 80 ? <Check className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      Review
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}