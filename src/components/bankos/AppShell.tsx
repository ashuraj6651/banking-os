"use client";

import { useState } from "react";
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
  Menu,
  X,
  Flame,
  Coins,
  Command,
  Search,
  LogOut,
} from "lucide-react";
import { useBankOS } from "@/lib/store";
import { AppView } from "@/lib/data";
import { useProfileStats, useLogout, useAuth } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Primitives";
import { CommandPalette } from "./CommandPalette";
import { FocusMode } from "./views/FocusMode";
import { MissionControl } from "./views/MissionControl";
import { Coach } from "./views/Coach";
import { Practice } from "./views/Practice";
import { MockTest } from "./views/MockTest";
import { Analytics } from "./views/Analytics";
import { WorldMap } from "./views/WorldMap";
import { SkillTree } from "./views/SkillTree";
import { Notebook } from "./views/Notebook";
import { Revision } from "./views/Revision";
import { CurrentAffairs } from "./views/CurrentAffairs";
import { Profile } from "./views/Profile";
import { SettingsView } from "./views/SettingsView";
import { Syllabus } from "./views/Syllabus";
import { ListChecks } from "lucide-react";

const NAV: { view: AppView; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { view: "mission", label: "Mission Control", icon: LayoutDashboard, group: "Operate" },
  { view: "coach", label: "AI Coach", icon: Sparkles, group: "Operate" },
  { view: "practice", label: "Practice", icon: Layers, group: "Train" },
  { view: "mock", label: "Mock Tests", icon: Timer, group: "Train" },
  { view: "syllabus", label: "Syllabus", icon: ListChecks, group: "Train" },
  { view: "analytics", label: "Analytics", icon: BarChart3, group: "Train" },
  { view: "world", label: "World Map", icon: Globe2, group: "Explore" },
  { view: "skills", label: "Skill Tree", icon: Network, group: "Explore" },
  { view: "current", label: "Current Affairs", icon: Newspaper, group: "Explore" },
  { view: "notebook", label: "Error Notebook", icon: NotebookPen, group: "Refine" },
  { view: "revision", label: "Revision Engine", icon: RefreshCw, group: "Refine" },
  { view: "profile", label: "Profile", icon: User, group: "Account" },
  { view: "settings", label: "Settings", icon: Settings, group: "Account" },
];

function ViewRouter() {
  const { activeView } = useBankOS();
  switch (activeView) {
    case "mission": return <MissionControl />;
    case "coach": return <Coach />;
    case "practice": return <Practice />;
    case "mock": return <MockTest />;
    case "analytics": return <Analytics />;
    case "world": return <WorldMap />;
    case "skills": return <SkillTree />;
    case "current": return <CurrentAffairs />;
    case "syllabus": return <Syllabus />;
    case "notebook": return <Notebook />;
    case "revision": return <Revision />;
    case "profile": return <Profile />;
    case "settings": return <SettingsView />;
    default: return <MissionControl />;
  }
}

function NavGroup({ label }: { label: string }) {
  return (
    <div className="px-4 pt-5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/25">
      {label}
    </div>
  );
}

export function AppShell() {
  const { activeView, setView, focusMode, exitToLanding } = useBankOS();
  const { data: stats } = useProfileStats();
  const { data: authData } = useAuth();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profile = stats?.profile;
  const account = authData?.account;

  function handleLogout() {
    logout.mutate();
    exitToLanding();
  }

  const groups = ["Operate", "Train", "Explore", "Refine", "Account"];

  return (
    <div className="relative min-h-screen">
      {/* ===== Desktop Sidebar ===== */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-white/[0.06] bg-[#070b16]/80 backdrop-blur-2xl lg:flex">
        <div className="flex h-16 items-center px-5">
          <Wordmark />
        </div>
        <nav className="flex-1 overflow-y-auto scrollbar-premium pb-6">
          {groups.map((g) => (
            <div key={g}>
              <NavGroup label={g} />
              {NAV.filter((n) => n.group === g).map((item) => {
                const Icon = item.icon;
                const active = activeView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => setView(item.view)}
                    className={cn(
                      "group relative mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
                      active
                        ? "bg-gradient-to-r from-violet-500/20 to-transparent text-white"
                        : "text-white/55 hover:bg-white/5 hover:text-white/90"
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-electric-400"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0 transition-colors",
                        active ? "text-violet-300" : "text-white/40 group-hover:text-white/70"
                      )}
                    />
                    <span className="font-medium tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* user card */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-electric-500 text-xs font-bold text-white">
              {profile?.name?.slice(0, 2).toUpperCase() ?? "??"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-white">{profile?.name ?? "…"}</div>
              <div className="truncate text-[11px] text-white/40">{account?.email ?? ""}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 text-white/40 transition-colors hover:border-rose-400/30 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Mobile top bar ===== */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#070b16]/90 px-4 backdrop-blur-2xl lg:hidden">
        <Wordmark size="sm" />
        <button
          onClick={() => setMobileOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* ===== Mobile drawer ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              className="fixed left-0 top-0 z-50 h-screen w-[280px] border-r border-white/10 bg-[#070b16] lg:hidden"
            >
              <div className="flex h-14 items-center justify-between px-4">
                <Wordmark />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg text-white/60"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="h-[calc(100vh-3.5rem)] overflow-y-auto pb-6 scrollbar-premium">
                {groups.map((g) => (
                  <div key={g}>
                    <NavGroup label={g} />
                    {NAV.filter((n) => n.group === g).map((item) => {
                      const Icon = item.icon;
                      const active = activeView === item.view;
                      return (
                        <button
                          key={item.view}
                          onClick={() => {
                            setView(item.view);
                            setMobileOpen(false);
                          }}
                          className={cn(
                            "mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                            active
                              ? "bg-violet-500/15 text-white"
                              : "text-white/55 hover:bg-white/5 hover:text-white/90"
                          )}
                        >
                          <Icon className="h-[18px] w-[18px]" />
                          <span className="font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===== Main ===== */}
      <div className="lg:pl-[260px]">
        <Topbar />
        <main className="mx-auto max-w-[1400px] px-4 pb-24 pt-6 sm:px-6 lg:px-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <ViewRouter />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <CommandPalette />
      <AnimatePresence>{focusMode && <FocusMode />}</AnimatePresence>
    </div>
  );
}

function Topbar() {
  const { setCommandOpen, setView } = useBankOS();
  const { data: stats } = useProfileStats();
  const profile = stats?.profile;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-4 border-b border-white/[0.06] bg-[#050816]/70 px-6 backdrop-blur-2xl lg:flex">
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/40">{greeting},</span>
        <button onClick={() => setView("profile")} className="text-sm font-semibold text-white hover:text-violet-300 transition-colors">
          {profile?.name ?? "…"}
        </button>
        {profile && (
          <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-medium text-violet-200">
            {profile.exam}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setCommandOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/10 hover:text-white/80"
        >
          <Search className="h-4 w-4" />
          <span className="hidden xl:inline">Search or ask AI…</span>
          <kbd className="hidden items-center gap-0.5 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-white/40 xl:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>

        <div className="flex items-center gap-1.5 rounded-xl border border-amber-400/20 bg-amber-500/10 px-3 py-2">
          <Flame className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-200">{profile?.streak ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl border border-violet-400/20 bg-violet-500/10 px-3 py-2">
          <Coins className="h-4 w-4 text-violet-300" />
          <span className="text-sm font-semibold text-violet-200">{(profile?.coins ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </header>
  );
}
