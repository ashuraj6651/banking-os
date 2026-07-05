"use client";

import { useEffect, useCallback } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  Timer,
  BarChart3,
  Globe2,
  Network,
  NotebookPen,
  RefreshCw,
  Newspaper,
  User,
  Settings,
  Search,
  CornerDownLeft,
  ListChecks,
  Keyboard,
} from "lucide-react";
import { useBankOS } from "@/lib/store";
import type { AppView } from "@/lib/data";

const ITEMS: { view: AppView; label: string; icon: typeof LayoutDashboard; hint: string }[] = [
  { view: "mission", label: "Mission Control", icon: LayoutDashboard, hint: "Dashboard" },
  { view: "challenge", label: "AI Coach — Ask anything", icon: Sparkles, hint: "Mentor" },
  { view: "practice", label: "Practice Questions", icon: Layers, hint: "Drill" },
  { view: "mock", label: "Start a Mock Test", icon: Timer, hint: "Exam sim" },
  { view: "syllabus", label: "Syllabus Checklist", icon: ListChecks, hint: "Coverage" },
  { view: "analytics", label: "Analytics", icon: BarChart3, hint: "Insights" },
  { view: "world", label: "World Map", icon: Globe2, hint: "Explore" },
  { view: "skills", label: "Skill Tree", icon: Network, hint: "Mastery" },
  { view: "current", label: "Current Affairs", icon: Newspaper, hint: "Daily" },
  { view: "notebook", label: "Error Notebook", icon: NotebookPen, hint: "Review" },
  { view: "revision", label: "Revision Engine", icon: RefreshCw, hint: "Spaced" },
  { view: "profile", label: "Profile", icon: User, hint: "Account" },
  { view: "settings", label: "Settings", icon: Settings, hint: "Prefs" },
];

// 1-9 key mapping to views (matches sidebar nav order)
const NAV_KEYS: AppView[] = [
  "mission",
  "challenge",
  "coach",
  "timer",
  "practice",
  "mock",
  "syllabus",
  "analytics",
  "world",
];

// All keyboard shortcuts for display
const ALL_SHORTCUTS = [
  { keys: "⌘K / ?", label: "Open command palette" },
  { keys: "1–9", label: "Navigate to views" },
  { keys: "Esc", label: "Close overlay" },
  { keys: "T", label: "Start study timer" },
  { keys: "⌘1–5", label: "Quick nav (first 5)" },
];

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setView, focusMode, endSession } = useBankOS();

  // Global keyboard shortcut handler
  const handleGlobalKey = useCallback(
    (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isInputFocused =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el?.getAttribute("contenteditable") === "true";

      // Escape — close any overlay
      if (e.key === "Escape") {
        if (commandOpen) {
          setCommandOpen(false);
        } else if (focusMode) {
          endSession();
        }
        // Dispatch custom event for mobile drawer to listen to
        window.dispatchEvent(new CustomEvent("bankos:close-overlays"));
        return;
      }

      // Don't trigger shortcuts when typing in inputs
      if (isInputFocused) return;

      // ? or Shift+/ — open command palette
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }

      // ⌘K / Ctrl+K — toggle command palette
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
        return;
      }

      // 1-9 — switch nav views
      if (!commandOpen && !focusMode) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          setView(NAV_KEYS[num - 1]);
          return;
        }
      }

      // T — open study timer
      if (!commandOpen && !focusMode && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setView("timer");
        return;
      }
    },
    [commandOpen, focusMode, setCommandOpen, setView, endSession],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [handleGlobalKey]);

  function run(view: AppView) {
    setView(view);
    setCommandOpen(false);
  }

  return (
    <AnimatePresence>
      {commandOpen && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCommandOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120]/95 shadow-2xl backdrop-blur-2xl"
          >
            <CommandPaletteInner
              items={ITEMS}
              onRun={run}
              onClose={() => setCommandOpen(false)}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CommandPaletteInner({
  items,
  onRun,
  onClose,
}: {
  items: typeof ITEMS;
  onRun: (v: AppView) => void;
  onClose: () => void;
}) {
  return (
    <CommandPrimitive loop className="flex flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
        <Search className="h-5 w-5 text-white/40" />
        <CommandPrimitive.Input
          autoFocus
          placeholder="Search BankOS or ask your AI Coach…"
          className="flex-1 bg-transparent text-base text-white placeholder:text-white/30 focus:outline-none"
        />
        <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40">
          ESC
        </kbd>
      </div>
      <CommandPrimitive.List className="max-h-[360px] overflow-y-auto p-2 scrollbar-premium">
        <CommandPrimitive.Empty className="py-10 text-center text-sm text-white/40">
          No results found.
        </CommandPrimitive.Empty>
        <CommandPrimitive.Group heading="Navigate" className="text-white/40">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <CommandPrimitive.Item
                key={item.view}
                value={`${item.label} ${item.hint}`}
                onSelect={() => onRun(item.view)}
                className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-white"
              >
                <Icon className="h-[18px] w-[18px] text-white/40 group-data-[selected=true]:text-violet-300" />
                <span className="flex-1">{item.label}</span>
                <span className="text-[11px] text-white/30">{item.hint}</span>
                <CornerDownLeft className="h-3.5 w-3.5 text-white/20 opacity-0 group-data-[selected=true]:opacity-100" />
              </CommandPrimitive.Item>
            );
          })}
        </CommandPrimitive.Group>

        {/* Keyboard Shortcuts help entry */}
        <CommandPrimitive.Group heading="Help" className="text-white/40">
          <CommandPrimitive.Item
            value="keyboard shortcuts help"
            onSelect={() => {
              /* keep palette open to show shortcuts below */
            }}
            className="group flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/70 data-[selected=true]:bg-violet-500/15 data-[selected=true]:text-white"
          >
            <Keyboard className="h-[18px] w-[18px] text-white/40 group-data-[selected=true]:text-violet-300" />
            <span className="flex-1">Keyboard Shortcuts</span>
            <span className="text-[11px] text-white/30">Reference</span>
            <CornerDownLeft className="h-3.5 w-3.5 text-white/20 opacity-0 group-data-[selected=true]:opacity-100" />
          </CommandPrimitive.Item>
        </CommandPrimitive.Group>

        {/* Shortcuts help card shown when "shortcuts" or "keyboard" is searched */}
        <ShortcutsHelpCard />
      </CommandPrimitive.List>

      {/* Keyboard shortcuts footer */}
      <div className="border-t border-white/[0.06] px-5 py-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          <Shortcut label="Search" keys="⌘K / ?" />
          <Shortcut label="Navigate" keys="1–9" />
          <Shortcut label="Timer" keys="T" />
          <Shortcut label="Close" keys="Esc" />
        </div>
      </div>
    </CommandPrimitive>
  );
}

function ShortcutsHelpCard() {
  return (
    <CommandPrimitive.Item
      value="shortcuts keyboard reference all"
      className="group flex flex-col gap-3 rounded-xl px-3 py-3 text-sm text-white/70 data-[selected=true]:bg-violet-500/15"
      onSelect={() => {
        /* no-op: just informational */
      }}
    >
      <div className="flex items-center gap-2 text-white/50">
        <Keyboard className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wider">All Shortcuts</span>
      </div>
      <div className="grid gap-1.5 pl-1">
        {ALL_SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between gap-4">
            <span className="text-[13px] text-white/60">{s.label}</span>
            <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] text-white/40">
              {s.keys}
            </kbd>
          </div>
        ))}
      </div>
      <div className="mt-1 border-t border-white/[0.06] pt-2 text-[11px] text-white/30">
        Shortcuts only work when no input is focused
      </div>
    </CommandPrimitive.Item>
  );
}

function Shortcut({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] text-white/30">
      <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-white/40">
        {keys}
      </kbd>
      <span>{label}</span>
    </div>
  );
}