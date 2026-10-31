// BankOS — question bank core: types, deterministic RNG, option helpers.
// Everything here is pure (no DB) so generators stay deterministic: the same
// code always produces the same question texts, which lets the loader skip
// questions that already exist in the database.

export const SUBJECTS = ["Reasoning", "English", "Quant", "Banking", "Current Affairs"] as const;
export type Subject = (typeof SUBJECTS)[number];
export type Difficulty = "Easy" | "Medium" | "Hard";

export type BankQuestion = {
  subject: string;
  topic: string;
  difficulty: string;
  text: string;
  options: string[];
  answer: number; // 0-based index into options
  explanation: string;
};

export type Rng = () => number;

/** mulberry32 — small, fast, deterministic PRNG. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const pick = <T,>(r: Rng, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export const int = (r: Rng, lo: number, hi: number): number => lo + Math.floor(r() * (hi - lo + 1));

export function shuffle<T>(r: Rng, arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Put `correct` at a random slot among 3 distinct distractors. */
export function build(
  r: Rng,
  subject: string,
  topic: string,
  difficulty: Difficulty,
  text: string,
  correct: string,
  distractors: string[],
  explanation: string
): BankQuestion | null {
  const uniq: string[] = [];
  for (const d of distractors) {
    if (d !== correct && !uniq.includes(d)) uniq.push(d);
  }
  if (uniq.length < 3) return null;
  const options = shuffle(r, [correct, ...uniq.slice(0, 3)]);
  const answer = options.indexOf(correct);
  // "1 days" → "1 day" (cosmetic)
  const fix = (o: string) => o.replace(/^1 (day|hour|second|litre|year)s$/, "1 $1");
  return { subject, topic, difficulty, text, options: options.map(fix), answer, explanation };
}

/** Handwritten question: correct answer FIRST, then 3 wrong ones; shuffled deterministically. */
export type Hand = [topic: string, difficulty: Difficulty, text: string, correct: string, w1: string, w2: string, w3: string, explanation: string];

export function fromHand(subject: string, rows: Hand[]): BankQuestion[] {
  const out: BankQuestion[] = [];
  for (const [topic, difficulty, text, correct, w1, w2, w3, explanation] of rows) {
    const r = makeRng(hashStr(text));
    const q = build(r, subject, topic, difficulty, text, correct, [w1, w2, w3], explanation);
    if (q) out.push(q);
  }
  return out;
}

// ---------- number formatting ----------
export function num(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 100) / 100);
}

/** Indian digit grouping: 1234567 -> 12,34,567 */
export function ind(n: number): string {
  const s = Math.abs(Math.round(n)).toString();
  let out: string;
  if (s.length <= 3) out = s;
  else out = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + s.slice(-3);
  return (n < 0 ? "-" : "") + out;
}

export function ord(n: number): string {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 < 4 ? n % 10 : 0]}`;
}

export const rs = (n: number) => `₹${ind(n)}`;

/**
 * Plausible wrong numbers around `correct`. `spread` is the typical gap;
 * results are positive when `correct` is positive.
 */
export function nearby(r: Rng, correct: number, spread: number, decimals = 0): number[] {
  const f = 10 ** decimals;
  const cands = new Set<number>();
  const mults = shuffle(r, [-4, -3, -2, -1, 1, 2, 3, 4, 5]);
  for (const m of mults) {
    const v = Math.round((correct + m * spread) * f) / f;
    if (v === correct) continue;
    if (correct > 0 && v <= 0) continue;
    cands.add(v);
  }
  return [...cands].slice(0, 3);
}

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export const NAMES = [
  "Rahul", "Priya", "Amit", "Neha", "Karan", "Anjali", "Vikram", "Sneha", "Rohit", "Pooja",
  "Arjun", "Divya", "Sanjay", "Kavita", "Manish", "Ritu", "Deepak", "Meera", "Suresh", "Nisha",
];

/** Run a template until `count` unique questions were produced. */
export function run(
  seed: number,
  count: number,
  template: (r: Rng) => BankQuestion | null
): BankQuestion[] {
  const r = makeRng(seed);
  const seen = new Set<string>();
  const out: BankQuestion[] = [];
  for (let tries = 0; tries < count * 40 && out.length < count; tries++) {
    const q = template(r);
    if (!q || seen.has(q.text)) continue;
    seen.add(q.text);
    out.push(q);
  }
  return out;
}
