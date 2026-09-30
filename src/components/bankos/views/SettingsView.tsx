"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Settings,
  Bell,
  Sparkles,
  Download,
  Shield,
  Palette,
  Focus,
  Upload,
  AlertTriangle,
  GraduationCap,
  Trash2,
  Info,
  Heart,
  User,
  Coins,
  LockKeyhole,
  Check,
  Loader2,
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
import {
  useExportBackup,
  useImportBackup,
  useAuth,
  useLogout,
  useProfile,
  useUpdateProfile,
  useAvatarStore,
  useUnlockAvatar,
  useSelectAvatar,
} from "@/lib/hooks";
import { AVATAR_CATALOG } from "@/lib/avatars";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useBankOS } from "@/lib/store";

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
    (valueOrUpdater: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const next =
          typeof valueOrUpdater === "function"
            ? (valueOrUpdater as (previous: T) => T)(previous)
            : valueOrUpdater;

        try {
          localStorage.setItem(
            `bankos_setting_${key}`,
            JSON.stringify(next),
          );
          window.dispatchEvent(new Event("bankos:settings-change"));
        } catch {
          // Storage may be full or unavailable.
        }

        return next;
      });
    },
    [key],
  );

  return [value, set] as const;
}

export function SettingsView() {
  const [notif, setNotif] = useSetting("notif", {
    dailyReminder: false,
    dailyReminderTime: "20:00",
  });

  const [focus, setFocus] = useSetting("focus", {
    autoFullscreen: false,
  });

  const [reduceMotion, setReduceMotion] = useSetting("reduceMotion", false);
  const [theme, setTheme] = useSetting("theme", "Dark");
  const [accentColor, setAccentColor] = useSetting(
    "accentColor",
    "#8b5cf6",
  );
  const [dailyGoal, setDailyGoal] = useSetting("dailyGoal", 50);
  const [defaultDifficulty, setDefaultDifficulty] = useSetting(
    "defaultDifficulty",
    "mixed",
  );
  const [focusTimer, setFocusTimer] = useSetting("focusTimer", "25");

  const profileQuery = useProfile();
  const updateProfile = useUpdateProfile();
  const avatarStore = useAvatarStore();
  const unlockAvatar = useUnlockAvatar();
  const selectAvatar = useSelectAvatar();

  const [profileName, setProfileName] = useState("");
  const [profileGoal, setProfileGoal] = useState("");

  useEffect(() => {
    const profile = profileQuery.data?.profile;
    if (!profile) return;

    setProfileName(profile.name ?? "");
    setProfileGoal(profile.roadmap ?? "");
  }, [profileQuery.data?.profile]);

  useEffect(() => {
    if (!notif.dailyReminderTime) {
      setNotif((previous) => ({ ...previous, dailyReminderTime: "20:00" }));
    }
  }, [notif.dailyReminderTime, setNotif]);

  useEffect(() => {
    if (
      notif.dailyReminder &&
      (typeof Notification === "undefined" || Notification.permission !== "granted")
    ) {
      setNotif((previous) => ({ ...previous, dailyReminder: false }));
    }
  }, [notif.dailyReminder, setNotif]);

  async function saveProfileSettings() {
    try {
      await updateProfile.mutateAsync({
        name: profileName,
        goal: profileGoal,
        roadmap: profileGoal,
      });

      toast.success("Profile updated");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save profile.";
      toast.error(message || "Could not save profile.");
    }
  }

  async function handleUnlockAvatar(avatarId: (typeof AVATAR_CATALOG)[number]["id"]) {
    try {
      const result = await unlockAvatar.mutateAsync(avatarId);
      toast.success(result.alreadyOwned ? "Avatar already unlocked" : `${result.avatar.name} unlocked`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not unlock avatar");
    }
  }

  async function handleSelectAvatar(avatarId: (typeof AVATAR_CATALOG)[number]["id"]) {
    try {
      await selectAvatar.mutateAsync(avatarId);
      toast.success("Avatar selected");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not select avatar");
    }
  }

  function flipFocus(key: "autoFullscreen") {
    setFocus((previous) => ({ ...previous, [key]: !previous[key] }));
    toast.success("Settings updated");
  }

  function toggleBoolean(value: boolean, setter: (value: boolean) => void) {
    setter(!value);
    toast.success("Settings updated");
  }

  async function toggleDailyReminder(enabled: boolean) {
    if (enabled) {
      if (typeof Notification === "undefined") {
        toast.error("This browser does not support desktop notifications.");
        return;
      }
      let permission: NotificationPermission;
      try {
        permission = Notification.permission === "default"
          ? await Notification.requestPermission()
          : Notification.permission;
      } catch {
        toast.error("Could not request notification permission in this browser.");
        return;
      }
      if (permission !== "granted") {
        toast.error("Allow notifications for this site, then enable the reminder.");
        return;
      }
    }
    setNotif((previous) => ({
      ...previous,
      dailyReminder: enabled,
      dailyReminderTime: previous.dailyReminderTime ?? "20:00",
    }));
    toast.success(enabled ? "Daily reminder enabled" : "Daily reminder disabled");
  }

  function setFocusTimerPreference(value: string) {
    setFocusTimer(value);
    try {
      const key = "bankos-pomodoro-durations";
      const saved = JSON.parse(localStorage.getItem(key) ?? "{}") as Record<string, unknown>;
      localStorage.setItem(key, JSON.stringify({ ...saved, focus: Number(value) }));
    } catch {
      localStorage.setItem("bankos-pomodoro-durations", JSON.stringify({ focus: Number(value) }));
    }
    toast.success("Default focus timer updated");
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <ViewHeader
        badge="Preferences"
        badgeIcon={<Settings className="h-3 w-3" />}
        title="Settings"
        subtitle="Tune BankOS to match how you study best."
      />

      <GlassCard hover={false} className="overflow-hidden">
        <Section icon={User} title="Profile" color="#22d3ee" />

        <div className="space-y-6 px-5 pb-6 pt-5 sm:px-6">
          <div className="space-y-2">
            <label
              htmlFor="profile-name"
              className="text-sm font-medium text-white"
            >
              Name
            </label>
            <Input
              id="profile-name"
              value={profileName}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Your display name"
            />
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">Avatar Store</div>
                <div className="text-xs text-white/40">Unlock with coins, then select any avatar you own.</div>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-sm font-semibold text-violet-200">
                <Coins className="h-4 w-4" />
                {(avatarStore.data?.coins ?? profileQuery.data?.profile?.coins ?? 0).toLocaleString()} coins
              </div>
            </div>

            {avatarStore.isLoading ? (
              <div className="flex items-center gap-2 py-5 text-sm text-white/45"><Loader2 className="h-4 w-4 animate-spin" />Loading avatars…</div>
            ) : avatarStore.isError ? (
              <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 p-4 text-sm text-rose-200">Could not load avatars. Refresh this page to retry.</div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {(avatarStore.data?.avatars ?? []).map((avatar) => {
                  const affordable = (avatarStore.data?.coins ?? 0) >= avatar.price;
                  const busy = unlockAvatar.isPending || selectAvatar.isPending;
                  return (
                    <div key={avatar.id} className={cn(
                      "flex min-w-0 flex-col items-center rounded-xl border p-3 text-center transition",
                      avatar.selected ? "border-violet-300/70 bg-violet-500/[0.09]" : "border-white/[0.08] bg-white/[0.02]",
                    )}>
                      <div className={cn("relative grid h-16 w-16 place-items-center overflow-hidden rounded-full border-2 bg-[#151827]", avatar.selected ? "border-violet-300" : "border-white/15", !avatar.unlocked && "grayscale opacity-55")}>
                        <span className="text-lg font-semibold text-white/75">{avatar.name.slice(0, 1)}</span>
                        <img
                          src={avatar.url}
                          alt={`${avatar.name} avatar`}
                          loading="lazy"
                          onError={(event) => { event.currentTarget.style.display = "none"; }}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        {!avatar.unlocked && <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border border-white/15 bg-[#10131f] text-white/70"><LockKeyhole className="h-3 w-3" /></span>}
                      </div>
                      <div className="mt-2 truncate text-xs font-medium text-white/85">{avatar.name}</div>
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-white/45"><Coins className="h-3 w-3 text-amber-300" />{avatar.price === 0 ? "Free" : avatar.price.toLocaleString()}</div>
                      <div className={cn("mt-1 text-[10px] font-medium", avatar.selected ? "text-emerald-300" : avatar.unlocked ? "text-violet-200/70" : "text-white/35")}>
                        {avatar.selected ? "Selected" : avatar.unlocked ? "Unlocked" : "Locked"}
                      </div>
                      {avatar.selected ? (
                        <div className="mt-1 inline-flex h-8 items-center gap-1 text-xs font-medium text-emerald-300"><Check className="h-3.5 w-3.5" />Active</div>
                      ) : avatar.unlocked ? (
                        <button type="button" disabled={busy} onClick={() => handleSelectAvatar(avatar.id)} className="mt-3 h-8 w-full rounded-lg border border-violet-400/30 bg-violet-500/10 text-xs font-medium text-violet-200 hover:bg-violet-500/20 disabled:opacity-50">Select</button>
                      ) : (
                        <button type="button" disabled={busy || !affordable} onClick={() => handleUnlockAvatar(avatar.id)} className="mt-3 h-8 w-full rounded-lg border border-white/10 bg-white/[0.04] text-xs font-medium text-white/75 hover:border-violet-300/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-45">{affordable ? "Unlock" : "Not enough coins"}</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-medium text-white">Goal summary</div>
              <div className="text-xs text-white/40">
                Pick one of the preset goals to keep your profile concise.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRESET_GOALS.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setProfileGoal(goal)}
                  className={cn(
                    "rounded-xl border px-3 py-2.5 text-left text-sm transition",
                    profileGoal === goal
                      ? "border-violet-300 bg-violet-500/10 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-violet-400/40 hover:bg-white/10",
                  )}
                >
                  {goal}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setProfileGoal("")}
              className="text-xs text-white/50 transition hover:text-white"
            >
              Clear selection
            </button>
          </div>

          <div className="flex justify-end border-t border-white/[0.06] pt-4">
            <button
              onClick={saveProfileSettings}
              disabled={updateProfile.isPending}
              className="btn-press inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-sky-500/80 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-shadow hover:shadow-[0_6px_26px_-12px_rgba(59,130,246,0.6)] disabled:opacity-60"
            >
              {updateProfile.isPending ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard hover={false}>
          <Section
            icon={GraduationCap}
            title="Study Preferences"
            color="#8b5cf6"
          />

          <div className="space-y-4 px-6 pb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    Daily question goal
                  </div>
                  <div className="text-xs text-white/40">
                    Questions to answer each day
                  </div>
                </div>

                <span className="rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-sm font-bold text-violet-200">
                  {dailyGoal}
                </span>
              </div>

              <Slider
                value={[dailyGoal]}
                onValueChange={(value) => setDailyGoal(value[0])}
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

            <Row
              label="Default difficulty"
              desc="Pre-select when starting practice"
            >
              <Select
                value={defaultDifficulty}
                onValueChange={(value) => {
                  setDefaultDifficulty(value);
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
                  <SelectItem
                    value="easy"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    Easy
                  </SelectItem>
                  <SelectItem
                    value="medium"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    Medium
                  </SelectItem>
                  <SelectItem
                    value="hard"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    Hard
                  </SelectItem>
                  <SelectItem
                    value="mixed"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    Mixed
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>

            <Row
              label="Focus session timer"
              desc="Default duration for Study Timer"
            >
              <Select
                value={focusTimer}
                onValueChange={(value) => {
                  setFocusTimerPreference(value);
                }}
              >
                <SelectTrigger
                  size="sm"
                  className="w-[110px] border-white/10 bg-white/[0.03] text-white/80 focus:ring-violet-500/30"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#0b1120]">
                  <SelectItem
                    value="15"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    15 min
                  </SelectItem>
                  <SelectItem
                    value="25"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    25 min
                  </SelectItem>
                  <SelectItem
                    value="30"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    30 min
                  </SelectItem>
                  <SelectItem
                    value="45"
                    className="text-white/80 focus:bg-violet-500/10 focus:text-white"
                  >
                    45 min
                  </SelectItem>
                </SelectContent>
              </Select>
            </Row>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <Section icon={Bell} title="Notifications" color="#22d3ee" />

          <div className="space-y-3 px-6 pb-6">
            <Row
              label="Daily reminder"
              desc="Desktop notification while BankOS is open"
            >
              <Switch
                checked={notif.dailyReminder}
                onCheckedChange={toggleDailyReminder}
              />
            </Row>

            {notif.dailyReminder && (
              <Row label="Reminder time" desc="Uses your device’s local time">
                <Input
                  aria-label="Daily reminder time"
                  type="time"
                  value={notif.dailyReminderTime ?? "20:00"}
                  onChange={(event) => setNotif((previous) => ({ ...previous, dailyReminderTime: event.target.value }))}
                  className="w-32"
                />
              </Row>
            )}
            <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-relaxed text-white/45">
              Reminders are checked while this BankOS tab is open. A closed browser cannot run scheduled reminders without a push-notification service.
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <Section icon={Palette} title="Appearance" color="#8b5cf6" />

          <div className="space-y-3 px-6 pb-6">
            <Row
              label="Theme"
              desc="Dark theme is optimised for long sessions"
            >
              <div className="flex gap-2">
                {["Dark", "Midnight", "Aurora"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setTheme(item);
                      toast.success("Settings updated");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      item === theme
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                        : "border-white/10 bg-white/[0.03] text-white/50",
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </Row>

            <Separator className="bg-white/[0.04]" />

            <Row
              label="Accent colour"
              desc="Personalise your highlight spectrum"
            >
              <div className="flex gap-2">
                {["#8b5cf6", "#3b82f6", "#22d3ee", "#ec4899"].map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Select accent colour ${color}`}
                    onClick={() => {
                      setAccentColor(color);
                      toast.success("Settings updated");
                    }}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all",
                      color === accentColor
                        ? "scale-110 border-white"
                        : "border-transparent",
                    )}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </Row>

            <Separator className="bg-white/[0.04]" />

            <Row
              label="Reduce motion"
              desc="Minimise animations across the OS"
            >
              <Switch
                checked={reduceMotion}
                onCheckedChange={() =>
                  toggleBoolean(reduceMotion, setReduceMotion)
                }
              />
            </Row>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <Section icon={Sparkles} title="AI Settings" color="#ec4899" />

          <div className="px-6 pb-6">
            <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-sm leading-relaxed text-white/55">
              AI runs only when you open AI Coach and send a message. BankOS does not run background briefings or automatically change your study plan, so it won’t use AI tokens in the background.
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <Section icon={Focus} title="Focus Mode" color="#f59e0b" />

          <div className="space-y-3 px-6 pb-6">
            <Row
              label="Auto fullscreen"
              desc="Request browser fullscreen when a focus session starts"
            >
              <Switch
                checked={focus.autoFullscreen}
                onCheckedChange={() => flipFocus("autoFullscreen")}
              />
            </Row>
            <p className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-relaxed text-white/45">
              Focus sessions already open in a distraction-free question view. Websites and other browser tabs cannot be blocked by a normal web page.
            </p>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <Section icon={Shield} title="Data & Privacy" color="#10b981" />

          <div className="space-y-4 px-6 pb-6">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    Export data
                  </div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Download supported learning progress — missions, attempts, sessions, mock tests, notes, revision, syllabus, achievements, and planner data — as JSON. Wallet ownership stays on the account.
                  </div>
                  <BackupExportButton />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">
                    Import data
                  </div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Restore learning progress from a BankOS backup. Your login, coins, avatar unlocks, and AI Coach chat are preserved.
                  </div>
                  <BackupImportButton />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-400/15 bg-rose-500/[0.04] p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-rose-200">
                    Clear learning data
                  </div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Permanently remove saved study activity, AI Coach history, coins, avatar unlocks, and local BankOS preferences. Your login and exam profile stay.
                  </div>
                  <ClearLearningDataButton />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-amber-100/70">
                Tip: Export a backup weekly so you never lose progress. The
                file is plain JSON — you can open it in any text editor.
              </p>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false}>
          <Section icon={Shield} title="Account" color="#22d3ee" />

          <div className="space-y-3 px-6 pb-6">
            <AccountRow />

            <Separator className="bg-white/[0.04]" />

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-sm font-medium text-white">Sign-in security</div>
              <div className="mt-1 text-xs leading-relaxed text-white/45">
                BankOS currently uses your password and a secure session cookie. Two-factor authentication is not available, so there is no switch claiming to enable it.
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard hover={false} className="lg:col-span-2">
          <Section icon={Info} title="About BankOS" color="#64748b" />

          <div className="px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-white/40">Version</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  v0.2.0
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-white/40">Framework</div>
                <div className="mt-1 text-sm font-semibold text-white">
                  Next.js 16 + TypeScript
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="text-xs text-white/40">Credits</div>
                <div className="mt-1 flex flex-col gap-1 text-sm font-semibold text-white">
                  <div className="flex items-center gap-1.5">
                    Built with
                    <Heart className="h-3.5 w-3.5 text-rose-400" />
                    for aspirants
                  </div>
                  <div className="text-xs text-white/40">
                    Made with <span className="text-rose-400">❤️</span> by ASHU
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-white/30">
              BankOS is a comprehensive banking exam preparation platform.
              Covering all sections — Reasoning, Quantitative Aptitude, English,
              General Awareness, Computer Knowledge, and Banking Awareness —
              with AI-powered coaching, spaced repetition, and smart analytics.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  color,
}: {
  icon: typeof Bell;
  title: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] p-6 pb-4">
      <div
        className="grid h-9 w-9 place-items-center rounded-xl border"
        style={{
          borderColor: `${color}44`,
          background: `${color}1a`,
          color,
        }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
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
  const exitToLanding = useBankOS((state) => state.exitToLanding);
  const account = authData?.account;

  if (!account) {
    return <div className="py-2 text-sm text-white/40">Not signed in.</div>;
  }

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">
          {account.name}
        </div>
        <div className="truncate text-xs text-white/40">{account.email}</div>
      </div>

      <button
        disabled={logout.isPending}
        onClick={async () => {
          try {
            await logout.mutateAsync();
            exitToLanding();
            toast.success("Signed out");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not sign out.");
          }
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-50"
      >
        {logout.isPending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}

function BackupExportButton() {
  const exportBackup = useExportBackup();

  async function handleExport() {
    const loadingToast = toast.loading("Preparing your backup…");

    try {
      const data = await exportBackup.mutateAsync();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `bankos-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);

      toast.dismiss(loadingToast);
      toast.success("Backup downloaded — save it somewhere safe.");
    } catch {
      toast.dismiss(loadingToast);
      toast.error("Could not export backup.");
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exportBackup.isPending}
      className="btn-press mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500/80 to-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(16,185,129,0.5)] disabled:opacity-60"
    >
      <Download className="h-3.5 w-3.5" />
      {exportBackup.isPending ? "Preparing…" : "Download backup"}
    </button>
  );
}

function BackupImportButton() {
  const importBackup = useImportBackup();
  const fileRef = useRef<HTMLInputElement>(null);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string);

        if (data.version !== 1 || !data.profile) {
          toast.error("Invalid backup file.");
          return;
        }

        if (!window.confirm("Restoring this backup replaces your current learning progress. Continue?")) return;

        const loadingToast = toast.loading("Restoring your data…");
        await importBackup.mutateAsync(data);
        toast.dismiss(loadingToast);
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
        <Upload className="h-3.5 w-3.5" />
        {importBackup.isPending ? "Restoring…" : "Choose backup file"}
      </button>
    </>
  );
}

function ClearLearningDataButton() {
  const [busy, setBusy] = useState(false);

  async function clearData() {
    setBusy(true);
    try {
      const response = await fetch("/api/profile/reset-data", {
        method: "POST",
        credentials: "include",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not clear data.");

      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("bankos_") || key.startsWith("bankos-")) localStorage.removeItem(key);
      }
      toast.success("Learning data cleared. Reloading BankOS…");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not clear data.");
      setBusy(false);
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="btn-press mt-3 inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-500/20">
          <Trash2 className="h-3.5 w-3.5" />
          Clear learning data
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="border-white/10 bg-[#0b1120]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Are you absolutely sure?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/50">
            This permanently deletes your study history, attempts, notes, missions, AI Coach chat, coins, avatar unlocks, and local BankOS preferences. Your login, profile name, and exam goal stay. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white">
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              if (!busy) void clearData();
            }}
            className="border-rose-400/30 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
            disabled={busy}
          >
            {busy ? "Clearing…" : "Yes, clear learning data"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
