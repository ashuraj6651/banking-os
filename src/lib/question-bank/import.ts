// Parse + validate a monthly question upload (JSON or CSV) into BankQuestion rows.
import { BankQuestion, SUBJECTS } from "./core";

export type ImportError = { row: number; message: string };
export type ParseResult = { questions: BankQuestion[]; errors: ImportError[]; total: number };

export const MAX_ROWS = 3000;

const SUBJECT_ALIASES: Record<string, string> = {
  reasoning: "Reasoning", "reasoning ability": "Reasoning", logical: "Reasoning", lr: "Reasoning",
  english: "English", "english language": "English", eng: "English",
  quant: "Quant", quantitative: "Quant", "quantitative aptitude": "Quant", maths: "Quant", math: "Quant", qa: "Quant",
  banking: "Banking", "banking awareness": "Banking", "banking & financial awareness": "Banking", "financial awareness": "Banking",
  "current affairs": "Current Affairs", ca: "Current Affairs", "general awareness": "Current Affairs", ga: "Current Affairs",
};

function normSubject(v: unknown): string | null {
  const k = String(v ?? "").trim().toLowerCase();
  if (!k) return null;
  const direct = SUBJECTS.find((s) => s.toLowerCase() === k);
  return direct ?? SUBJECT_ALIASES[k] ?? null;
}

function normDifficulty(v: unknown): string {
  const k = String(v ?? "").trim().toLowerCase();
  if (k.startsWith("e")) return "Easy";
  if (k.startsWith("h")) return "Hard";
  return "Medium";
}

/** "A"/"B"/"C"/"D" or 1-4 → 0-based index; null if invalid. */
function normAnswer(v: unknown): number | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(s)) return "ABCD".indexOf(s);
  if (["1", "2", "3", "4"].includes(s)) return Number(s) - 1;
  return null;
}

type Raw = Record<string, unknown>;

const get = (o: Raw, ...keys: string[]) => {
  for (const k of keys) {
    for (const ok of Object.keys(o)) {
      if (ok.trim().toLowerCase().replace(/[\s_-]/g, "") === k) return o[ok];
    }
  }
  return undefined;
};

function toQuestion(o: Raw, row: number): { q?: BankQuestion; err?: ImportError } {
  const fail = (message: string) => ({ err: { row, message } });
  const text = String(get(o, "text", "question", "q") ?? "").trim();
  if (text.length < 8) return fail("Question text is missing or too short");

  const subject = normSubject(get(o, "subject", "section"));
  if (!subject) return fail(`Subject must be one of: ${SUBJECTS.join(", ")}`);

  let options: string[] = [];
  const rawOpts = get(o, "options", "choices");
  if (Array.isArray(rawOpts)) options = rawOpts.map((x) => String(x ?? "").trim());
  else {
    options = ["optiona", "optionb", "optionc", "optiond"].map((k, i) =>
      String(get(o, k, "abcd"[i], `option${i + 1}`, `opt${i + 1}`, `opt${"abcd"[i]}`) ?? "").trim()
    );
  }
  if (options.length !== 4 || options.some((x) => !x)) return fail("Exactly 4 non-empty options are required");
  if (new Set(options.map((x) => x.toLowerCase())).size !== 4) return fail("Options must be different from each other");

  const answer = normAnswer(get(o, "answer", "correct", "correctanswer", "ans"));
  if (answer === null) return fail("Answer must be A, B, C or D (or 1–4)");

  const topic = String(get(o, "topic", "chapter") ?? "").trim() || "General";
  const explanation = String(get(o, "explanation", "solution", "explain") ?? "").trim() || "No explanation provided.";

  return {
    q: {
      subject,
      topic: topic.slice(0, 80),
      difficulty: normDifficulty(get(o, "difficulty", "level")),
      text: text.slice(0, 2000),
      options: options.map((x) => x.slice(0, 500)),
      answer,
      explanation: explanation.slice(0, 2000),
    },
  };
}

/** Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, newlines inside quotes). */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQ = false;
  const s = input.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

export function parseQuestionUpload(content: string, format?: "json" | "csv"): ParseResult {
  const trimmed = content.trim();
  const fmt = format ?? (trimmed.startsWith("[") || trimmed.startsWith("{") ? "json" : "csv");
  let raws: Raw[] = [];

  if (fmt === "json") {
    let data: unknown;
    try {
      data = JSON.parse(trimmed);
    } catch (e) {
      return { questions: [], total: 0, errors: [{ row: 0, message: `Invalid JSON: ${(e as Error).message}` }] };
    }
    const arr = Array.isArray(data) ? data : (data as { questions?: unknown })?.questions;
    if (!Array.isArray(arr)) {
      return { questions: [], total: 0, errors: [{ row: 0, message: "JSON must be an array of questions (or { \"questions\": [...] })" }] };
    }
    raws = arr as Raw[];
  } else {
    const rows = parseCsv(trimmed);
    if (rows.length < 2) {
      return { questions: [], total: 0, errors: [{ row: 0, message: "CSV needs a header row and at least one question row" }] };
    }
    const header = rows[0].map((h) => h.trim());
    raws = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
  }

  if (raws.length > MAX_ROWS) {
    return { questions: [], total: raws.length, errors: [{ row: 0, message: `Too many questions in one upload (max ${MAX_ROWS})` }] };
  }

  const questions: BankQuestion[] = [];
  const errors: ImportError[] = [];
  raws.forEach((raw, i) => {
    if (!raw || typeof raw !== "object") {
      errors.push({ row: i + 1, message: "Not a valid question object" });
      return;
    }
    const { q, err } = toQuestion(raw, i + 1);
    if (q) questions.push(q);
    else if (err) errors.push(err);
  });
  return { questions, errors, total: raws.length };
}

export const CSV_TEMPLATE =
  'subject,topic,difficulty,question,option_a,option_b,option_c,option_d,answer,explanation\n' +
  'Quant,Percentage,Easy,"What is 20% of 250?",40,50,60,25,B,"20/100 × 250 = 50"\n' +
  'Banking,RBI,Medium,"The RBI was established in the year:",1935,1949,1947,1955,A,"RBI began operations on 1 April 1935."\n';

export const JSON_TEMPLATE = JSON.stringify(
  [
    {
      subject: "Quant",
      topic: "Percentage",
      difficulty: "Easy",
      question: "What is 20% of 250?",
      options: ["40", "50", "60", "25"],
      answer: "B",
      explanation: "20/100 × 250 = 50",
    },
  ],
  null,
  2
);
