// Deterministic Quant question generators. Every answer is computed, never typed
// by hand, so the key is always correct.
import {
  BankQuestion, Rng, build, gcd, int, ind, nearby, num, pick, rs, run, shuffle, NAMES,
} from "./core";

const S = "Quant";
const numOpts = (r: Rng, c: number, spread: number, fmt: (n: number) => string = num, dec = 0) =>
  nearby(r, c, spread, dec).map(fmt);

const T: ((r: Rng) => BankQuestion | null)[] = [];
const COUNTS: number[] = [];
function add(count: number, t: (r: Rng) => BankQuestion | null) {
  T.push(t);
  COUNTS.push(count);
}

// 1. Percentage of a number
add(10, (r) => {
  const p = pick(r, [5, 10, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80]);
  const n = int(r, 2, 60) * 20;
  if ((p * n) % 100 !== 0) return null;
  const a = (p * n) / 100;
  return build(r, S, "Percentage", "Easy", `What is ${p}% of ${ind(n)}?`, ind(a), nearby(r, a, Math.max(2, Math.round(a / 8))).map(ind),
    `${p}% of ${ind(n)} = ${p}/100 × ${ind(n)} = ${ind(a)}.`);
});

// 2. Reverse percentage
add(10, (r) => {
  const x = int(r, 3, 80) * 20;
  const p = pick(r, [10, 20, 25, 30, 40, 50]);
  const up = r() < 0.5;
  const v = (x * (up ? 100 + p : 100 - p)) / 100;
  if (!Number.isInteger(v)) return null;
  return build(r, S, "Percentage", "Easy",
    `A number ${up ? "increased" : "decreased"} by ${p}% becomes ${ind(v)}. What is the original number?`,
    ind(x), nearby(r, x, Math.max(10, Math.round(x / 10))).map(ind),
    `x × ${100 + (up ? p : -p)}/100 = ${ind(v)} → x = ${ind(v)} × 100/${100 + (up ? p : -p)} = ${ind(x)}.`);
});

// 3. Successive discounts
add(8, (r) => {
  const a = pick(r, [5, 10, 15, 20, 25, 30, 40]);
  const b = pick(r, [5, 10, 15, 20, 25, 30, 40]);
  if (a === b) return null;
  const e = a + b - (a * b) / 100;
  return build(r, S, "Percentage", "Medium",
    `Two successive discounts of ${a}% and ${b}% are equivalent to a single discount of:`,
    `${num(e)}%`, numOpts(r, e, 2.5, (n) => `${num(n)}%`, 1),
    `Single discount = ${a} + ${b} − (${a}×${b})/100 = ${num(e)}%.`);
});

// 4. Profit / loss: find SP
add(10, (r) => {
  const cp = int(r, 10, 200) * 20;
  const p = pick(r, [5, 10, 15, 20, 25, 30, 40]);
  const profit = r() < 0.6;
  const sp = (cp * (profit ? 100 + p : 100 - p)) / 100;
  if (!Number.isInteger(sp)) return null;
  return build(r, S, "Profit & Loss", "Easy",
    `${pick(r, NAMES)} buys an article for ${rs(cp)} and sells it at a ${p}% ${profit ? "profit" : "loss"}. What is the selling price?`,
    rs(sp), nearby(r, sp, Math.max(20, Math.round(sp / 12))).map(rs),
    `SP = ${rs(cp)} × ${100 + (profit ? p : -p)}/100 = ${rs(sp)}.`);
});

// 5. Profit / loss: find CP
add(10, (r) => {
  const cp = int(r, 5, 150) * 100;
  const p = pick(r, [10, 20, 25, 30, 40, 50]);
  const profit = r() < 0.5;
  const sp = (cp * (profit ? 100 + p : 100 - p)) / 100;
  return build(r, S, "Profit & Loss", "Medium",
    `By selling an article for ${rs(sp)}, a shopkeeper makes a ${p}% ${profit ? "profit" : "loss"}. What is the cost price?`,
    rs(cp), nearby(r, cp, Math.max(50, Math.round(cp / 10))).map(rs),
    `CP = SP × 100/${100 + (profit ? p : -p)} = ${rs(sp)} × 100/${100 + (profit ? p : -p)} = ${rs(cp)}.`);
});

// 6. Marked price & discount
add(10, (r) => {
  const mp = int(r, 4, 100) * 100;
  const d = pick(r, [5, 10, 15, 20, 25, 30, 40]);
  const sp = (mp * (100 - d)) / 100;
  if (r() < 0.5) {
    return build(r, S, "Profit & Loss", "Easy",
      `An item is marked at ${rs(mp)} and a discount of ${d}% is offered. What is its selling price?`,
      rs(sp), nearby(r, sp, Math.max(20, Math.round(sp / 12))).map(rs),
      `SP = ${rs(mp)} × (100 − ${d})/100 = ${rs(sp)}.`);
  }
  return build(r, S, "Profit & Loss", "Medium",
    `After a discount of ${d}%, an item is sold for ${rs(sp)}. What was its marked price?`,
    rs(mp), nearby(r, mp, Math.max(50, Math.round(mp / 10))).map(rs),
    `MP = SP × 100/(100 − ${d}) = ${rs(sp)} × 100/${100 - d} = ${rs(mp)}.`);
});

// 7. Simple interest
add(12, (r) => {
  const P = int(r, 2, 40) * 500;
  const R = int(r, 4, 15);
  const t = int(r, 2, 6);
  const si = (P * R * t) / 100;
  if (r() < 0.65) {
    return build(r, S, "Simple Interest", "Easy",
      `What is the simple interest on ${rs(P)} at ${R}% per annum for ${t} years?`,
      rs(si), nearby(r, si, Math.max(50, Math.round(si / 10))).map(rs),
      `SI = P×R×T/100 = ${ind(P)}×${R}×${t}/100 = ${rs(si)}.`);
  }
  return build(r, S, "Simple Interest", "Medium",
    `At what rate of simple interest per annum will ${rs(P)} earn ${rs(si)} in ${t} years?`,
    `${R}%`, nearby(r, R, 1.5, 1).map((n) => `${num(n)}%`),
    `R = SI×100/(P×T) = ${ind(si)}×100/(${ind(P)}×${t}) = ${R}%.`);
});

// 8. Compound interest (2 years)
add(10, (r) => {
  const P = pick(r, [400, 800, 1200, 1600, 2000, 4000, 5200, 8000, 10000, 12000, 16000, 20000]);
  const R = pick(r, [5, 10, 20]);
  const amt = (P * (100 + R) * (100 + R)) / 10000;
  const ci = amt - P;
  return build(r, S, "Compound Interest", "Medium",
    `What is the compound interest on ${rs(P)} at ${R}% per annum for 2 years (compounded annually)?`,
    rs(ci), nearby(r, ci, Math.max(10, Math.round(ci / 10))).map(rs),
    `Amount = ${ind(P)} × (1 + ${R}/100)² = ${rs(amt)}; CI = ${rs(amt)} − ${rs(P)} = ${rs(ci)}.`);
});

// 9. Time & work: together
const PAIRS: [number, number][] = [[1, 2], [2, 3], [1, 3], [3, 4], [2, 5], [3, 5], [1, 4]];
add(10, (r) => {
  const [a, b] = pick(r, PAIRS);
  const m = int(r, 1, 4);
  const k = (a + b) * m;
  const x = a * k, y = b * k, t = a * b * m;
  return build(r, S, "Time & Work", "Easy",
    `A can complete a piece of work in ${x} days and B can complete it in ${y} days. Working together, in how many days will they complete it?`,
    `${t} days`, nearby(r, t, Math.max(1, Math.round(t / 5))).map((n) => `${n} days`),
    `Together: ${x}×${y}/(${x}+${y}) = ${t} days.`);
});

// 10. Time & work: partial
add(8, (r) => {
  const [a, b] = pick(r, PAIRS);
  const m = int(r, 1, 4);
  const k = (a + b) * m;
  const x = a * k, y = b * k, t = a * b * m;
  if (t % 2 !== 0 || x % 2 !== 0) return null;
  const d = t / 2;
  const rem = x / 2;
  return build(r, S, "Time & Work", "Medium",
    `A alone can finish a job in ${x} days and B alone in ${y} days. They work together for ${d} days and then B leaves. In how many more days will A finish the remaining work?`,
    `${rem} days`, nearby(r, rem, Math.max(1, Math.round(rem / 4))).map((n) => `${n} days`),
    `Together they take ${t} days, so in ${d} days half the work is done. A needs ${x}/2 = ${rem} days for the other half.`);
});

// 11. Trains
add(10, (r) => {
  const v = pick(r, [36, 54, 72, 90, 108]);
  const ms = (v * 5) / 18;
  if (r() < 0.5) {
    const t = int(r, 4, 30);
    const L = ms * t;
    return build(r, S, "Speed, Time & Distance", "Medium",
      `A train running at ${v} km/h crosses a pole in ${t} seconds. What is the length of the train?`,
      `${L} m`, nearby(r, L, Math.max(10, Math.round(L / 8))).map((n) => `${n} m`),
      `Speed = ${v}×5/18 = ${ms} m/s. Length = ${ms} × ${t} = ${L} m.`);
  }
  const t = int(r, 8, 60);
  const total = ms * t;
  const L = int(r, 4, Math.max(5, Math.floor(total / 10))) * 5;
  const P = total - L;
  if (P <= 0 || L >= total) return null;
  return build(r, S, "Speed, Time & Distance", "Medium",
    `A ${L} m long train running at ${v} km/h crosses a platform ${P} m long. How long does it take?`,
    `${t} seconds`, nearby(r, t, Math.max(1, Math.round(t / 6))).map((n) => `${n} seconds`),
    `Distance = ${L} + ${P} = ${total} m; speed = ${ms} m/s; time = ${total}/${ms} = ${t} s.`);
});

// 12. Basic speed-time-distance + relative motion
add(10, (r) => {
  const s = int(r, 6, 20) * 5;
  const t = int(r, 2, 9);
  const d = s * t;
  const kind = int(r, 0, 2);
  if (kind === 0) {
    return build(r, S, "Speed, Time & Distance", "Easy",
      `A car covers ${d} km in ${t} hours at a uniform speed. What is its speed?`,
      `${s} km/h`, nearby(r, s, 5).map((n) => `${n} km/h`), `Speed = ${d}/${t} = ${s} km/h.`);
  }
  if (kind === 1) {
    return build(r, S, "Speed, Time & Distance", "Easy",
      `How much time will a vehicle take to cover ${d} km at ${s} km/h?`,
      `${t} hours`, nearby(r, t, 1).map((n) => `${n} hours`), `Time = ${d}/${s} = ${t} hours.`);
  }
  const s2 = int(r, 6, 20) * 5;
  const same = r() < 0.5;
  if (!same && s2 === s) return null;
  const gap = same ? Math.abs(s - s2) * t : (s + s2) * t;
  if (gap === 0) return null;
  return build(r, S, "Speed, Time & Distance", "Medium",
    `Two cars start from the same point at the same time at ${s} km/h and ${s2} km/h, going in ${same ? "the same direction" : "opposite directions"}. How far apart are they after ${t} hours?`,
    `${gap} km`, nearby(r, gap, Math.max(5, Math.round(gap / 8))).map((n) => `${n} km`),
    `Relative speed = ${same ? `|${s} − ${s2}|` : `${s} + ${s2}`} = ${gap / t} km/h; distance = ${gap / t} × ${t} = ${gap} km.`);
});

// 13. Averages
add(12, (r) => {
  const kind = int(r, 0, 3);
  if (kind === 0) {
    const n = pick(r, [5, 6, 8, 10]);
    const A = int(r, 10, 60);
    const B = A + int(r, 1, 6) * (r() < 0.5 ? 1 : -1);
    const removed = n * A - (n - 1) * B;
    if (removed <= 0) return null;
    return build(r, S, "Average", "Medium",
      `The average of ${n} numbers is ${A}. If one number is removed, the average of the remaining numbers becomes ${B}. What is the number removed?`,
      String(removed), nearby(r, removed, 4).map(String),
      `Sum = ${n}×${A} = ${n * A}; remaining sum = ${n - 1}×${B} = ${(n - 1) * B}; removed = ${removed}.`);
  }
  if (kind === 1) {
    const n = int(r, 5, 30);
    return build(r, S, "Average", "Easy",
      `What is the average of the first ${n} even natural numbers?`,
      String(n + 1), nearby(r, n + 1, 2).map(String),
      `Sum of first n even numbers = n(n+1), so the average = n + 1 = ${n + 1}.`);
  }
  if (kind === 2) {
    const n = int(r, 12, 40);
    const A = int(r, 12, 40);
    const k = int(r, 1, 3);
    const teacher = A + k * (n + 1);
    return build(r, S, "Average", "Medium",
      `The average age of ${n} students is ${A} years. When the teacher's age is included, the average increases by ${k} year${k > 1 ? "s" : ""}. What is the teacher's age?`,
      `${teacher} years`, nearby(r, teacher, 3).map((x) => `${x} years`),
      `Teacher = (${A}+${k})×${n + 1} − ${n}×${A} = ${teacher} years.`);
  }
  const n = pick(r, [3, 5, 7, 9]);
  const start = int(r, 3, 40);
  const mid = start + (n - 1);
  return build(r, S, "Average", "Easy",
    `What is the average of ${n} consecutive integers starting from ${start}?`,
    String(mid), nearby(r, mid, 2).map(String),
    `The average of consecutive integers is the middle term = ${start} + ${n - 1}/2 = ${mid}.`);
});

// 14. Ratio & proportion
add(10, (r) => {
  const [a, b] = pick(r, [[2, 3], [3, 5], [4, 5], [1, 4], [3, 7], [5, 7], [2, 5], [4, 9]] as [number, number][]);
  const base = int(r, 2, 40) * 10;
  const N = (a + b) * base;
  const name = pick(r, NAMES);
  if (r() < 0.5) {
    const share = a * base;
    return build(r, S, "Ratio & Proportion", "Easy",
      `${rs(N)} is divided between ${name} and Vikash in the ratio ${a}:${b}. What is ${name}'s share?`,
      rs(share), nearby(r, share, Math.max(10, base)).map(rs),
      `Share = ${ind(N)} × ${a}/${a + b} = ${rs(share)}.`);
  }
  const diff = Math.abs(b - a) * base;
  return build(r, S, "Ratio & Proportion", "Medium",
    `${rs(N)} is divided between two people in the ratio ${a}:${b}. What is the difference between their shares?`,
    rs(diff), nearby(r, diff, Math.max(10, base)).map(rs),
    `Each part = ${ind(N)}/${a + b} = ${ind(base)}; difference = ${Math.abs(b - a)} × ${ind(base)} = ${rs(diff)}.`);
});

// 15. Ages
add(8, (r) => {
  const k = int(r, 2, 5);
  const son = int(r, 6, 25);
  const S2 = (k + 1) * son;
  const kind = int(r, 0, 1);
  if (kind === 0) {
    return build(r, S, "Ages", "Easy",
      `The sum of the ages of a father and his son is ${S2} years. If the father is ${k} times as old as the son, what is the son's age?`,
      `${son} years`, nearby(r, son, 2).map((n) => `${n} years`),
      `Son = ${S2}/(${k}+1) = ${son} years.`);
  }
  const y = int(r, 3, 10);
  return build(r, S, "Ages", "Medium",
    `A father is ${k} times as old as his son. After ${y} years, the sum of their ages will be ${S2 + 2 * y}. What is the father's present age?`,
    `${k * son} years`, nearby(r, k * son, 3).map((n) => `${n} years`),
    `Present sum = ${S2 + 2 * y} − 2×${y} = ${S2}; son = ${S2}/${k + 1} = ${son}; father = ${k * son}.`);
});

// 16. Average speed (to-and-fro)
add(8, (r) => {
  const [a, b] = pick(r, [[2, 3], [1, 2], [3, 4], [1, 3], [2, 5], [3, 5]] as [number, number][]);
  const m = int(r, 1, 5);
  const k = (a + b) * m;
  const x = a * k, y = b * k;
  const avg = 2 * a * b * m;
  return build(r, S, "Speed, Time & Distance", "Medium",
    `A car goes from city A to city B at ${x} km/h and returns along the same route at ${y} km/h. What is its average speed for the whole journey?`,
    `${avg} km/h`, nearby(r, avg, Math.max(2, Math.round(avg / 8))).map((n) => `${n} km/h`),
    `Average speed = 2xy/(x+y) = 2×${x}×${y}/${x + y} = ${avg} km/h.`);
});

// 17. Number series
add(24, (r) => {
  const kind = int(r, 0, 5);
  const wrap = (terms: number[], next: number, expl: string, diff: "Easy" | "Medium" | "Hard") =>
    build(r, S, "Number Series", diff, `Find the next term in the series: ${terms.join(", ")}, ?`,
      String(next), nearby(r, next, Math.max(2, Math.round(Math.abs(next) / 12))).map(String), expl);
  if (kind === 0) {
    const a = int(r, 1, 30), d = int(r, 2, 13);
    const t = Array.from({ length: 6 }, (_, i) => a + i * d);
    return wrap(t, a + 6 * d, `Constant difference of ${d}: next = ${t[5]} + ${d} = ${a + 6 * d}.`, "Easy");
  }
  if (kind === 1) {
    const a = int(r, 1, 6), q = pick(r, [2, 3]);
    const t = Array.from({ length: 5 }, (_, i) => a * q ** i);
    return wrap(t, a * q ** 5, `Each term is multiplied by ${q}: next = ${t[4]} × ${q} = ${a * q ** 5}.`, "Medium");
  }
  if (kind === 2) {
    const a = int(r, 1, 20), d = int(r, 1, 4), c = int(r, 1, 3);
    const t = [a];
    for (let i = 0; i < 5; i++) t.push(t[i] + d + i * c);
    const next = t[5] + d + 5 * c;
    return wrap(t, next, `Differences ${t.slice(1).map((v, i) => v - t[i]).join(", ")} increase by ${c} each step → next difference ${d + 5 * c}; ${t[5]} + ${d + 5 * c} = ${next}.`, "Medium");
  }
  if (kind === 3) {
    const n0 = int(r, 2, 8), c = pick(r, [-3, -2, -1, 1, 2, 3, 4, 5]);
    const t = Array.from({ length: 5 }, (_, i) => (n0 + i) ** 2 + c);
    const next = (n0 + 5) ** 2 + c;
    return wrap(t, next, `Terms follow n² ${c >= 0 ? "+" : "−"} ${Math.abs(c)} for n = ${n0}, ${n0 + 1}, …; next n = ${n0 + 5}: ${next}.`, "Medium");
  }
  if (kind === 4) {
    const a = int(r, 1, 6), m = pick(r, [2, 3]), c = pick(r, [-2, -1, 1, 2, 3]);
    const t = [a];
    for (let i = 0; i < 4; i++) t.push(t[i] * m + c);
    const next = t[4] * m + c;
    if (t.some((v) => v <= 0)) return null;
    return wrap(t, next, `Rule: previous × ${m} ${c >= 0 ? "+" : "−"} ${Math.abs(c)}. Next = ${t[4]}×${m} ${c >= 0 ? "+" : "−"} ${Math.abs(c)} = ${next}.`, "Hard");
  }
  const a = int(r, 2, 30), b = int(r, 40, 90), d1 = int(r, 2, 6), d2 = int(r, 2, 6);
  const t = [a, b, a + d1, b - d2, a + 2 * d1, b - 2 * d2, a + 3 * d1];
  const next = b - 3 * d2;
  return wrap(t, next, `Two alternating series: +${d1} on odd places and −${d2} on even places → ${next}.`, "Hard");
});

// 18. Simplification
add(14, (r) => {
  const kind = int(r, 0, 4);
  const q = (text: string, ans: number, expl: string, d: "Easy" | "Medium" = "Easy") =>
    build(r, S, "Simplification", d, text, String(ans), nearby(r, ans, Math.max(2, Math.round(Math.abs(ans) / 15))).map(String), expl);
  if (kind === 0) {
    const a = int(r, 12, 60), b = int(r, 5, 25), c = int(r, 3, 12);
    return q(`Simplify: ${a} × ${b} − ${c} × ${b}`, (a - c) * b, `= ${b} × (${a} − ${c}) = ${b} × ${a - c} = ${(a - c) * b}.`);
  }
  if (kind === 1) {
    const sq = int(r, 5, 30) ** 2, m = int(r, 2, 9), n = int(r, 5, 80);
    const root = Math.sqrt(sq);
    return q(`Find the value: √${sq} × ${m} + ${n}`, root * m + n, `√${sq} = ${root}; ${root} × ${m} + ${n} = ${root * m + n}.`);
  }
  if (kind === 2) {
    const p1 = pick(r, [10, 20, 25, 50]), p2 = pick(r, [10, 20, 25, 50]);
    const n1 = int(r, 4, 40) * 20, n2 = int(r, 4, 40) * 20;
    const ans = (p1 * n1) / 100 + (p2 * n2) / 100;
    return q(`What is ${p1}% of ${n1} + ${p2}% of ${n2}?`, ans, `${(p1 * n1) / 100} + ${(p2 * n2) / 100} = ${ans}.`, "Medium");
  }
  if (kind === 3) {
    const a = int(r, 11, 40), b = int(r, 11, 40);
    return q(`Find the value of ${a}² − ${b}²`, a * a - b * b, `${a}² − ${b}² = (${a}+${b})(${a}−${b}) = ${a + b} × ${a - b} = ${a * a - b * b}.`, "Medium");
  }
  const a = int(r, 5, 40), b = int(r, 2, 12), c = int(r, 20, 90), d = int(r, 2, 9);
  if ((a + b) * d - c <= 0) return null;
  return q(`Simplify: (${a} + ${b}) × ${d} − ${c}`, (a + b) * d - c, `(${a} + ${b}) = ${a + b}; ${a + b} × ${d} = ${(a + b) * d}; minus ${c} = ${(a + b) * d - c}.`);
});

// 19. Mensuration
add(16, (r) => {
  const kind = int(r, 0, 6);
  if (kind === 0) {
    const rad = pick(r, [7, 14, 21, 28, 35, 42]);
    const a = (22 * rad * rad) / 7;
    return build(r, S, "Mensuration", "Easy", `What is the area of a circle of radius ${rad} cm? (Use π = 22/7)`,
      `${ind(a)} cm²`, nearby(r, a, Math.max(20, Math.round(a / 10))).map((n) => `${ind(n)} cm²`), `Area = πr² = 22/7 × ${rad}² = ${ind(a)} cm².`);
  }
  if (kind === 1) {
    const rad = pick(r, [7, 14, 21, 28, 35, 49]);
    const c = (44 * rad) / 7;
    return build(r, S, "Mensuration", "Easy", `What is the circumference of a circle of radius ${rad} cm? (Use π = 22/7)`,
      `${c} cm`, nearby(r, c, Math.max(4, Math.round(c / 10))).map((n) => `${n} cm`), `Circumference = 2πr = 2 × 22/7 × ${rad} = ${c} cm.`);
  }
  if (kind === 2) {
    const l = int(r, 8, 40), b = int(r, 4, l - 1);
    const per = 2 * (l + b);
    return build(r, S, "Mensuration", "Medium", `The perimeter of a rectangle is ${per} m and its length is ${l} m. What is its area?`,
      `${l * b} m²`, nearby(r, l * b, Math.max(4, Math.round((l * b) / 10))).map((n) => `${n} m²`),
      `Breadth = ${per}/2 − ${l} = ${b} m; area = ${l} × ${b} = ${l * b} m².`);
  }
  if (kind === 3) {
    const side = int(r, 3, 30);
    return build(r, S, "Mensuration", "Easy", `The perimeter of a square is ${4 * side} cm. What is its area?`,
      `${side * side} cm²`, nearby(r, side * side, Math.max(3, side)).map((n) => `${n} cm²`), `Side = ${4 * side}/4 = ${side}; area = ${side}² = ${side * side} cm².`);
  }
  if (kind === 4) {
    const l = int(r, 3, 15), b = int(r, 3, 12), h = int(r, 2, 10);
    const v = l * b * h;
    return build(r, S, "Mensuration", "Easy", `What is the volume of a cuboid with length ${l} cm, breadth ${b} cm and height ${h} cm?`,
      `${v} cm³`, nearby(r, v, Math.max(5, Math.round(v / 10))).map((n) => `${n} cm³`), `Volume = ${l} × ${b} × ${h} = ${v} cm³.`);
  }
  if (kind === 5) {
    const [a, b, c] = pick(r, [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]] as [number, number, number][]);
    const k = int(r, 1, 6);
    return build(r, S, "Mensuration", "Medium", `The two perpendicular sides of a right-angled triangle are ${a * k} cm and ${b * k} cm. What is the length of its hypotenuse?`,
      `${c * k} cm`, nearby(r, c * k, Math.max(1, k)).map((n) => `${n} cm`), `Hypotenuse = √(${a * k}² + ${b * k}²) = ${c * k} cm.`);
  }
  const rad = pick(r, [7, 14, 21]);
  const h = int(r, 2, 15);
  const v = (22 * rad * rad * h) / 7;
  return build(r, S, "Mensuration", "Medium", `What is the volume of a cylinder with base radius ${rad} cm and height ${h} cm? (π = 22/7)`,
    `${ind(v)} cm³`, nearby(r, v, Math.max(30, Math.round(v / 10))).map((n) => `${ind(n)} cm³`), `Volume = πr²h = 22/7 × ${rad}² × ${h} = ${ind(v)} cm³.`);
});

// 20. HCF / LCM
add(10, (r) => {
  const g = int(r, 2, 15);
  const u = int(r, 2, 9), v = int(r, 2, 9);
  if (u === v || gcd(u, v) !== 1) return null;
  const A = g * u, B = g * v;
  if (r() < 0.5) {
    return build(r, S, "HCF & LCM", "Easy", `What is the HCF of ${A} and ${B}?`, String(g),
      nearby(r, g, 1).map(String).concat([String(g * 2), String(A - B > 0 ? A - B : B - A)]), `${A} = ${g}×${u} and ${B} = ${g}×${v} with ${u}, ${v} co-prime, so HCF = ${g}.`);
  }
  const l = g * u * v;
  return build(r, S, "HCF & LCM", "Medium", `What is the LCM of ${A} and ${B}?`, String(l),
    nearby(r, l, Math.max(g, Math.round(l / 10))).map(String), `LCM = (A×B)/HCF = ${A}×${B}/${g} = ${l}.`);
});

// 21. Simple equations / numbers
add(10, (r) => {
  const kind = int(r, 0, 3);
  if (kind === 0) {
    const big = int(r, 20, 90), small = int(r, 5, big - 3);
    return build(r, S, "Simple Equations", "Easy", `The sum of two numbers is ${big + small} and their difference is ${big - small}. What is the larger number?`,
      String(big), nearby(r, big, 2).map(String), `Larger = (sum + difference)/2 = (${big + small} + ${big - small})/2 = ${big}.`);
  }
  if (kind === 1) {
    const x = int(r, 3, 40), k = int(r, 2, 9), n = int(r, 2, 30);
    return build(r, S, "Simple Equations", "Easy", `When a number is multiplied by ${k} and then ${n} is subtracted, the result is ${k * x - n}. What is the number?`,
      String(x), nearby(r, x, 2).map(String), `${k}x − ${n} = ${k * x - n} → x = ${k * x}/${k} = ${x}.`);
  }
  if (kind === 2) {
    const x = int(r, 5, 80);
    return build(r, S, "Simple Equations", "Easy", `The sum of three consecutive integers is ${3 * x + 3}. What is the largest of them?`,
      String(x + 2), nearby(r, x + 2, 1).map(String), `Middle = ${3 * x + 3}/3 = ${x + 1}; largest = ${x + 2}.`);
  }
  const e = int(r, 2, 40) * 2;
  return build(r, S, "Simple Equations", "Medium", `The sum of three consecutive even numbers is ${3 * e + 6}. What is the smallest of them?`,
    String(e), nearby(r, e, 2).map(String), `Middle = ${3 * e + 6}/3 = ${e + 2}; smallest = ${e}.`);
});

// 22. Partnership
add(8, (r) => {
  const [a, b] = pick(r, [[2, 3], [3, 4], [1, 2], [2, 5], [3, 5], [4, 5]] as [number, number][]);
  const u = int(r, 1, 10) * 1000;
  const w = int(r, 2, 30) * 100;
  const P = (a + b) * w;
  const name = pick(r, NAMES);
  if (r() < 0.6) {
    return build(r, S, "Partnership", "Medium",
      `${name} and Sunil start a business with investments of ${rs(a * u)} and ${rs(b * u)} respectively. At the end of the year the profit is ${rs(P)}. What is ${name}'s share?`,
      rs(a * w), nearby(r, a * w, Math.max(100, w / 2)).map(rs),
      `Profit is shared in the ratio of investments ${a}:${b}. Share = ${ind(P)} × ${a}/${a + b} = ${rs(a * w)}.`);
  }
  // second partner joins after 6 months => ratio (a*u*12) : (b*u*6) = 2a : b
  const A2 = 2 * a, B2 = b;
  const g = gcd(A2, B2);
  const ra = A2 / g, rb = B2 / g;
  const P2 = (ra + rb) * w;
  return build(r, S, "Partnership", "Hard",
    `${name} invests ${rs(a * u)} in a business. After 6 months, Sunil joins with ${rs(b * u)}. At the end of the year, the profit is ${rs(P2)}. What is ${name}'s share?`,
    rs(ra * w), nearby(r, ra * w, Math.max(100, w / 2)).map(rs),
    `Ratio = (${ind(a * u)}×12) : (${ind(b * u)}×6) = ${ra}:${rb}. Share = ${ind(P2)} × ${ra}/${ra + rb} = ${rs(ra * w)}.`);
});

// 23. Probability
add(8, (r) => {
  const red = int(r, 2, 9), blue = int(r, 2, 9), green = int(r, 1, 8);
  const tot = red + blue + green;
  const f = (n: number, d: number) => { const g = gcd(n, d); return g === d ? String(n / g) : `${n / g}/${d / g}`; };
  const colours: [string, number][] = [["red", red], ["blue", blue], ["green", green]];
  const [cn, cv] = pick(r, colours);
  const ans = f(cv, tot);
  const ds = [f(tot - cv, tot), f(cv, tot - 1), f(cv + 1, tot), f(cv, tot + 1)];
  return build(r, S, "Probability", "Medium",
    `A bag contains ${red} red, ${blue} blue and ${green} green balls. One ball is drawn at random. What is the probability that it is ${cn}?`,
    ans, ds, `Favourable = ${cv}, total = ${tot}. Probability = ${cv}/${tot} = ${ans}.`);
});

// 24. Permutation & combination
add(10, (r) => {
  const fact = (n: number): number => (n <= 1 ? 1 : n * fact(n - 1));
  const nCr = (n: number, k: number) => fact(n) / (fact(k) * fact(n - k));
  const kind = int(r, 0, 3);
  if (kind === 0) {
    const n = int(r, 4, 7);
    return build(r, S, "Permutation & Combination", "Easy", `In how many ways can ${n} different books be arranged on a shelf?`,
      String(fact(n)), nearby(r, fact(n), Math.max(6, Math.round(fact(n) / 6))).map(String), `${n}! = ${fact(n)}.`);
  }
  if (kind === 1) {
    const n = int(r, 5, 10), k = int(r, 2, 4);
    return build(r, S, "Permutation & Combination", "Medium", `In how many ways can a team of ${k} be chosen from ${n} people?`,
      String(nCr(n, k)), nearby(r, nCr(n, k), Math.max(2, Math.round(nCr(n, k) / 6))).map(String), `${n}C${k} = ${nCr(n, k)}.`);
  }
  if (kind === 2) {
    const n = int(r, 5, 8), k = int(r, 2, 3);
    const p = fact(n) / fact(n - k);
    return build(r, S, "Permutation & Combination", "Medium", `How many different ${k}-letter arrangements can be made from ${n} distinct letters (no repetition)?`,
      String(p), nearby(r, p, Math.max(5, Math.round(p / 6))).map(String), `${n}P${k} = ${p}.`);
  }
  const m = int(r, 4, 7), w = int(r, 3, 6);
  const ans = nCr(m, 2) * nCr(w, 2);
  return build(r, S, "Permutation & Combination", "Hard", `A committee of 2 men and 2 women is to be formed from ${m} men and ${w} women. In how many ways can this be done?`,
    String(ans), nearby(r, ans, Math.max(5, Math.round(ans / 6))).map(String), `${m}C2 × ${w}C2 = ${nCr(m, 2)} × ${nCr(w, 2)} = ${ans}.`);
});

// 25. Boats & streams
add(8, (r) => {
  const st = int(r, 2, 6), b = st + int(r, 3, 14);
  const D = b + st, U = b - st;
  const kind = int(r, 0, 2);
  if (kind === 0) {
    return build(r, S, "Boats & Streams", "Medium", `A boat's downstream speed is ${D} km/h and upstream speed is ${U} km/h. What is the speed of the boat in still water?`,
      `${b} km/h`, nearby(r, b, 2).map((n) => `${n} km/h`), `Still water = (${D} + ${U})/2 = ${b} km/h.`);
  }
  if (kind === 1) {
    return build(r, S, "Boats & Streams", "Medium", `A boat's downstream speed is ${D} km/h and upstream speed is ${U} km/h. What is the speed of the stream?`,
      `${st} km/h`, nearby(r, st, 1).map((n) => `${n} km/h`), `Stream = (${D} − ${U})/2 = ${st} km/h.`);
  }
  const t = int(r, 2, 6);
  return build(r, S, "Boats & Streams", "Medium", `A boat can row ${b} km/h in still water and the stream flows at ${st} km/h. How far can it travel downstream in ${t} hours?`,
    `${D * t} km`, nearby(r, D * t, Math.max(3, t * 2)).map((n) => `${n} km`), `Downstream speed = ${b}+${st} = ${D} km/h; distance = ${D}×${t} = ${D * t} km.`);
});

// 26. Population growth / depreciation
add(8, (r) => {
  const P = pick(r, [400, 800, 1200, 2000, 4000, 8000, 10000, 20000, 40000, 50000, 80000, 100000]);
  const R = pick(r, [5, 10, 20]);
  const grow = r() < 0.55;
  const ans = (P * (100 + (grow ? R : -R)) * (100 + (grow ? R : -R))) / 10000;
  if (!Number.isInteger(ans)) return null;
  return grow
    ? build(r, S, "Compound Interest", "Medium", `The population of a town is ${ind(P)}. If it increases by ${R}% every year, what will it be after 2 years?`,
        ind(ans), nearby(r, ans, Math.max(10, Math.round(ans / 15))).map(ind), `${ind(P)} × (1 + ${R}/100)² = ${ind(ans)}.`)
    : build(r, S, "Compound Interest", "Medium", `A machine costing ${rs(P)} depreciates by ${R}% every year. What is its value after 2 years?`,
        rs(ans), nearby(r, ans, Math.max(10, Math.round(ans / 15))).map(rs), `${ind(P)} × (1 − ${R}/100)² = ${rs(ans)}.`);
});

// 27. Mixtures / alligation
add(8, (r) => {
  if (r() < 0.5) {
    const [a, b] = pick(r, [[3, 1], [5, 3], [7, 3], [4, 1], [5, 1], [9, 5]] as [number, number][]);
    const k = int(r, 2, 12);
    const total = (a + b) * k;
    const add2 = (a - b) * k;
    return build(r, S, "Mixtures", "Medium",
      `A ${total}-litre mixture contains milk and water in the ratio ${a}:${b}. How much water must be added to make the ratio 1:1?`,
      `${add2} litres`, nearby(r, add2, Math.max(1, Math.round(add2 / 4))).map((n) => `${n} litres`),
      `Milk = ${a * k} L, water = ${b * k} L. For 1:1 water must be ${a * k} L, so add ${a * k} − ${b * k} = ${add2} L.`);
  }
  const x = int(r, 20, 60), y = x + int(r, 5, 30), p = int(r, 1, 4), q = int(r, 1, 4);
  const cost = (p * x + q * y) / (p + q);
  if (!Number.isInteger(cost)) return null;
  return build(r, S, "Mixtures", "Medium",
    `Rice costing ₹${x}/kg is mixed with rice costing ₹${y}/kg in the ratio ${p}:${q}. What is the cost per kg of the mixture?`,
    `₹${cost}`, nearby(r, cost, 2).map((n) => `₹${n}`), `Cost = (${p}×${x} + ${q}×${y})/(${p}+${q}) = ₹${cost}/kg.`);
});

// 28. Percentage applications
add(10, (r) => {
  const kind = int(r, 0, 3);
  if (kind === 0) {
    const [p, ans] = pick(r, [[25, 20], [100, 50], [150, 60], [300, 75], [400, 80]] as [number, number][]);
    return build(r, S, "Percentage", "Medium", `If A's income is ${p}% more than B's, then B's income is what percent less than A's?`,
      `${ans}%`, nearby(r, ans, 5).map((n) => `${n}%`), `B is less by ${p}/(100+${p}) × 100 = ${ans}%.`);
  }
  if (kind === 1) {
    const [q, ans] = pick(r, [[20, 25], [50, 100], [60, 150], [75, 300], [80, 400]] as [number, number][]);
    return build(r, S, "Percentage", "Medium", `If B's income is ${q}% less than A's, then A's income is what percent more than B's?`,
      `${ans}%`, nearby(r, ans, ans >= 100 ? 50 : 5).map((n) => `${n}%`), `A is more by ${q}/(100−${q}) × 100 = ${ans}%.`);
  }
  if (kind === 2) {
    const w = pick(r, [55, 60, 65, 70, 75]);
    const T2 = int(r, 2, 40) * 1000;
    const diff = (T2 * (2 * w - 100)) / 100;
    return build(r, S, "Percentage", "Medium",
      `In a two-candidate election, the winner got ${w}% of the votes and won by ${ind(diff)} votes. How many votes were cast in total?`,
      ind(T2), nearby(r, T2, 1000).map(ind), `Margin = (${w} − ${100 - w})% = ${2 * w - 100}% of total → total = ${ind(diff)}×100/${2 * w - 100} = ${ind(T2)}.`);
  }
  const total = int(r, 4, 50) * 50;
  const pass = pick(r, [40, 50, 60, 70, 80, 90]);
  const fail = total - (total * pass) / 100;
  return build(r, S, "Percentage", "Easy", `In an exam, ${pass}% of ${ind(total)} candidates passed. How many candidates failed?`,
    String(fail), nearby(r, fail, Math.max(3, Math.round(fail / 8))).map(String), `Failed = ${100 - pass}% of ${ind(total)} = ${fail}.`);
});

// 29. Pipes & cisterns
add(8, (r) => {
  const [a, b] = pick(r, [[2, 3], [3, 4], [1, 2], [2, 5], [3, 5]] as [number, number][]);
  const k = (b - a) * int(r, 1, 4);
  const x = a * k, y = b * k, t = (a * b * k) / (b - a);
  if (!Number.isInteger(t)) return null;
  return build(r, S, "Pipes & Cisterns", "Hard",
    `A pipe can fill a tank in ${x} hours, while an outlet pipe can empty the full tank in ${y} hours. If both are opened together, how long will the empty tank take to fill?`,
    `${t} hours`, nearby(r, t, Math.max(1, Math.round(t / 6))).map((n) => `${n} hours`), `Net rate = 1/${x} − 1/${y} = ${y - x}/${x * y} per hour → time = ${x * y}/${y - x} = ${t} hours.`);
});

// 30. Direct word problems with fractions of a total
add(8, (r) => {
  const total = int(r, 4, 50) * 60;
  const [f1n, f1d] = pick(r, [[1, 3], [1, 4], [1, 5], [1, 6], [1, 2]] as [number, number][]);
  const [f2n, f2d] = pick(r, [[1, 3], [1, 4], [1, 5], [1, 6]] as [number, number][]);
  const spent1 = (total * f1n) / f1d;
  const left1 = total - spent1;
  const spent2 = (left1 * f2n) / f2d;
  const left = left1 - spent2;
  if (!Number.isInteger(spent2)) return null;
  return build(r, S, "Simplification", "Medium",
    `${pick(r, NAMES)} had ${rs(total)}. She spent ${f1n}/${f1d} of it on rent and ${f2n}/${f2d} of the remaining on food. How much is left?`,
    rs(left), nearby(r, left, Math.max(20, Math.round(left / 10))).map(rs),
    `After rent: ${ind(total)} − ${ind(spent1)} = ${ind(left1)}. Food = ${ind(spent2)}. Left = ${rs(left)}.`);
});

export function generateQuant(): BankQuestion[] {
  const out: BankQuestion[] = [];
  T.forEach((tpl, i) => out.push(...run(1000 + i * 17, COUNTS[i], tpl)));
  return out;
}

// silence unused-import lint when tree-shaking helpers
void shuffle;
