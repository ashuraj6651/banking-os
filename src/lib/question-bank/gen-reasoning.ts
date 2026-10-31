// Deterministic Reasoning question generators (answers are computed).
import { BankQuestion, Rng, build, int, nearby, ord, pick, run, shuffle } from "./core";

const S = "Reasoning";
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const shift = (w: string, k: number) =>
  [...w].map((c) => A[(((A.indexOf(c) + k) % 26) + 26) % 26]).join("");
const WORDS = ["BANK", "LOAN", "CASH", "RATE", "FUND", "DEBT", "COIN", "NOTE", "BOND", "GOLD", "TRADE", "CHEQUE", "SAVE", "LEDGER", "CREDIT", "STOCK"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const T: ((r: Rng) => BankQuestion | null)[] = [];
const COUNTS: number[] = [];
function add(count: number, t: (r: Rng) => BankQuestion | null) {
  T.push(t);
  COUNTS.push(count);
}

// 1. Letter-shift coding
add(14, (r) => {
  const [w1, w2] = shuffle(r, WORDS).slice(0, 2);
  const k = pick(r, [1, 2, 3, 4, -1, -2, -3]);
  const ans = shift(w2, k);
  const ds = [shift(w2, k + 1), shift(w2, k - 1), shift(w2, k + 2), shift(w2, -k)];
  return build(r, S, "Coding-Decoding", "Medium",
    `In a certain code language, '${w1}' is written as '${shift(w1, k)}'. How will '${w2}' be written in that language?`,
    ans, ds, `Each letter is shifted ${k > 0 ? `${k} place(s) forward` : `${-k} place(s) backward`}. So ${w2} → ${ans}.`);
});

// 2. Opposite-letter coding
add(10, (r) => {
  const w = pick(r, WORDS);
  const opp = [...w].map((c) => A[25 - A.indexOf(c)]).join("");
  return build(r, S, "Coding-Decoding", "Medium",
    `In a certain code, each letter is replaced by its opposite letter in the alphabet (A↔Z, B↔Y, C↔X …). How will '${w}' be coded?`,
    opp, [shift(w, 1), [...opp].reverse().join(""), shift(opp, 1), shift(w, -1)],
    `Opposite of a letter at position p is at position 27 − p. So ${w} → ${opp}.`);
});

// 3. Letter value sum
add(10, (r) => {
  const w = pick(r, WORDS);
  const v = [...w].reduce((s, c) => s + A.indexOf(c) + 1, 0);
  return build(r, S, "Alphabet & Series", "Easy",
    `If A = 1, B = 2, C = 3 … Z = 26, what is the sum of the letter values of the word '${w}'?`,
    String(v), nearby(r, v, 3).map(String),
    `${[...w].map((c) => `${c}=${A.indexOf(c) + 1}`).join(", ")} → total ${v}.`);
});

// 4. Alphabet positions
add(14, (r) => {
  const kind = int(r, 0, 2);
  if (kind === 0) {
    const p = int(r, 1, 18), n = int(r, 2, 7);
    const ans = A[p - 1 + n];
    return build(r, S, "Alphabet & Series", "Easy", `Which letter is the ${ord(n)} to the right of '${A[p - 1]}' in the English alphabet?`,
      ans, [A[p - 2 + n] ?? "Z", A[p + n] ?? "Y", A[p - 1 - n] ?? "B", A[(p + 2 * n) % 26]],
      `${A[p - 1]} is at position ${p}; ${p} + ${n} = ${p + n} → ${ans}.`);
  }
  if (kind === 1) {
    const p = int(r, 9, 26), n = int(r, 2, 7);
    const ans = A[p - 1 - n];
    return build(r, S, "Alphabet & Series", "Easy", `Which letter is the ${ord(n)} to the left of '${A[p - 1]}' in the English alphabet?`,
      ans, [A[p - n], A[p - 2 - n], A[p - 1 + (n > 25 - p + 1 ? 0 : n)] ?? "A", A[(p + n) % 26]],
      `${A[p - 1]} is at position ${p}; ${p} − ${n} = ${p - n} → ${ans}.`);
  }
  const n = int(r, 3, 12);
  const ans = A[26 - n];
  return build(r, S, "Alphabet & Series", "Medium", `Which letter is the ${ord(n)} from the right end of the English alphabet?`,
    ans, [A[26 - n - 1], A[26 - n + 1] ?? "Z", A[n - 1], A[n]],
    `${ord(n)} from the right = position 27 − ${n} = ${27 - n} → ${ans}.`);
});

// 5. Ranking
add(14, (r) => {
  const total = int(r, 25, 60), top = int(r, 5, total - 5);
  const name = pick(r, ["Aman", "Riya", "Kabir", "Sita", "Dev", "Isha", "Naveen", "Tara"]);
  if (r() < 0.5) {
    const bottom = total - top + 1;
    return build(r, S, "Ranking & Order", "Easy", `${name} ranks ${ord(top)} from the top in a class of ${total} students. What is ${name}'s rank from the bottom?`,
      `${ord(bottom)}`, nearby(r, bottom, 1).map((n) => `${ord(n)}`).concat([ord(bottom + 2)]), `Rank from bottom = ${total} − ${top} + 1 = ${bottom}.`);
  }
  const bottom = int(r, 5, total - top);
  const tot = top + bottom - 1;
  return build(r, S, "Ranking & Order", "Easy", `${name} is ${ord(top)} from the top and ${ord(bottom)} from the bottom in a class. How many students are there in the class?`,
    String(tot), nearby(r, tot, 1).map(String).concat([String(tot + 2)]), `Total = ${top} + ${bottom} − 1 = ${tot}.`);
});

// 6. Row positions / persons between
add(12, (r) => {
  if (r() < 0.5) {
    const l = int(r, 4, 25), rr = int(r, 4, 25);
    return build(r, S, "Ranking & Order", "Easy", `In a row, ${pick(r, ["Ravi", "Anil", "Seema", "Gita"])} is ${ord(l)} from the left end and ${ord(rr)} from the right end. How many people are in the row?`,
      String(l + rr - 1), nearby(r, l + rr - 1, 1).map(String).concat([String(l + rr + 1)]), `Total = ${l} + ${rr} − 1 = ${l + rr - 1}.`);
  }
  const a = int(r, 3, 15), b = a + int(r, 4, 20);
  return build(r, S, "Ranking & Order", "Easy", `In a queue, A is ${ord(a)} from the front and B is ${ord(b)} from the front. How many people stand between A and B?`,
    String(b - a - 1), nearby(r, b - a - 1, 1).map(String).concat([String(b - a + 1)]), `People between = ${b} − ${a} − 1 = ${b - a - 1}.`);
});

// 7. Direction sense
add(10, (r) => {
  const k = int(r, 1, 6);
  const [p, q] = pick(r, [[3, 4], [5, 12], [8, 15]] as [number, number][]);
  const up = p * k, east = q * k;
  const extra = int(r, 1, 3) * 5;
  const north = up + extra;
  const hyp = Math.sqrt(up * up + east * east);
  const unit = pick(r, ["m", "km"]);
  const dir = pick(r, ["North", "South"]);
  const back = dir === "North" ? "South" : "North";
  const turn1 = dir === "North" ? "right" : "left";
  return build(r, S, "Direction Sense", "Medium",
    `A man walks ${north} ${unit} towards ${dir}, turns ${turn1} and walks ${east} ${unit}, then turns ${turn1} again and walks ${extra} ${unit}. How far is he from the starting point?`.replace(
      `turns ${turn1} again and walks ${extra} ${unit}`, `turns ${turn1} again and walks ${extra} ${unit} (towards ${back})`),
    `${hyp} ${unit}`, nearby(r, hyp, Math.max(1, k)).map((n) => `${n} ${unit}`),
    `Net ${dir.toLowerCase()}ward distance = ${north} − ${extra} = ${up} ${unit}; sideways = ${east} ${unit}. Distance = √(${up}² + ${east}²) = ${hyp} ${unit}.`);
});

// 8. Clock angle
add(12, (r) => {
  const h = int(r, 1, 12), m = int(r, 0, 29) * 2;
  let ang = Math.abs(30 * h - 5.5 * m);
  if (ang > 180) ang = 360 - ang;
  const time = `${h}:${String(m).padStart(2, "0")}`;
  return build(r, S, "Clock", "Hard", `What is the angle between the hour hand and the minute hand of a clock at ${time}?`,
    `${ang}°`, nearby(r, ang, 15).map((n) => `${n}°`).filter((s) => parseFloat(s) >= 0 && parseFloat(s) <= 180),
    `Angle = |30×${h} − 5.5×${m}| = ${Math.abs(30 * h - 5.5 * m)}°${ang !== Math.abs(30 * h - 5.5 * m) ? `, smaller angle = 360 − that = ${ang}°` : ""}.`);
});

// 9. Calendar / day arithmetic
add(12, (r) => {
  const i = int(r, 0, 6), n = int(r, 9, 120);
  const ans = DAYS[(i + n) % 7];
  return build(r, S, "Calendar", "Easy", `If today is ${DAYS[i]}, what day of the week will it be after ${n} days?`,
    ans, DAYS.filter((d) => d !== ans), `${n} mod 7 = ${n % 7}. ${DAYS[i]} + ${n % 7} day(s) = ${ans}.`);
});

// 10. Letter series with growing gaps
add(10, (r) => {
  const growing = r() < 0.6;
  const s0 = int(r, 1, 4), g = int(r, 1, 3);
  const pos = [s0];
  for (let i = 0; i < 5; i++) pos.push(pos[i] + (growing ? g + i : g + 1));
  if (pos[5] > 26) return null;
  const terms = pos.slice(0, 5).map((p) => A[p - 1]);
  return build(r, S, "Alphabet & Series", "Medium", `Find the next letter in the series: ${terms.join(", ")}, ?`,
    A[pos[5] - 1], [A[pos[5] - 2], A[pos[5]] ?? "Z", A[pos[5] - 3], A[pos[5] + 1] ?? "Y"],
    `Positions: ${pos.slice(0, 5).join(", ")} with ${growing ? "gaps increasing by 1 each time" : "a constant gap"} → next position ${pos[5]} = ${A[pos[5] - 1]}.`);
});

// 11. Inequality chains
const REL: Record<string, string> = { ">": ">", "≥": "≥", "=": "=" };
add(16, (r) => {
  const ls = shuffle(r, ["P", "Q", "R", "S", "T", "M", "N", "K", "L", "D", "F", "H"]).slice(0, 4);
  const rels = [0, 1, 2].map(() => pick(r, [">", "≥", "="] as const));
  if (rels.every((x) => x === "=")) return null;
  const decreasing = r() < 0.5; // read left→right as ≥-chain (decreasing) or ≤-chain (increasing)
  const flip = (x: string) => (x === ">" ? "<" : x === "≥" ? "≤" : "=");
  const shown = rels.map((x) => (decreasing ? x : flip(x)));
  const stmt = `${ls[0]} ${shown[0]} ${ls[1]} ${shown[1]} ${ls[2]} ${shown[2]} ${ls[3]}`;
  const strict = rels.includes(">");
  const first = decreasing ? ls[0] : ls[3];
  const last = decreasing ? ls[3] : ls[0];
  const correct = strict ? `${first} > ${last}` : `${first} ≥ ${last}`;
  const wrong = strict
    ? [`${first} < ${last}`, `${first} = ${last}`, `${first} ≤ ${last}`]
    : [`${first} < ${last}`, `${first} > ${last}`, `${first} = ${last}`];
  return build(r, S, "Inequality", "Medium", `If ${stmt}, which of the following is definitely true?`,
    correct, wrong, `Reading the chain in order gives ${first} ${strict ? ">" : "≥"} ${last}${strict ? " (at least one strict sign)" : " (no strict sign, so equality is possible)"}.`);
});

export function generateReasoning(): BankQuestion[] {
  const out: BankQuestion[] = [];
  T.forEach((tpl, i) => out.push(...run(5000 + i * 31, COUNTS[i], tpl)));
  return out;
}

void REL;
