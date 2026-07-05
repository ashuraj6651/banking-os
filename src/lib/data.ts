// ============================================================
// BankOS — static content layer
// Only genuinely-static content lives here. NO fake user data.
// All user progress is computed from real DB attempts at runtime.
// ============================================================

export type AppView =
  | "mission"
  | "challenge"
  | "coach"
  | "practice"
  | "mock"
  | "analytics"
  | "world"
  | "skills"
  | "notebook"
  | "revision"
  | "current"
  | "syllabus"
  | "timer"
  | "profile"
  | "settings";

export const EXAMS = [
  "SBI PO",
  "SBI Clerk",
  "IBPS PO",
  "IBPS Clerk",
  "RBI Grade B",
  "NABARD",
  "LIC AAO",
  "RBI Assistant",
];

// Honest product facts for the landing page (not inflated user metrics)
export const STATS = [
  { value: "12", label: "OS Modules" },
  { value: "5", label: "Exam Subjects" },
  { value: "∞", label: "Adaptive Practice" },
  { value: "1:1", label: "AI Mentor" },
];

// Methodology timeline (generic preparation phases, not user data)
export const TIMELINE = [
  { phase: "Foundation", days: "Day 1–60", desc: "Build core concepts across all sections with adaptive drills." },
  { phase: "Acceleration", days: "Day 61–180", desc: "Topic mastery, timed practice and first full mocks." },
  { phase: "Refinement", days: "Day 181–270", desc: "Weakness elimination, revision engine active, mock frequency peaks." },
  { phase: "Final Lap", days: "Day 271–321", desc: "Full-length mocks, interview prep, peak performance tuning." },
];

// Principles (not fake testimonials)
export const PRINCIPLES = [
  {
    title: "System over hustle",
    desc: "BankOS turns scattered prep into one operating system. Every minute maps to your target.",
  },
  {
    title: "Data over guesswork",
    desc: "Your readiness, rank prediction and revision schedule are computed from your real attempts.",
  },
  {
    title: "Focus over volume",
    desc: "Immersive Focus Mode removes every distraction except the question in front of you.",
  },
];

export const FAQS = [
  {
    q: "Is BankOS a coaching platform?",
    a: "No. BankOS is a study operating system. We don't sell video lectures — we orchestrate your entire preparation: planning, practice, focus, revision, and prediction.",
  },
  {
    q: "Which exams does BankOS support?",
    a: "SBI PO, SBI Clerk, IBPS PO, IBPS Clerk, RBI Grade B, NABARD, LIC AAO and all major banking competitive exams.",
  },
  {
    q: "How does the Readiness Engine work?",
    a: "It analyses your real accuracy, speed, mock history and topic mastery to compute a selection probability, predicted rank and confidence score that updates in real time.",
  },
  {
    q: "Is my progress real?",
    a: "Yes. Every metric — streak, XP, accuracy, mastery, readiness — is computed from your actual study activity. Nothing is pre-filled.",
  },
  {
    q: "Can the AI Coach replace a human mentor?",
    a: "It gives daily briefings, performance reviews and personalised strategy. Most aspirants find it more consistent than a human — but you can always upgrade to Elite for human strategy calls.",
  },
];
