// Handwritten Reasoning questions (blood relations, syllogisms, analogies, odd-one-out, misc).
// Row: [topic, difficulty, question, CORRECT, wrong, wrong, wrong, explanation]
import { BankQuestion, Hand, fromHand } from "./core";

const SYL = ["Only conclusion I follows", "Only conclusion II follows", "Both I and II follow", "Neither I nor II follows"];
const syl = (stmts: string, c1: string, c2: string, correct: number, why: string): Hand => {
  const others = SYL.filter((_, i) => i !== correct);
  return ["Syllogism", "Medium", `Statements: ${stmts}\nConclusions:\nI. ${c1}\nII. ${c2}`, SYL[correct], others[0], others[1], others[2], why];
};
const odd = (set: string, c: string, a: string, b: string, d: string, why: string): Hand =>
  ["Odd One Out", "Easy", `Find the odd one out: ${set}`, c, a, b, d, why];
const ana = (stem: string, c: string, a: string, b: string, d: string, why: string): Hand =>
  ["Analogy", "Easy", `Choose the option that completes the analogy: ${stem}`, c, a, b, d, why];

const ROWS: Hand[] = [
  // ---- Blood relations ----
  ["Blood Relations", "Medium", "Pointing to a man, Meera said, 'He is the son of my mother's only brother.' How is the man related to Meera?", "Cousin", "Brother", "Uncle", "Nephew", "Mother's brother is Meera's maternal uncle; his son is her cousin."],
  ["Blood Relations", "Medium", "A is B's sister. C is B's mother. D is C's father. E is D's mother. How is A related to D?", "Granddaughter", "Daughter", "Great-granddaughter", "Niece", "A is C's daughter and D is C's father, so A is D's granddaughter."],
  ["Blood Relations", "Medium", "Pointing to a photograph, Ravi said, 'She is the daughter of my grandfather's only son.' How is the girl related to Ravi?", "Sister", "Cousin", "Aunt", "Niece", "Grandfather's only son is Ravi's father; his daughter is Ravi's sister."],
  ["Blood Relations", "Medium", "P is the brother of Q, Q is the sister of R, and R is the father of S. How is P related to S?", "Uncle", "Father", "Brother", "Grandfather", "P and R are siblings, so P is S's (paternal) uncle."],
  ["Blood Relations", "Easy", "Rina's mother is the sister of Mohan. How is Mohan related to Rina?", "Maternal uncle", "Father", "Cousin", "Paternal uncle", "Mohan is Rina's mother's brother, i.e. her maternal uncle."],
  ["Blood Relations", "Medium", "X is the father of Y. Y is the sister of Z. Z is the son of W. How is W related to X?", "Wife", "Sister", "Mother", "Daughter", "Y and Z are children of X; W is Z's mother, so W is X's wife."],
  ["Blood Relations", "Medium", "Ramesh is the brother of Suresh. Suresh's wife is Anita. Anita's daughter is Pooja. How is Ramesh related to Pooja?", "Uncle", "Father", "Cousin", "Grandfather", "Pooja is Suresh's daughter, so Suresh's brother Ramesh is her uncle."],
  ["Blood Relations", "Medium", "How is a man's mother's father's only son related to him?", "Maternal uncle", "Paternal uncle", "Brother", "Cousin", "Mother's father's only son = mother's brother = maternal uncle."],
  ["Blood Relations", "Hard", "Pointing to a boy, Seema said, 'He is the son of my father's only son.' How is the boy related to Seema?", "Nephew", "Cousin", "Brother", "Uncle", "Father's only son is Seema's brother; his son is her nephew."],
  ["Blood Relations", "Medium", "If A is the mother of B, B is the sister of C, and C is the father of D, how is A related to D?", "Grandmother", "Mother", "Aunt", "Sister", "A is C's mother; C is D's father, so A is D's paternal grandmother."],
  ["Blood Relations", "Hard", "A woman introduces a man as the son of the brother of her mother. How is the man related to the woman?", "Cousin", "Brother", "Nephew", "Uncle", "Mother's brother's son is the woman's maternal cousin."],
  // ---- Syllogisms ----
  syl("All cats are dogs. All dogs are birds.", "All cats are birds.", "All birds are cats.", 0, "Cats ⊂ dogs ⊂ birds, so I follows; the converse does not."),
  syl("Some pens are books. All books are tables.", "Some pens are tables.", "All tables are books.", 0, "The pens that are books are tables, so I follows; II is the illegal converse."),
  syl("No fruit is a vegetable. All apples are fruits.", "No apple is a vegetable.", "Some vegetables are apples.", 0, "Apples ⊂ fruits and fruits and vegetables are disjoint, so I follows and II contradicts."),
  syl("Some doctors are teachers. Some teachers are engineers.", "Some doctors are engineers.", "Some engineers are teachers.", 1, "Two particular statements give no conclusion; II is the converse of the second statement."),
  syl("All roses are flowers. Some flowers are red.", "Some roses are red.", "All flowers are roses.", 3, "Particular + universal in this order gives no definite conclusion."),
  syl("All bats are balls. No ball is a net.", "No bat is a net.", "Some nets are bats.", 0, "Bats ⊂ balls and balls are disjoint from nets, so I follows; II contradicts it."),
  syl("Some A are B. All B are C.", "Some A are C.", "Some C are A.", 2, "Some A are B ⊂ C gives I; its converse gives II."),
  syl("Some cars are buses. No bus is a truck.", "Some cars are not trucks.", "No car is a truck.", 0, "Those cars that are buses are not trucks, so I follows; II is too general."),
  syl("All pencils are pens. Some pens are erasers.", "Some pencils are erasers.", "Some erasers are pens.", 1, "II is the converse of 'Some pens are erasers'; I cannot be derived."),
  // ---- Odd one out ----
  odd("Apple, Mango, Banana, Potato", "Potato", "Apple", "Mango", "Banana", "Potato is a vegetable; the others are fruits."),
  odd("Cheque, Draft, Pay order, Passbook", "Passbook", "Cheque", "Draft", "Pay order", "Cheque, draft and pay order are payment instruments; a passbook records transactions."),
  odd("3, 5, 7, 9", "9", "3", "5", "7", "3, 5 and 7 are prime; 9 is not."),
  odd("Mumbai, Chennai, Kolkata, Jaipur", "Jaipur", "Mumbai", "Chennai", "Kolkata", "The others are coastal port cities; Jaipur is landlocked."),
  odd("SBI, PNB, HDFC Bank, Canara Bank", "HDFC Bank", "SBI", "PNB", "Canara Bank", "HDFC Bank is a private-sector bank; the others are public-sector banks."),
  odd("16, 25, 36, 48", "48", "16", "25", "36", "16, 25 and 36 are perfect squares."),
  odd("January, March, May, June", "June", "January", "March", "May", "June has 30 days; the others have 31."),
  odd("Repo rate, CRR, SLR, Debit card", "Debit card", "Repo rate", "CRR", "SLR", "The others are monetary policy tools."),
  // ---- Analogies ----
  ana("Doctor : Hospital :: Teacher : ?", "School", "Book", "Student", "Chalk", "A doctor works in a hospital; a teacher works in a school."),
  ana("Knife : Cut :: Pen : ?", "Write", "Ink", "Paper", "Draw", "A knife is used to cut; a pen is used to write."),
  ana("Hot : Cold :: Day : ?", "Night", "Sun", "Light", "Morning", "Opposites."),
  ana("Bird : Nest :: Bee : ?", "Hive", "Honey", "Flower", "Sting", "A bee lives in a hive."),
  ana("Foot : Shoe :: Hand : ?", "Glove", "Finger", "Sleeve", "Ring", "Shoes cover the foot; gloves cover the hand."),
  ana("Captain : Ship :: Pilot : ?", "Aeroplane", "Airport", "Sky", "Passenger", "A captain commands a ship; a pilot flies an aeroplane."),
  ana("3 : 27 :: 4 : ?", "64", "16", "48", "81", "3³ = 27, so 4³ = 64."),
  ana("5 : 30 :: 7 : ?", "56", "49", "42", "63", "5 × 6 = 30, so 7 × 8 = 56."),
  ana("AZ : BY :: CX : ?", "DW", "DV", "EW", "CW", "First letter moves forward, second moves backward: D, W."),
  ana("ACE : BDF :: GIK : ?", "HJL", "HIL", "HJK", "IJL", "Each letter moves one step forward."),
  // ---- Misc logic ----
  ["Ranking & Order", "Medium", "Five friends A, B, C, D and E: A is taller than B but shorter than C. D is taller than C. E is the shortest. Who is the tallest?", "D", "C", "A", "E", "Order: D > C > A > B > E, so D is the tallest."],
  ["Ranking & Order", "Medium", "Five friends A, B, C, D and E: A is taller than B but shorter than C. D is taller than C. E is the shortest. Who is the second tallest?", "C", "A", "D", "B", "Order: D > C > A > B > E."],
  ["Mathematical Operations", "Medium", "If P means '+', Q means '−', R means '×' and S means '÷', what is the value of 12 R 4 P 20 S 5 Q 3?", "49", "45", "53", "57", "12 × 4 + 20 ÷ 5 − 3 = 48 + 4 − 3 = 49."],
  ["Direction Sense", "Medium", "A man facing south turns 90° to his left and then 135° clockwise. In which direction is he facing now?", "South-West", "North-East", "South-East", "North-West", "South → left 90° = East → 135° clockwise from East = South-West."],
  ["Direction Sense", "Easy", "Facing North, Rohan turns 90° clockwise and then 180° anticlockwise. Which direction is he facing?", "West", "East", "South", "North", "North → East (90° clockwise) → West (180° anticlockwise)."],
  ["Cubes", "Hard", "A cube painted on all faces is cut into 27 equal small cubes. How many small cubes have exactly two faces painted?", "12", "8", "6", "1", "Edge cubes (one per edge) have two painted faces: 12 edges × 1 = 12."],
  ["Cubes", "Hard", "A cube painted on all faces is cut into 64 equal small cubes. How many small cubes have exactly one face painted?", "24", "8", "12", "36", "Each face has (4 − 2)² = 4 such cubes; 6 × 4 = 24."],
  ["Cubes", "Hard", "A cube painted on all faces is cut into 125 equal small cubes. How many small cubes have no face painted?", "27", "9", "36", "64", "Inner cube = (5 − 2)³ = 27."],
  ["Puzzle", "Medium", "In a certain code, 'MONEY' is written as 'NPOFZ'. How is 'CASH' written in that code?", "DBTI", "BZRG", "DCTI", "EBUJ", "Each letter is moved one place forward: C→D, A→B, S→T, H→I."],
  ["Puzzle", "Medium", "Which number should come next: 2, 3, 5, 7, 11, 13, ?", "17", "15", "19", "21", "These are consecutive prime numbers; the next prime after 13 is 17."],
];

export const REASONING_BANK: BankQuestion[] = fromHand("Reasoning", ROWS);
void SYL;
