"use client";

import { useState, useRef } from "react";
import { Settings, Bell, Moon, Sparkles, Download, Shield, Palette, Focus, Upload, Cloud, AlertTriangle } from "lucide-react";
import { ViewHeader } from "../ViewHeader";
import { GlassCard } from "../GlassCard";
import { Switch } from "@/components/ui/switch";
import { useExportBackup, useImportBackup, useAuth, useLogout } from "@/lib/hooks";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SettingsView() {
  const [notif, setNotif] = useState({ briefing: true, streak: true, revision: true, weekly: false });
  const [ai, setAi] = useState({ proactive: true, voiceBriefing: false, autoPlan: true });
  const [focus, setFocus] = useState({ blockSites: true, ambient: true, autoFullscreen: false });

  function flip(group: "notif" | "ai" | "focus", key: string) {
    if (group === "notif") setNotif((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
    if (group === "ai") setAi((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
    if (group === "focus") setFocus((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <GlassCard hover={false}>
          <Section icon={Palette} title="Appearance" color="#8b5cf6" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Theme" desc="Dark theme is optimised for long sessions">
              <div className="flex gap-2">
                {["Dark", "Midnight", "Aurora"].map((t, i) => (
                  <button
                    key={t}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      i === 0
                        ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                        : "border-white/10 bg-white/[0.03] text-white/50"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Accent colour" desc="Personalise your highlight spectrum">
              <div className="flex gap-2">
                {["#8b5cf6", "#3b82f6", "#22d3ee", "#ec4899"].map((c, i) => (
                  <span
                    key={c}
                    className={cn("h-6 w-6 rounded-full border-2", i === 0 ? "border-white" : "border-transparent")}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Row>
            <Row label="Reduce motion" desc="Minimise animations across the OS">
              <Switch />
            </Row>
          </div>
        </GlassCard>

        {/* Notifications */}
        <GlassCard hover={false}>
          <Section icon={Bell} title="Notifications" color="#22d3ee" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Morning briefing" desc="Daily AI briefing at 8 AM">
              <Switch checked={notif.briefing} onCheckedChange={() => flip("notif", "briefing")} />
            </Row>
            <Row label="Streak reminders" desc="Don't break the chain">
              <Switch checked={notif.streak} onCheckedChange={() => flip("notif", "streak")} />
            </Row>
            <Row label="Revision due" desc="Get reminded when concepts expire">
              <Switch checked={notif.revision} onCheckedChange={() => flip("notif", "revision")} />
            </Row>
            <Row label="Weekly digest" desc="Sunday performance recap">
              <Switch checked={notif.weekly} onCheckedChange={() => flip("notif", "weekly")} />
            </Row>
          </div>
        </GlassCard>

        {/* AI */}
        <GlassCard hover={false}>
          <Section icon={Sparkles} title="AI Settings" color="#ec4899" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Proactive mentor" desc="Coach initiates briefings automatically">
              <Switch checked={ai.proactive} onCheckedChange={() => flip("ai", "proactive")} />
            </Row>
            <Row label="Voice briefings" desc="Listen to your morning briefing">
              <Switch checked={ai.voiceBriefing} onCheckedChange={() => flip("ai", "voiceBriefing")} />
            </Row>
            <Row label="Auto study planner" desc="Roadmap adapts daily">
              <Switch checked={ai.autoPlan} onCheckedChange={() => flip("ai", "autoPlan")} />
            </Row>
          </div>
        </GlassCard>

        {/* Focus mode */}
        <GlassCard hover={false}>
          <Section icon={Focus} title="Focus Mode" color="#f59e0b" />
          <div className="space-y-3 px-6 pb-6">
            <Row label="Block distractions" desc="Hide everything except the question">
              <Switch checked={focus.blockSites} onCheckedChange={() => flip("focus", "blockSites")} />
            </Row>
            <Row label="Ambient sound" desc="Soft lo-fi during sessions">
              <Switch checked={focus.ambient} onCheckedChange={() => flip("focus", "ambient")} />
            </Row>
            <Row label="Auto fullscreen" desc="Enter fullscreen on session start">
              <Switch checked={focus.autoFullscreen} onCheckedChange={() => flip("focus", "autoFullscreen")} />
            </Row>
          </div>
        </GlassCard>

        {/* Account */}
        <GlassCard hover={false}>
          <Section icon={Shield} title="Account" color="#22d3ee" />
          <div className="space-y-3 px-6 pb-6">
            <AccountRow />
            <Row label="Two-factor auth" desc="Add an extra layer of security">
              <Switch />
            </Row>
          </div>
        </GlassCard>

        {/* Backup & Sync */}
        <GlassCard hover={false}>
          <Section icon={Cloud} title="Backup & Sync" color="#10b981" />
          <div className="space-y-4 px-6 pb-6">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Download className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Download backup</div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Export your entire progress — profile, missions, attempts, errors, revision, syllabus & achievements — as a single JSON file. Save it to any cloud drive (Google Drive, iCloud, Dropbox) for safekeeping.
                  </div>
                  <BackupExportButton />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Upload className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">Restore from backup</div>
                  <div className="mt-0.5 text-xs text-white/40">
                    Upload a previously-saved backup file. This replaces all your current data with the backup contents.
                  </div>
                  <BackupImportButton />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-amber-400/20 bg-amber-500/[0.06] p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-amber-100/70">
                Tip: Download a backup weekly so you never lose progress. The file is plain JSON — you can open it in any text editor to verify your data.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, color }: { icon: typeof Bell; title: string; color: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.06] p-6 pb-4">
      <div className="grid h-9 w-9 place-items-center rounded-xl border" style={{ borderColor: `${color}44`, background: `${color}1a`, color }}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
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
      className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500/80 to-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(16,185,129,0.5)] disabled:opacity-60"
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
        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/20 disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5" /> {importBackup.isPending ? "Restoring…" : "Choose backup file"}
      </button>
    </>
  );
}
