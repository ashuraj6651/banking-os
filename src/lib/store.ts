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

export const useBankOS = create<BankOSState>((set) => ({
  stage: "landing",
  activeView: "mission",
  focusMode: false,
  focusMission: null,
  commandOpen: false,

  setStage: (s) => set({ stage: s }),
  enterApp: () => set({ stage: "app", activeView: "mission" }),
  startAuth: () => set({ stage: "auth" }),
  startOnboarding: () => set({ stage: "onboarding" }),
  exitToLanding: () => set({ stage: "landing", focusMode: false }),
  setView: (v) => set({ activeView: v, focusMode: false }),
  startSession: (mission) => set({ focusMode: true, focusMission: mission ?? null }),
  endSession: () => set({ focusMode: false, focusMission: null }),
  setCommandOpen: (v) => set({ commandOpen: v }),
}));
