"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type NotificationSettings = {
  dailyReminder?: boolean;
  dailyReminderTime?: string;
};

function readSetting<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`bankos_setting_${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function applyAppearance() {
  const root = document.documentElement;
  const theme = readSetting("theme", "Dark");
  const accent = readSetting("accentColor", "#8b5cf6");
  const reduceMotion = readSetting("reduceMotion", false);

  root.dataset.bankosTheme = theme;
  root.dataset.bankosAccent = "true";
  root.style.setProperty("--bankos-accent", accent);
  root.dataset.bankosReduceMotion = reduceMotion ? "true" : "false";
}

function checkDailyReminder() {
  if (document.visibilityState !== "visible") return;

  const settings = readSetting<NotificationSettings>("notif", {});
  if (!settings.dailyReminder || !settings.dailyReminderTime) return;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (currentTime < settings.dailyReminderTime) return;

  const dayKey = `bankos_daily_reminder_sent_${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  if (localStorage.getItem(dayKey)) return;

  new Notification("Your BankOS study reminder", {
    body: "Your daily question goal is waiting. Open BankOS to continue your preparation.",
    icon: "/BOlogo.png",
    tag: dayKey,
    renotify: false,
  });
  localStorage.setItem(dayKey, "1");
}

export function SettingsRuntime() {
  useEffect(() => {
    const apply = () => applyAppearance();
    const check = () => checkDailyReminder();
    const fullscreenUnavailable = () => {
      toast.error("Fullscreen is unavailable in this browser. You can still use Focus Mode.");
    };

    apply();
    check();

    const interval = window.setInterval(check, 30_000);
    window.addEventListener("bankos:settings-change", apply);
    window.addEventListener("bankos:fullscreen-unavailable", fullscreenUnavailable);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("bankos:settings-change", apply);
      window.removeEventListener("bankos:fullscreen-unavailable", fullscreenUnavailable);
    };
  }, []);

  return null;
}
