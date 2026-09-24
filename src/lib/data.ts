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
  | "syllabus"
  | "timer"
  | "planner"
  | "profile"
  | "settings";
