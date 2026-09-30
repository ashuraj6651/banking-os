"use client";

import { create } from "zustand";
import type { Mission } from "./hooks";

type Stage = "landing" | "auth" | "onboarding" | "app";

type BankOSState = {
  stage: Stage;
  activeView: string;
  focusMode: boolean;
  focusMission: Mission | null;
  commandOpen: boolean;

  setStage: (s: Stage) => void;
  enterApp: () => void;
  startAuth: () => void;
  startOnboarding: () => void;
  exitToLanding: () => void;
  setView: (v: string) => void;
  startSession: (mission?: Mission) => void;
  endSession: () => void;
  setCommandOpen: (v: boolean) => void;
};

let bankOSOwnsFullscreen = false;
let bankOSFullscreenPending = false;

function enterConfiguredFullscreen() {
  if (typeof document === "undefined" || document.fullscreenElement) return;

  try {
    const focusSettings = JSON.parse(
      localStorage.getItem("bankos_setting_focus") ?? "{}",
    ) as { autoFullscreen?: boolean };
    if (!focusSettings.autoFullscreen) return;

    if (!document.documentElement.requestFullscreen) {
      window.dispatchEvent(new Event("bankos:fullscreen-unavailable"));
      return;
    }
    const request = document.documentElement.requestFullscreen();
    if (request) {
      bankOSFullscreenPending = true;
      void request
        .then(() => {
          bankOSFullscreenPending = false;
          bankOSOwnsFullscreen = true;
          // If the user exited focus before the browser finished entering,
          // don't leave the application stranded in fullscreen afterward.
          if (!useBankOS.getState().focusMode) leaveConfiguredFullscreen();
        })
        .catch(() => {
          bankOSFullscreenPending = false;
          bankOSOwnsFullscreen = false;
          window.dispatchEvent(new Event("bankos:fullscreen-unavailable"));
        });
    }
  } catch {
    // The browser may not support fullscreen or local storage may be disabled.
  }
}

function leaveConfiguredFullscreen() {
  if ((!bankOSOwnsFullscreen && !bankOSFullscreenPending) || typeof document === "undefined") return;
  bankOSOwnsFullscreen = false;
  if (document.fullscreenElement && document.exitFullscreen) {
    void document.exitFullscreen().catch(() => {});
  }
}

export const useBankOS = create<BankOSState>((set, get) => ({
  stage: "landing",
  activeView: "mission",
  focusMode: false,
  focusMission: null,
  commandOpen: false,

  setStage: (s) => set({ stage: s }),
  enterApp: () => set({ stage: "app", activeView: "mission" }),
  startAuth: () => set({ stage: "auth" }),
  startOnboarding: () => set({ stage: "onboarding" }),
  exitToLanding: () => {
    leaveConfiguredFullscreen();
    set({ stage: "landing", focusMode: false, focusMission: null });
  },
  setView: (v) => {
    if (get().focusMode) leaveConfiguredFullscreen();
    set({ activeView: v, focusMode: false, focusMission: null });
  },
  startSession: (mission) => {
    // requestFullscreen must be called synchronously from the user's click.
    enterConfiguredFullscreen();
    set({ focusMode: true, focusMission: mission ?? null });
  },
  endSession: () => {
    leaveConfiguredFullscreen();
    set({ focusMode: false, focusMission: null });
  },
  setCommandOpen: (v) => set({ commandOpen: v }),
}));
