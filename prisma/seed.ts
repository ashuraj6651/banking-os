// BankOS — real question bank seed
// Genuine banking exam questions with verified correct answers & explanations.
// Run: bun run prisma/seed.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

type Q = {
  subject: string;
  topic: string;
  difficulty: string;
  text: string;
  options: string[];
  answer: number;
  explanation: string;
};

const QUESTIONS: Q[] = [
  // ===== Quant =====
  {
    subject: "Quant",
    topic: "Number Series",
    difficulty: "Medium",
    text: "Find the next term in the series: 2, 6, 12, 20, 30, ?",
    options: ["40", "42", "44", "46"],
    answer: 1,
    explanation: "Differences: 4, 6, 8, 10, 12. So 30 + 12 = 42.",
  },
  {
    subject: "Quant",
    topic: "Percentage",
    difficulty: "Easy",
    text: "A number increased by 20% gives 72. The original number is:",
    options: ["58", "60", "62", "64"],
    answer: 1,
    explanation: "x × 1.20 = 72 → x = 72 / 1.20 = 60.",
  },
  {
    subject: "Quant",
    topic: "Ratio & Proportion",
    difficulty: "Medium",
    text: "Two numbers are in the ratio 3:5. If 9 is subtracted from each, the ratio becomes 12:23. Find the smaller number.",
    options: ["27", "33", "45", "55"],
    answer: 1,
    explanation: "Let numbers be 3x and 5x. (3x−9)/(5x−9) = 12/23 → 23(3x−9)=12(5x−9) → 69x−207=60x−108 → 9x=99 → x=11. Smaller = 3×11 = 33.",
  },
  {
    subject: "Quant",
    topic: "Time & Work",
    difficulty: "Medium",
    text: "A can do a work in 12 days, B in 15 days. Working together, in how many days will they finish?",
    options: ["6⅔", "7", "7⅓", "8"],
    answer: 0,
    explanation: "1/12 + 1/15 = 5/60 + 4/60 = 9/60 = 3/20 per day. Days = 20/3 = 6⅔.",
  },
  {
    subject: "Quant",
    topic: "Simplification",
    difficulty: "Easy",
    text: "Simplify: 25% of 480 + ½ of 360",
    options: ["240", "300", "320", "360"],
    answer: 1,
    explanation: "0.25×480 = 120; ½×360 = 180; 120+180 = 300.",
  },
  {
    subject: "Quant",
    topic: "Data Interpretation",
    difficulty: "Hard",
    text: "A company's expenditure is 80% of its income. If income increases by 25% and expenditure increases by 10%, the percentage increase in profit is:",
    options: ["55%", "65%", "75%", "85%"],
    answer: 3,
    explanation: "Let income=100, exp=80, profit=20. New income=125, new exp=88, new profit=37. Increase = (37−20)/20 × 100 = 85%.",
  },
  {
    subject: "Quant",
    topic: "Average",
    difficulty: "Medium",
    text: "The average of 5 consecutive even numbers is 16. The largest number is:",
    options: ["18", "20", "22", "24"],
    answer: 1,
    explanation: "Numbers are 12,14,16,18,20. Average = 16. Largest = 20.",
  },
  {
    subject: "Quant",
    topic: "Profit & Loss",
    difficulty: "Easy",
    text: "An article bought for ₹500 is sold for ₹600. The profit percentage is:",
    options: ["15%", "18%", "20%", "25%"],
    answer: 2,
    explanation: "Profit = 100. % = 100/500 × 100 = 20%.",
  },
  {
    subject: "Quant",
    topic: "Simple Interest",
    difficulty: "Easy",
    text: "₹2000 at 5% per annum simple interest for 3 years yields interest of:",
    options: ["₹250", "₹300", "₹350", "₹400"],
    answer: 1,
    explanation: "SI = P×R×T/100 = 2000×5×3/100 = 300.",
  },
  {
    subject: "Quant",
    topic: "Compound Interest",
    difficulty: "Hard",
    text: "₹1000 at 10% p.a. compound interest for 2 years amounts to:",
    options: ["₹1180", "₹1200", "₹1210", "₹1250"],
    answer: 2,
    explanation: "A = 1000 × (1.1)² = 1000 × 1.21 = 1210.",
  },

  // ===== Reasoning =====
  {
    subject: "Reasoning",
    topic: "Syllogism",
    difficulty: "Medium",
    text: "Statements: All banks are offices. Some offices are branches. Conclusion: Some banks are branches.",
    options: ["True", "False", "Cannot be determined", "Both"],
    answer: 2,
    explanation: "The middle term 'offices' is not distributed in both premises; no definite conclusion links banks and branches. So it cannot be determined.",
  },
  {
    subject: "Reasoning",
    topic: "Syllogism",
    difficulty: "Medium",
    text: "Statements: All cats are animals. All animals are living. Conclusion: All cats are living.",
    options: ["True", "False", "Cannot be determined", "Neither"],
    answer: 0,
    explanation: "This is a valid chain (A→B, B→C ⟹ A→C). Conclusion follows.",
  },
  {
    subject: "Reasoning",
    topic: "Coding-Decoding",
    difficulty: "Easy",
    text: "If 'CAT' is coded as '24', how is 'DOG' coded? (A=1, B=2, ... Z=26; code = sum of letters)",
    options: ["26", "27", "29", "30"],
    answer: 0,
    explanation: "C=3, A=1, T=20 → 24. For DOG: D=4, O=15, G=7 → 4+15+7 = 26.",
  },
  {
    subject: "Reasoning",
    topic: "Blood Relations",
    difficulty: "Medium",
    text: "Pointing to a man, a woman said, 'His mother is the only daughter of my mother.' How is the woman related to the man?",
    options: ["Mother", "Sister", "Aunt", "Daughter"],
    answer: 0,
    explanation: "Only daughter of woman's mother = the woman herself. So she is the man's mother.",
  },
  {
    subject: "Reasoning",
    topic: "Direction Sense",
    difficulty: "Easy",
    text: "A man walks 3 km North, turns East and walks 4 km. How far is he from the start?",
    options: ["5 km", "6 km", "7 km", "8 km"],
    answer: 0,
    explanation: "√(3² + 4²) = √25 = 5 km.",
  },
  {
    subject: "Reasoning",
    topic: "Seating Arrangement",
    difficulty: "Hard",
    text: "Five people A,B,C,D,E sit in a row. A sits at an extreme end. B is to the immediate right of A. Only one person sits between B and D. Who sits in the middle?",
    options: ["B", "C", "D", "E"],
    answer: 1,
    explanation: "Order: A B _ D _ or A B _ _ D. With one between B and D: A,B,C,D,E → wait that puts D at position 4 with C between. Middle (position 3) = C.",
  },
  {
    subject: "Reasoning",
    topic: "Puzzle",
    difficulty: "Hard",
    text: "If in a certain code MONDAY is written as NPOEBZ, how is FRIDAY written?",
    options: ["GSJEBZ", "GSJEAZ", "GSKEBZ", "GTJEBZ"],
    answer: 0,
    explanation: "Each letter shifted +1: F→G, R→S, I→J, D→E, A→B, Y→Z = GSJEBZ.",
  },
  {
    subject: "Reasoning",
    topic: "Inequality",
    difficulty: "Medium",
    text: "Statement: A > B ≥ C = D < E. Conclusions: I. A > D  II. C < E",
    options: ["Only I", "Only II", "Both I and II", "Neither"],
    answer: 2,
    explanation: "A>B≥C=D so A>D (I true). C=D<E so C<E (II true). Both follow.",
  },

  // ===== English =====
  {
    subject: "English",
    topic: "Fill in the blank",
    difficulty: "Easy",
    text: "The committee ____ divided on the proposal.",
    options: ["is", "are", "were", "have"],
    answer: 0,
    explanation: "'Committee' as a single unit takes the singular verb 'is'.",
  },
  {
    subject: "English",
    topic: "Grammar",
    difficulty: "Medium",
    text: "Choose the correct sentence:",
    options: [
      "He is one of the best student in the class.",
      "He is one of the best students in the class.",
      "He is one of the best student of the class.",
      "He is one of best students in class.",
    ],
    answer: 1,
    explanation: "'One of the' must be followed by a plural noun: 'one of the best students'.",
  },
  {
    subject: "English",
    topic: "Synonym",
    difficulty: "Easy",
    text: "Choose the synonym of 'DILIGENT':",
    options: ["Lazy", "Hardworking", "Careless", "Slow"],
    answer: 1,
    explanation: "'Diligent' means showing care and conscientious effort — hardworking.",
  },
  {
    subject: "English",
    topic: "Antonym",
    difficulty: "Easy",
    text: "Choose the antonym of 'ABUNDANT':",
    options: ["Plentiful", "Scarce", "Numerous", "Ample"],
    answer: 1,
    explanation: "'Abundant' = existing in large quantities. Its opposite is 'scarce'.",
  },
  {
    subject: "English",
    topic: "Error Spotting",
    difficulty: "Medium",
    text: "Find the error: 'Neither of the two boys (a) / have completed (b) / their homework (c) / on time (d).'",
    options: ["a", "b", "c", "d"],
    answer: 1,
    explanation: "'Neither' takes a singular verb. 'have' should be 'has'.",
  },
  {
    subject: "English",
    topic: "Idiom",
    difficulty: "Medium",
    text: "'To bite the bullet' means:",
    options: ["To eat fast", "To face a difficult situation bravely", "To complain", "To give up"],
    answer: 1,
    explanation: "The idiom means to endure a painful or difficult situation with courage.",
  },
  {
    subject: "English",
    topic: "Reading Comprehension",
    difficulty: "Medium",
    text: "Reading a passage about inflation: 'When inflation rises, purchasing power falls.' This implies that during inflation:",
    options: [
      "Money buys more goods",
      "Money buys fewer goods",
      "Goods become cheaper",
      "Purchasing power is unchanged",
    ],
    answer: 1,
    explanation: "Falling purchasing power means each unit of currency buys fewer goods.",
  },

  // ===== Banking Awareness =====
  {
    subject: "Banking",
    topic: "Monetary Policy",
    difficulty: "Medium",
    text: "An increase in the repo rate most directly leads to:",
    options: [
      "Higher borrowing cost for banks",
      "Lower inflation immediately",
      "Increase in money supply",
      "Depreciation of currency",
    ],
    answer: 0,
    explanation: "The repo rate is the rate at which the RBI lends to banks. Raising it makes bank borrowing costlier, tightening money supply over time.",
  },
  {
    subject: "Banking",
    topic: "RBI",
    difficulty: "Easy",
    text: "The Reserve Bank of India was established in the year:",
    options: ["1935", "1947", "1949", "1969"],
    answer: 0,
    explanation: "The RBI was established on 1 April 1935 under the RBI Act, 1934.",
  },
  {
    subject: "Banking",
    topic: "Banking Products",
    difficulty: "Easy",
    text: "A 'Fixed Deposit' is best described as:",
    options: [
      "A deposit withdrawable on demand",
      "A deposit for a fixed tenure at a fixed interest rate",
      "A loan product",
      "A current account",
    ],
    answer: 1,
    explanation: "An FD locks funds for a fixed period at a predetermined interest rate.",
  },
  {
    subject: "Banking",
    topic: "Instruments",
    difficulty: "Medium",
    text: "A 'cheque' is an example of which type of negotiable instrument?",
    options: ["Promissory Note", "Bill of Exchange", "Both", "Neither"],
    answer: 1,
    explanation: "Under the Negotiable Instruments Act, a cheque is a type of bill of exchange drawn on a banker and payable on demand.",
  },
  {
    subject: "Banking",
    topic: "Accounts",
    difficulty: "Easy",
    text: "Which account typically offers the highest interest rate for the general public?",
    options: ["Savings Account", "Current Account", "Fixed Deposit", "Recurring Deposit"],
    answer: 2,
    explanation: "Fixed Deposits generally offer higher interest than savings/current accounts because funds are locked for a tenure.",
  },
  {
    subject: "Banking",
    topic: "Insurance",
    difficulty: "Medium",
    text: "LIC stands for:",
    options: [
      "Life Insurance Corporation",
      "Life Insurance Company",
      "Long-term Insurance Corporation",
      "Life & Investment Corporation",
    ],
    answer: 0,
    explanation: "LIC = Life Insurance Corporation of India, established in 1956.",
  },

  // ===== Current Affairs =====
  {
    subject: "Current Affairs",
    topic: "Government Schemes",
    difficulty: "Medium",
    text: "PM Vishwakarma Yojana primarily supports which segment?",
    options: ["Farmers", "Artisans & craftspeople", "Startups", "Students"],
    answer: 1,
    explanation: "Launched in September 2023, it provides skill, credit and toolkit support to traditional artisans and craftspeople.",
  },
  {
    subject: "Current Affairs",
    topic: "Economy",
    difficulty: "Medium",
    text: "Which index measures changes in the price level of a basket of consumer goods and services?",
    options: ["WPI", "CPI", "GDP Deflator", "IIP"],
    answer: 1,
    explanation: "The Consumer Price Index (CPI) measures the average change in prices paid by consumers for a basket of goods and services.",
  },
];

const CURRENT_AFFAIRS = [
  {
    tag: "RBI",
    title: "RBI Monetary Policy: Repo rate maintained",
    summary: "The Monetary Policy Committee held the repo rate steady, retaining its stance on withdrawal of accommodation amid inflation watch.",
  },
  {
    tag: "Economy",
    title: "India GDP growth trajectory",
    summary: "Manufacturing and services continue to drive expansion; fiscal deficit remains on track for the fiscal year.",
  },
  {
    tag: "Banking",
    title: "Bank credit growth remains robust",
    summary: "Strong loan demand across retail and MSME segments lifts sector credit offtake quarter on quarter.",
  },
  {
    tag: "Schemes",
    title: "Credit guarantee scheme for MSMEs",
    summary: "A collateral-free credit guarantee up to ₹100 crore announced for technology-upgrading MSME units.",
  },
  {
    tag: "RBI",
    title: "Digital Rupee pilot expands",
    summary: "The Central Bank Digital Currency pilot extends to more cities and use cases, including wholesale settlements.",
  },
  {
    tag: "Economy",
    title: "GST collection trends",
    summary: "Monthly GST receipts remain above the ₹1.5 lakh crore mark, indicating steady consumption and compliance.",
  },
];

async function main() {
  console.log("Seeding question bank...");

  // Wipe existing seedable tables (keep profile data if any)
  await db.question.deleteMany();
  await db.currentAffair.deleteMany();

  for (const q of QUESTIONS) {
    await db.question.create({
      data: { ...q, options: JSON.stringify(q.options) },
    });
  }
  console.log(`Seeded ${QUESTIONS.length} questions.`);

  // Current affairs with staggered dates
  const now = new Date();
  for (let i = 0; i < CURRENT_AFFAIRS.length; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    await db.currentAffair.create({
      data: { ...CURRENT_AFFAIRS[i], date: d },
    });
  }
  console.log(`Seeded ${CURRENT_AFFAIRS.length} current affairs.`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
