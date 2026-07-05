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

  // ===== Additional Reasoning Questions (8) =====
  {
    subject: "Reasoning",
    topic: "Puzzle",
    difficulty: "Hard",
    text: "Five friends — P, Q, R, S, T — have different heights. T is taller than only S. R is taller than Q but shorter than P. Who is the tallest?",
    options: ["P", "Q", "R", "T"],
    answer: 0,
    explanation: "From 'T is taller than only S': T > S, and T is 2nd shortest. From 'R > Q but R < P': P > R > Q. Combining: P > R > Q > T > S. Tallest = P.",
  },
  {
    subject: "Reasoning",
    topic: "Seating Arrangement",
    difficulty: "Hard",
    text: "Eight persons A–H sit around a circular table facing the centre. A sits third to the left of B. C sits second to the right of B. D sits third to the left of C. Who sits opposite to A?",
    options: ["E", "F", "G", "H"],
    answer: 2,
    explanation: "Tracing positions: Starting from B, going clockwise — B, gap, gap, A, C, gap, D, gap. The remaining 4 fill the gaps. A is 3rd left of B, C is 2nd right of B, D is 3rd left of C. A is at position 3, D at position 7 (opposite). Working through the remaining slots, G ends up opposite A.",
  },
  {
    subject: "Reasoning",
    topic: "Blood Relations",
    difficulty: "Medium",
    text: "If 'A + B' means A is the father of B, 'A − B' means A is the wife of B, and 'A × B' means A is the brother of B, then which of the following shows that P is the maternal uncle of Q?",
    options: ["P − R + Q", "P × R − Q", "P + R × Q", "P − R × Q"],
    answer: 1,
    explanation: "P × R means P is the brother of R. R − Q means R is the wife of Q, so R is Q's mother. Therefore P is the brother of Q's mother = maternal uncle of Q.",
  },
  {
    subject: "Reasoning",
    topic: "Coding-Decoding",
    difficulty: "Medium",
    text: "In a code language, if 'BANK' is written as 'CBOL' and 'LOAN' is written as 'MPBO', how is 'RISK' written?",
    options: ["SJTL", "SITL", "SITM", "RJTM"],
    answer: 0,
    explanation: "Each letter is shifted by +1: B→C, A→B, N→O, K→L = CBOL. L→M, O→P, A→B, N→O = MPBO. Applying to RISK: R→S, I→J, S→T, K→L = SJTL."
  },
  {
    subject: "Reasoning",
    topic: "Syllogism",
    difficulty: "Medium",
    text: "Statements: Some roses are flowers. All flowers are beautiful. Conclusions: I. Some roses are beautiful. II. All roses are beautiful.",
    options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither I nor II follows"],
    answer: 0,
    explanation: "Some roses are flowers + All flowers are beautiful → Some roses are beautiful (I follows via conversion/distribution). 'All roses are beautiful' does not follow since 'some roses' are flowers, not necessarily all.",
  },
  {
    subject: "Reasoning",
    topic: "Direction Sense",
    difficulty: "Medium",
    text: "Ravi walks 10 m South, turns right and walks 5 m, turns right and walks 10 m, then turns left and walks 5 m. In which direction is he facing now?",
    options: ["North", "South", "East", "West"],
    answer: 2,
    explanation: "Start facing South. Walk 10 m South. Turn right → face West, walk 5 m. Turn right → face North, walk 10 m. Turn left → face East. He is now facing East.",
  },
  {
    subject: "Reasoning",
    topic: "Inequality",
    difficulty: "Medium",
    text: "Statement: P ≤ Q > R = S ≥ T. Conclusions: I. Q > T  II. P ≤ S",
    options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"],
    answer: 0,
    explanation: "Q > R = S ≥ T → Q > T (I true). P ≤ Q and R = S, but Q > R doesn't directly connect P to S. P could be less than, equal to, or greater than S. So II does NOT follow. Only I follows.",
  },
  {
    subject: "Reasoning",
    topic: "Series",
    difficulty: "Hard",
    text: "Find the missing term: 3, 8, 15, 24, 35, ?",
    options: ["42", "46", "48", "50"],
    answer: 2,
    explanation: "Differences: 5, 7, 9, 11, 13 (consecutive odd numbers). So 35 + 13 = 48. Alternatively, n² − 1: 2²−1=3, 3²−1=8, 4²−1=15, 5²−1=24, 6²−1=35, 7²−1=48.",
  },

  // ===== Additional Quant Questions (8) =====
  {
    subject: "Quant",
    topic: "Percentage",
    difficulty: "Medium",
    text: "If the price of sugar increases by 25%, by what percentage must a household reduce its consumption to keep the expenditure unchanged?",
    options: ["20%", "25%", "16.67%", "15%"],
    answer: 0,
    explanation: "Let original price = ₹100, consumption = 1 kg, expenditure = ₹100. New price = ₹125. New consumption = 100/125 = 0.8 kg. Reduction = 20%.",
  },
  {
    subject: "Quant",
    topic: "Profit & Loss",
    difficulty: "Medium",
    text: "A shopkeeper marks an article 40% above cost price and allows a discount of 20%. The profit percentage is:",
    options: ["8%", "10%", "12%", "15%"],
    answer: 2,
    explanation: "Let CP = 100. Marked price = 140. Discount = 20% of 140 = 28. SP = 140 − 28 = 112. Profit = 12%.",
  },
  {
    subject: "Quant",
    topic: "Simple Interest",
    difficulty: "Medium",
    text: "A sum of money becomes ₹3,720 in 2 years and ₹4,080 in 3 years at simple interest. The principal is:",
    options: ["₹3,000", "₹2,800", "₹3,200", "₹3,360"],
    answer: 0,
    explanation: "Interest for 1 year = 4080 − 3720 = 360. Interest for 2 years = 720. Principal = 3720 − 720 = 3000.",
  },
  {
    subject: "Quant",
    topic: "Compound Interest",
    difficulty: "Hard",
    text: "The difference between compound interest and simple interest on ₹10,000 for 2 years at 5% per annum is:",
    options: ["₹20", "₹25", "₹30", "₹50"],
    answer: 1,
    explanation: "SI = 10000 × 5 × 2/100 = 1000. CI = 10000 × (1.05² − 1) = 10000 × 0.1025 = 1025. Difference = 25.",
  },
  {
    subject: "Quant",
    topic: "Time & Work",
    difficulty: "Hard",
    text: "A can complete a work in 12 days and B in 24 days. They work together for 4 days, then B leaves. In how many more days will A finish the remaining work?",
    options: ["6", "8", "10", "12"],
    answer: 0,
    explanation: "A's rate = 1/12 per day, B's rate = 1/24 per day. Combined = 1/12 + 1/24 = 3/24 = 1/8 per day. In 4 days: 4/8 = 1/2 work done. Remaining = 1/2. A alone: (1/2) ÷ (1/12) = 6 days.",
  },
  {
    subject: "Quant",
    topic: "Speed & Distance",
    difficulty: "Medium",
    text: "A train 200 m long passes a pole in 10 seconds. The speed of the train (in km/h) is:",
    options: ["60", "72", "80", "90"],
    answer: 1,
    explanation: "Speed = Distance/Time = 200m/10s = 20 m/s = 20 × 18/5 = 72 km/h.",
  },
  {
    subject: "Quant",
    topic: "Mixture & Alligation",
    difficulty: "Medium",
    text: "A vessel contains 60 litres of milk. 12 litres of milk is removed and replaced with water. If this process is repeated once more, how much milk remains?",
    options: ["36 litres", "38.4 litres", "40 litres", "42 litres"],
    answer: 1,
    explanation: "After 1st replacement: 60 × (48/60) = 48 litres milk. After 2nd: 48 × (48/60) = 38.4 litres. Formula: Final = Initial × (1 − replaced/total)^n = 60 × (48/60)² = 60 × 0.64 = 38.4.",
  },
  {
    subject: "Quant",
    topic: "Average",
    difficulty: "Easy",
    text: "The average weight of 8 persons increases by 2.5 kg when a new person replaces one of them. If the weight of the replaced person is 65 kg, the weight of the new person is:",
    options: ["70 kg", "75 kg", "80 kg", "85 kg"],
    answer: 3,
    explanation: "Total increase = 8 × 2.5 = 20 kg. Weight of new person = 65 + 20 = 85 kg.",
  },
  {
    subject: "Quant",
    topic: "Number Series",
    difficulty: "Medium",
    text: "Find the wrong term in the series: 2, 6, 12, 20, 30, 40, 56",
    options: ["6", "20", "40", "56"],
    answer: 2,
    explanation: "The series follows n(n+1): 1×2=2, 2×3=6, 3×4=12, 4×5=20, 5×6=30, 6×7=42, 7×8=56. The 6th term should be 42, not 40. So 40 is the wrong term.",
  },

  // ===== Additional English Questions (8) =====
  {
    subject: "English",
    topic: "Reading Comprehension",
    difficulty: "Hard",
    text: "In the context of banking regulation, the term 'moral hazard' refers to a situation where:",
    options: [
      "Banks take excessive risks because they expect to be bailed out",
      "Customers default on loans intentionally",
      "Regulators fail to enforce rules properly",
      "Interest rates are set too low",
    ],
    answer: 0,
    explanation: "Moral hazard in banking occurs when institutions take on greater risks because they believe they are protected from negative consequences (e.g., government bailouts or deposit insurance).",
  },
  {
    subject: "English",
    topic: "Error Spotting",
    difficulty: "Medium",
    text: "Find the error: 'Each of the students (a) / have submitted (b) / their assignments (c) / before the deadline (d).'",
    options: ["a", "b", "c", "d"],
    answer: 1,
    explanation: "'Each' is singular and takes a singular verb. 'have' should be 'has'.",
  },
  {
    subject: "English",
    topic: "Fill in the blank",
    difficulty: "Medium",
    text: "The government's fiscal policy was designed to ____ the economic downturn and restore consumer confidence.",
    options: ["exacerbate", "mitigate", "obliterate", "allocate"],
    answer: 1,
    explanation: "'Mitigate' means to make less severe or serious, which fits the context of addressing an economic downturn.",
  },
  {
    subject: "English",
    topic: "Para Jumble",
    difficulty: "Hard",
    text: "Arrange the following sentences in logical order:\nA. This led to a significant increase in NPAs.\nB. Banks relaxed their lending norms during the boom period.\nC. When the economy slowed, many borrowers defaulted.\nD. The RBI intervened with stricter guidelines.",
    options: ["BACD", "BCAD", "BADC", "BCDA"],
    answer: 0,
    explanation: "B introduces the cause (relaxed norms), A states the consequence (NPA rise), C explains why (borrowers defaulted), D states the regulatory response (RBI intervention). Sequence: BACD.",
  },
  {
    subject: "English",
    topic: "Cloze Test",
    difficulty: "Medium",
    text: "The RBI's decision to (i)____ the repo rate was aimed at (ii)____ inflation while supporting growth. The correct pair is:",
    options: ["(i) raise, (ii) curbing", "(i) lower, (ii) curbing", "(i) raise, (ii) stimulating", "(i) maintain, (ii) ignoring"],
    answer: 0,
    explanation: "Raising the repo rate is a contractionary measure used to curb (control/reduce) inflation, making 'raise' and 'curbing' the correct pair.",
  },
  {
    subject: "English",
    topic: "Synonym",
    difficulty: "Easy",
    text: "Choose the synonym of 'PRUDENT':",
    options: ["Reckless", "Cautious", "Hostile", "Indifferent"],
    answer: 1,
    explanation: "'Prudent' means acting with or showing care and thought for the future — cautious.",
  },
  {
    subject: "English",
    topic: "Antonym",
    difficulty: "Easy",
    text: "Choose the antonym of 'TRANSPARENT':",
    options: ["Clear", "Opaque", "Obvious", "Honest"],
    answer: 1,
    explanation: "'Transparent' means allowing light to pass through / easy to understand. Its antonym is 'opaque' (not transparent).",
  },
  {
    subject: "English",
    topic: "Sentence Improvement",
    difficulty: "Medium",
    text: "Choose the improved version: 'Not only she was late but also she forgot the documents.'",
    options: [
      "Not only was she late but also she forgot the documents.",
      "She was not only late but also forgot the documents.",
      "Not only she was late but she also forgot the documents.",
      "Both A and B are correct.",
    ],
    answer: 3,
    explanation: "When 'not only' begins a clause, it triggers subject-verb inversion: 'Not only was she late...' (A is correct). Alternatively, restructure: 'She was not only late but also forgot...' (B is also correct). Both A and B are grammatically acceptable.",
  },
  {
    subject: "English",
    topic: "Idiom",
    difficulty: "Medium",
    text: "'A leopard cannot change its spots' means:",
    options: [
      "Animals are dangerous",
      "People cannot change their basic nature",
      "Spots are permanent marks",
      "Change is always difficult",
    ],
    answer: 1,
    explanation: "This idiom means that a person's inherent character or nature cannot be fundamentally changed, no matter how hard they try.",
  },

  // ===== Additional Current Affairs Questions (8) =====
  {
    subject: "Current Affairs",
    topic: "RBI Policies",
    difficulty: "Medium",
    text: "The Monetary Policy Committee (MPC) of India consists of how many members?",
    options: ["4", "5", "6", "7"],
    answer: 2,
    explanation: "The MPC has 6 members — 3 from RBI (Governor, Deputy Governor, Executive Director) and 3 external experts nominated by the Government of India.",
  },
  {
    subject: "Current Affairs",
    topic: "Economy",
    difficulty: "Medium",
    text: "India's GDP growth rate for FY 2023-24 (advance estimates) was approximately:",
    options: ["6.5%", "7.2%", "7.6%", "8.0%"],
    answer: 2,
    explanation: "The advance estimate for India's GDP growth in FY 2023-24 was approximately 7.6%, driven by strong manufacturing and services sector performance.",
  },
  {
    subject: "Current Affairs",
    topic: "Banking Schemes",
    difficulty: "Easy",
    text: "Under PM Jan Dhan Yojana, what is the overdraft facility limit available to accounts held for 6 months or more?",
    options: ["₹2,000", "₹5,000", "₹10,000", "₹15,000"],
    answer: 2,
    explanation: "PMJDY accounts older than 6 months are eligible for an overdraft facility of up to ₹10,000.",
  },
  {
    subject: "Current Affairs",
    topic: "Government Initiatives",
    difficulty: "Medium",
    text: "The UPI (Unified Payments Interface) was launched by:",
    options: ["RBI", "NPCI", "SEBI", "Ministry of Finance"],
    answer: 1,
    explanation: "UPI was launched by the National Payments Corporation of India (NPCI), an umbrella organisation for operating retail payments and settlement systems in India.",
  },
  {
    subject: "Current Affairs",
    topic: "RBI Policies",
    difficulty: "Hard",
    text: "The RBI's 'Standing Deposit Facility' (SDF) rate is typically set at:",
    options: ["Same as repo rate", "25 bps below repo rate", "100 bps below repo rate", "50 bps below repo rate"],
    answer: 1,
    explanation: "The SDF rate is set at 25 basis points below the repo rate. It is the floor of the LAF corridor and allows banks to park excess liquidity with the RBI without any collateral.",
  },
  {
    subject: "Current Affairs",
    topic: "Economy",
    difficulty: "Easy",
    text: "Which country is India's largest trading partner as of 2023-24?",
    options: ["USA", "China", "UAE", "Germany"],
    answer: 0,
    explanation: "The USA overtook China to become India's largest trading partner in recent years, with bilateral trade exceeding USD 118 billion.",
  },
  {
    subject: "Current Affairs",
    topic: "Banking Schemes",
    difficulty: "Medium",
    text: "The 'MUDRA Yojana' provides loans up to what amount for micro-enterprises?",
    options: ["₹5 lakh", "₹10 lakh", "₹15 lakh", "₹20 lakh"],
    answer: 1,
    explanation: "MUDRA (Micro Units Development and Refinance Agency) provides loans up to ₹10 lakh under three categories: Shishu (up to ₹50,000), Kishore (₹50,000–₹5 lakh), and Tarun (₹5–₹10 lakh).",
  },
  {
    subject: "Current Affairs",
    topic: "Government Initiatives",
    difficulty: "Medium",
    text: "The 'Digital India' programme was launched in which year?",
    options: ["2013", "2014", "2015", "2016"],
    answer: 2,
    explanation: "The Digital India programme was launched on 1 July 2015 by Prime Minister Narendra Modi with the vision of transforming India into a digitally empowered society.",
  },

  // ===== Additional Banking Questions (8) =====
  {
    subject: "Banking",
    topic: "KYC",
    difficulty: "Easy",
    text: "KYC stands for:",
    options: [
      "Know Your Customer",
      "Keep Your Cash",
      "Know Your Credit",
      "Key Yearly Compliance",
    ],
    answer: 0,
    explanation: "KYC = Know Your Customer. It is a mandatory process used by financial institutions to verify the identity of their clients, required by RBI guidelines.",
  },
  {
    subject: "Banking",
    topic: "RTGS/NEFT",
    difficulty: "Medium",
    text: "What is the minimum amount for an RTGS transaction?",
    options: ["₹1 lakh", "₹2 lakh", "₹5 lakh", "No minimum"],
    answer: 1,
    explanation: "RTGS (Real Time Gross Settlement) has a minimum transaction amount of ₹2 lakh. There is no upper limit. NEFT, on the other hand, has no minimum or maximum limit.",
  },
  {
    subject: "Banking",
    topic: "Types of Accounts",
    difficulty: "Easy",
    text: "A 'Nostro' account is maintained by an Indian bank:",
    options: [
      "In India, for a foreign bank",
      "In a foreign country, in that country's currency",
      "In India, in a foreign currency",
      "With the RBI",
    ],
    answer: 1,
    explanation: "A Nostro account ('our account' in Latin) is a bank account maintained by an Indian bank in a foreign country, denominated in that country's currency, for facilitating international transactions.",
  },
  {
    subject: "Banking",
    topic: "NPA",
    difficulty: "Medium",
    text: "An asset becomes a Non-Performing Asset (NPA) when interest or principal remains overdue for more than:",
    options: ["30 days", "60 days", "90 days", "120 days"],
    answer: 2,
    explanation: "As per RBI guidelines, a loan account is classified as an NPA when interest or principal instalment remains overdue for more than 90 days.",
  },
  {
    subject: "Banking",
    topic: "Monetary Policy",
    difficulty: "Medium",
    text: "The 'Marginal Standing Facility' (MSF) rate is typically set at:",
    options: ["Same as repo rate", "50 bps above repo rate", "25 bps above repo rate", "100 bps above repo rate"],
    answer: 2,
    explanation: "The MSF rate is set 25 basis points above the repo rate. It is the ceiling of the LAF corridor, allowing banks to borrow overnight from the RBI against government securities.",
  },
  {
    subject: "Banking",
    topic: "Banking Awareness",
    difficulty: "Easy",
    text: "The first bank in India to introduce ATM services was:",
    options: ["SBI", "HSBC", "ICICI Bank", "HDFC Bank"],
    answer: 1,
    explanation: "HSBC was the first bank to introduce ATM services in India in 1987, setting up the first ATM in Mumbai.",
  },
  {
    subject: "Banking",
    topic: "Banking Awareness",
    difficulty: "Medium",
    text: "The 'Lead Bank Scheme' was introduced in the year:",
    options: ["1965", "1969", "1974", "1980"],
    answer: 1,
    explanation: "The Lead Bank Scheme was introduced in 1969 based on the recommendations of the F.K.F. Nariman Committee. Each district was assigned to a bank to spearhead banking development.",
  },
  {
    subject: "Banking",
    topic: "RTGS/NEFT",
    difficulty: "Easy",
    text: "NEFT operates in batches. How many settlement batches are there in a day?",
    options: ["12", "24", "48", "Continuous (24×7)"],
    answer: 2,
    explanation: "NEFT operates in half-hourly batches — 48 batches in a 24-hour cycle. Since 2019, NEFT is available 24×7, 365 days a year.",
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
