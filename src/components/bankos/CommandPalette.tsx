"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { useBankOS } from "@/lib/store";
import { AppView } from "@/lib/data";

const ITEMS: { view: AppView; label: string; icon: typeof LayoutDashboard; hint: string }[] = [
  { view: "mission", label: "Mission Control", icon: LayoutDashboard, hint: "Dashboard" },
  { view: "coach", label: "AI Coach — Ask anything", icon: Sparkles, hint: "Mentor" },
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

export function CommandPalette() {
  const { commandOpen, setCommandOpen, setView } = useBankOS();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === "Escape") setCommandOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [commandOpen, setCommandOpen]);

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
                  {ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <CommandPrimitive.Item
                        key={item.view}
                        value={`${item.label} ${item.hint}`}
                        onSelect={() => run(item.view)}
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
              </CommandPrimitive.List>
            </CommandPrimitive>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
