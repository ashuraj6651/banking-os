"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Bell,
  Sparkles,
  Download,
  Shield,
  Palette,
  Focus,
  Upload,
  Cloud,
  AlertTriangle,
  GraduationCap,
  Clock,
  Target,
  Trash2,
  Info,
  Heart,
  User,
} from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useExportBackup, useImportBackup, useAuth, useLogout, useProfile, useUpdateProfile } from "@/lib/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESET_AVATARS = [
  { key: "Aurora", url: "https://api.dicebear.com/6.x/adventurer/svg?seed=Aurora" },
  { key: "Nova", url: "https://api.dicebear.com/6.x/adventurer/svg?seed=Nova" },
  { key: "Orion", url: "https://api.dicebear.com/6.x/adventurer/svg?seed=Orion" },
  { key: "Indigo", url: "https://api.dicebear.com/6.x/adventurer/svg?seed=Indigo" },
  { key: "Lumen", url: "https://api.dicebear.com/6.x/adventurer/svg?seed=Lumen" },
];

const PRESET_GOALS = [
  "SBI PO",
  "IBPS PO",
  "LIC AAO",
  "RBI Grade B",
  "UPSC Prelims",
];

function useSetting<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`bankos_setting_${key}`);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (prev: T) => T)(prev) : v;
        try {
          localStorage.setItem(`bankos_setting_${key}`, JSON.stringify(next));
        } catch {
          // storage full or unavailable
        }
        return next;
      });
    },
    [key]
  );
  return [value, set] as const;
}

export function SettingsView() {
  const [notif, setNotif] = useSetting("notif", {
    dailyReminder: true,
    streakWarning: true,
    achievementAlerts: true,
    briefing: true,
    revision: true,
    weekly: false,
  });
  const [ai, setAi] = useSetting("ai", { proactive: true, voiceBriefing: false, autoPlan: true });
  const [focus, setFocus] = useSetting("focus", { blockSites: true, ambient: true, autoFullscreen: false });
  const [reduceMotion, setReduceMotion] = useSetting("reduceMotion", false);
  const [twoFactorAuth, setTwoFactorAuth] = useSetting("twoFactorAuth", false);
  const [theme, setTheme] = useSetting("theme", "Dark");
  const [accentColor, setAccentColor] = useSetting("accentColor", "#8b5cf6");
  const [dailyGoal, setDailyGoal] = useSetting("dailyGoal", 50);
  const [defaultDifficulty, setDefaultDifficulty] = useSetting("defaultDifficulty", "mixed");
  const [focusTimer, setFocusTimer] = useSetting("focusTimer", "25");

  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const [profileName, setProfileName] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [profileGoal, setProfileGoal] = useState("");

  useEffect(() => {
    const profile = profileQuery.data?.profile;
    if (!profile) return;
    setProfileName(profile.name ?? "");
    setProfileAvatarUrl(profile.avatarUrl ?? "");
    setProfileGoal(profile.roadmap ?? "");
  }, [profileQuery.data?.profile]);

  async function saveProfileSettings() {
    try {
      await updateProfile.mutateAsync({
        name: profileName,
        avatarUrl: profileAvatarUrl || null,
        goal: profileGoal,
        roadmap: profileGoal,
      });
      toast.success("Profile updated");
      // Refresh the page to update avatar and name everywhere
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save profile.";
      toast.error(message || "Could not save profile.");
    }
  }

  function flip(group: "notif" | "ai" | "focus", key: string) {
    if (group === "notif") setNotif((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
    if (group === "ai") setAi((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
    if (group === "focus") setFocus((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
    toast.success("Settings updated");
  }

  function toggleBoolean(value: boolean, setter: (v: boolean) => void) {
    const next = !value;
    setter(next);
    toast.success("Settings updated");
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        badge="Preferences"
        badgeIcon={<Settings className="h-3 w-3" />}
        title="Settings"
        subtitle="Tune BankOS to match how you study best."
      />

      <GlassCard hover={false}>
        <Section icon={User} title="Profile" color="#22d3ee" />
        <div className="space-y-4 px-6 pb-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Name</div>
              <Input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">Profile avatar</div>
                  <div className="text-xs text-white/40">Choose a premade avatar for your account.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setProfileAvatarUrl("")}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition hover:bg-white/10"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {PRESET_AVATARS.map((avatar) => (
                  <button
                    key={avatar.key}
                    type="button"
                    onClick={() => setProfileAvatarUrl(avatar.url)}
                    className={cn(
                      "rounded-2xl border p-0.5 transition",
                      profileAvatarUrl === avatar.url
                        ? "border-violet-300 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:border-violet-400/40"
                    )}
                  >
                    <div className="overflow-hidden rounded-xl bg-[#0b1120] p-2">
                      <img src={avatar.url} alt={avatar.key} className="h-12 w-12 rounded-xl object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-white">Goal summary</div>
              <div className="text-xs text-white/40">Pick one of the preset goals to keep your profile concise.</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {PRESET_GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setProfileGoal(goal)}
                    className={cn(
                      "rounded-2xl border px-3 py-2 text-left text-sm transition",
                      profileGoal === goal
                        ? "border-violet-300 bg-violet-500/10 text-white"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-violet-400/40 hover:bg-white/10"
                    )}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setProfileGoal("")}
                className="text-xs text-white/50 hover:text-white"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={saveProfileSettings}
              disabled={updateProfile.isPending}
              className="btn-press inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-sky-500/80 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-shadow hover:shadow-[0_6px_26px_-12px_rgba(59,130,246,0.6)] disabled:opacity-60"
            >
              {updateProfile.isPending ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ===== Study Preferences ===== */}
        <GlassCard hover={false}>
          <Section icon={GraduationCap} title="Study Preferences" color="#8b5cf6" />
          <div className="space-y-4 px-6 pb-6">
            {/* Daily goal slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Daily question goal</div>
                  <div className="text-xs text-white/40">Questions to answer each day</div>
                </div>
                <span className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-200">
                  {dailyGoal}
                </span>
              </div>
              <Slider
                value={[dailyGoal]}
                onValueChange={(v) => setDailyGoal(v[0])}
                min={10}
                max={100}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-white/30">
                <span>10</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            <Separator className="bg-white/[0.06]" />

            {/* Default difficulty */}
            <Row label="Default difficulty" desc="Pre-select when starting practice">
              <Select
                value={defaultDifficulty}
                onValueChange={(v) => {
                  setDefaultDifficulty(v);
                  toast.success("Settings updated");
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[130px] border-white/10 bg-white/[0.03] text-white/80 focus:ring-violet-500/30"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0b1120]">
                  <SelectItem value="easy" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    Easy
                  </SelectItem>
                  <SelectItem value="medium" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    Medium
                  </SelectItem>
                  <SelectItem value="hard" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    Hard
                  </SelectItem>
                  <SelectItem value="mixed" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    Mixed
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>

            {/* Default focus timer */}
            <Row label="Focus session timer" desc="Default duration for Study Timer">
              <Select
                value={focusTimer}
                onValueChange={(v) => {
                  setFocusTimer(v);
                  toast.success("Settings updated");
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[110px] border-white/10 bg-white/[0.03] text-white/80 focus:ring-violet-500/30"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0b1120]">
                  <SelectItem value="15" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    15 min
                  </SelectItem>
                  <SelectItem value="25" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    25 min
                  </SelectItem>
                  <SelectItem value="30" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    30 min
                  </SelectItem>
                  <SelectItem value="45" className="text-white/80 focus:bg-violet-500/10 focus:text-white">
                    45 min
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </div>
        </GlassCard>

        {/* ===== Notifications ===== */}
        <GlassCard hover={false}>
          <Section icon={Bell} title="Notifications" color="#22d3ee" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Daily reminder" desc="Get reminded to study every day">
              <Switch
                checked={notif.dailyReminder}
                onCheckedChange={() => flip("notif", "dailyReminder")}
              />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Streak warning" desc="Alert when your streak is about to break">
              <Switch
                checked={notif.streakWarning}
                onCheckedChange={() => flip("notif", "streakWarning")}
              />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Achievement alerts" desc="Celebrate milestones and badges">
              <Switch
                checked={notif.achievementAlerts}
                onCheckedChange={() => flip("notif", "achievementAlerts")}
              />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Morning briefing" desc="Daily AI briefing at 8 AM">
              <Switch checked={notif.briefing} onCheckedChange={() => flip("notif", "briefing")} />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Revision due" desc="Get reminded when concepts expire">
              <Switch checked={notif.revision} onCheckedChange={() => flip("notif", "revision")} />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Weekly digest" desc="Sunday performance recap">
              <Switch checked={notif.weekly} onCheckedChange={() => flip("notif", "weekly")} />
            </Row>
          </div>
        </GlassCard>

        {/* ===== Appearance ===== */}
        <GlassCard hover={false}>
          <Section icon={Palette} title="Appearance" color="#8b5cf6" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Theme" desc="Dark theme is optimised for long sessions">
              <div className="flex gap-2">
                {["Dark", "Midnight", "Aurora"].map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      toast.success("Settings updated");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      t === theme
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                        : "border-white/10 bg-white/[0.03] text-white/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Accent colour" desc="Personalise your highlight spectrum">
              <div className="flex gap-2">
                {["#8b5cf6", "#3b82f6", "#22d3ee", "#ec4899"].map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setAccentColor(c);
                      toast.success("Settings updated");
                    }}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      c === accentColor ? "border-white scale-110" : "border-transparent"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Reduce motion" desc="Minimise animations across the OS">
              <Switch
                checked={reduceMotion}
                onCheckedChange={() => toggleBoolean(reduceMotion, setReduceMotion)}
              />
            </Row>
          </div>
        </GlassCard>

        {/* ===== AI Settings ===== */}
        <GlassCard hover={false}>
          <Section icon={Sparkles} title="AI Settings" color="#ec4899" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Proactive mentor" desc="Coach initiates briefings automatically">
              <Switch checked={ai.proactive} onCheckedChange={() => flip("ai", "proactive")} />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Voice briefings" desc="Listen to your morning briefing">
              <Switch checked={ai.voiceBriefing} onCheckedChange={() => flip("ai", "voiceBriefing")} />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Auto study planner" desc="Roadmap adapts daily">
              <Switch checked={ai.autoPlan} onCheckedChange={() => flip("ai", "autoPlan")} />
            </Row>
          </div>
        </GlassCard>

        {/* ===== Focus Mode ===== */}
        <GlassCard hover={false}>
          <Section icon={Focus} title="Focus Mode" color="#f59e0b" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Block distractions" desc="Hide everything except the question">
              <Switch checked={focus.blockSites} onCheckedChange={() => flip("focus", "blockSites")} />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Ambient sound" desc="Soft lo-fi during sessions">
              <Switch checked={focus.ambient} onCheckedChange={() => flip("focus", "ambient")} />
            </Row>
            <Separator className="bg-white/[0.04]" />
            <Row label="Auto fullscreen" desc="Enter fullscreen on session start">
              <Switch
                checked={focus.autoFullscreen}
                onCheckedChange={() => flip("focus", "autoFullscreen")}
              />
            </Row>
          </div>
        </GlassCard>

        {/* ===== Data & Privacy ===== */}
        <GlassCard hover={false}>
          <Section icon={Shield} title="Data & Privacy" color="#10b981" />
          <div className="space-y-4 px-6 pb-6">
            {/* Export */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Export data</div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Download your entire progress — profile, missions, attempts, errors, revision, syllabus & achievements — as a single JSON file.
                  </div>
                  <BackupExportButton />
                </div>
              </div>
            </div>

            {/* Import */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Import data</div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Upload a previously-saved backup file. This replaces all your current data.
                  </div>
                  <BackupImportButton />
                </div>
              </div>
            </div>

            {/* Clear all data */}
            <div className="rounded-2xl border border-rose-400/15 bg-rose-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-rose-200">Clear all data</div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Permanently delete all your progress, attempts, notes, and settings. This cannot be undone.
                  </div>
                  <ClearAllDataButton />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-amber-100/70">
                Tip: Export a backup weekly so you never lose progress. The file is plain JSON — you can open it in any text editor.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* ===== Account ===== */}
        <GlassCard hover={false}>
          <Section icon={Shield} title="Account" color="#22d3ee" />
          <div className="space-y-3 px-6 pb-6">
            <AccountRow />
            <Separator className="bg-white/[0.04]" />
            <Row label="Two-factor auth" desc="Add an extra layer of security">
              <Switch
                checked={twoFactorAuth}
                onCheckedChange={() => toggleBoolean(twoFactorAuth, setTwoFactorAuth)}
              />
            </Row>
          </div>
        </GlassCard>

        {/* ===== About ===== */}
        <GlassCard hover={false} className="lg:col-span-2">
          <Section icon={Info} title="About BankOS" color="#64748b" />
          <div className="px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-white/40">Version</div>
                <div className="mt-1 text-sm font-semibold text-white">v0.2.0</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-white/40">Framework</div>
                <div className="mt-1 text-sm font-semibold text-white">Next.js 16 + TypeScript</div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>Credits</span>
                </div>
                <div className="mt-1 flex flex-col gap-1 text-sm font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    Built with <Heart className="h-3.5 w-3.5 text-rose-400" /> for aspirants
                  </div>
                  <div className="text-xs text-white/40">Made with <span className="text-rose-400">❤️</span> by ASHU</div>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-white/30">
              BankOS is a comprehensive banking exam preparation platform. Covering all sections — Reasoning,
              Quantitative Aptitude, English, General Awareness, Computer Knowledge, and Banking Awareness — with
              AI-powered coaching, spaced repetition, and smart analytics.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, color }: { icon: typeof Bell; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] p-6 pb-4">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl border"
        style={{ borderColor: `${color}44`, background: `${color}1a`, color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-white/40">{desc}</div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function AccountRow() {
  const { data: authData } = useAuth();
  const logout = useLogout();
  const account = authData?.account;
  if (!account) {
    return <div className="py-2 text-sm text-white/40">Not signed in.</div>;
  }
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{account.name}</div>
        <div className="truncate text-xs text-white/40">{account.email}</div>
      </div>
      <button
        onClick={() => {
          logout.mutate();
          toast.success("Signed out");
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20"
      >
        Sign out
      </button>
    </div>
  );
}

function BackupExportButton() {
  const exportBackup = useExportBackup();
  async function handleExport() {
    const loading = toast.loading("Preparing your backup…");
    try {
      const data = await exportBackup.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `bankos-backup-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss(loading);
      toast.success("Backup downloaded — save it somewhere safe.");
    } catch {
      toast.dismiss(loading);
      toast.error("Could not export backup.");
    }
  }
  return (
    <button
      onClick={handleExport}
      disabled={exportBackup.isPending}
      className="btn-press mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500/80 to-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(16,185,129,0.5)] disabled:opacity-60"
    >
      <Download className="h-3.5 w-3.5" /> {exportBackup.isPending ? "Preparing…" : "Download backup"}
    </button>
  );
}

function BackupImportButton() {
  const importBackup = useImportBackup();
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.version !== 1 || !data.profile) {
          toast.error("Invalid backup file.");
          return;
        }
        const loading = toast.loading("Restoring your data…");
        await importBackup.mutateAsync(data);
        toast.dismiss(loading);
        toast.success("Backup restored. Welcome back.");
      } catch {
        toast.error("Could not read that file.");
      }
      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        onChange={onFile}
        className="hidden"
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={importBackup.isPending}
        className="btn-press mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5" /> {importBackup.isPending ? "Restoring…" : "Choose backup file"}
      </button>
    </>
  );
}

function ClearAllDataButton() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="btn-press mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20">
          <Trash2 className="h-3.5 w-3.5" /> Clear all data
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-white/10 bg-[#0b1120]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-white/50">
            This will permanently delete all your progress, study attempts, error notes, revision data,
            syllabus progress, and settings. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              try {
                localStorage.clear();
                toast.success("Local settings cleared. Please sign out and re-onboard to reset all data.");
              } catch {
                toast.error("Could not clear data.");
              }
            }}
            className="border-rose-400/30 bg-rose-600 text-white hover:bg-rose-700"
          >
            Yes, delete everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}