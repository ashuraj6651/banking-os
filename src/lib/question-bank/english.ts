// Handwritten English questions. Row format: [topic, difficulty, question, CORRECT, wrong, wrong, wrong, explanation]
// (the correct option is always written first; options are shuffled deterministically at load time)
import { BankQuestion, Hand, fromHand } from "./core";

const syn = (w: string, c: string, a: string, b: string, d: string): Hand =>
  ["Synonyms", "Medium", `Choose the word closest in meaning to '${w}'.`, c, a, b, d, `'${w}' means ${c.toLowerCase()}.`];
const ant = (w: string, c: string, a: string, b: string, d: string): Hand =>
  ["Antonyms", "Medium", `Choose the word opposite in meaning to '${w}'.`, c, a, b, d, `The opposite of '${w}' is '${c}'.`];
const fill = (s: string, c: string, a: string, b: string, d: string, e: string): Hand =>
  ["Fill in the Blanks", "Easy", `Fill in the blank: ${s}`, c, a, b, d, e];
let gramN = 0;
const gram = (c: string, a: string, b: string, d: string, e: string): Hand =>
  ["Error Spotting", "Medium", `Grammar check #${++gramN}: choose the grammatically correct sentence.`, c, a, b, d, e];
const idiom = (i: string, c: string, a: string, b: string, d: string): Hand =>
  ["Idioms & Phrases", "Medium", `What does the idiom '${i}' mean?`, c, a, b, d, `'${i}' means: ${c.toLowerCase()}.`];
const ows = (def: string, c: string, a: string, b: string, d: string): Hand =>
  ["One-word Substitution", "Medium", `One word for: ${def}`, c, a, b, d, `${c} — ${def.toLowerCase()}.`];
let spellN = 0;
const spell = (c: string, a: string, b: string, d: string): Hand =>
  ["Spelling", "Easy", `Spelling check #${++spellN}: choose the correctly spelt word.`, c, a, b, d, `The correct spelling is '${c}'.`];

const ROWS: Hand[] = [
  // ---- Synonyms ----
  syn("ABUNDANT", "Plentiful", "Scarce", "Meagre", "Rare"),
  syn("CANDID", "Frank", "Deceitful", "Secretive", "Hostile"),
  syn("METICULOUS", "Painstaking", "Careless", "Lazy", "Hasty"),
  syn("BENEVOLENT", "Kind", "Cruel", "Selfish", "Greedy"),
  syn("FRUGAL", "Thrifty", "Wasteful", "Lavish", "Careless"),
  syn("OBSOLETE", "Outdated", "Modern", "Current", "Novel"),
  syn("DILIGENT", "Hardworking", "Idle", "Careless", "Lazy"),
  syn("ELOQUENT", "Articulate", "Mute", "Hesitant", "Dull"),
  syn("AMBIGUOUS", "Unclear", "Obvious", "Precise", "Definite"),
  syn("ARDUOUS", "Difficult", "Easy", "Simple", "Pleasant"),
  syn("TRANQUIL", "Peaceful", "Noisy", "Turbulent", "Chaotic"),
  syn("VIGILANT", "Watchful", "Careless", "Sleepy", "Ignorant"),
  syn("CONCISE", "Brief", "Lengthy", "Wordy", "Vague"),
  syn("PRUDENT", "Cautious", "Reckless", "Careless", "Foolish"),
  syn("HINDER", "Obstruct", "Assist", "Help", "Promote"),
  syn("ENORMOUS", "Huge", "Tiny", "Modest", "Slight"),
  syn("DECLINE", "Decrease", "Increase", "Rise", "Expand"),
  syn("COMMENCE", "Begin", "End", "Finish", "Conclude"),
  // ---- Antonyms ----
  ant("EXPAND", "Contract", "Enlarge", "Grow", "Stretch"),
  ant("ANCIENT", "Modern", "Old", "Archaic", "Antique"),
  ant("GENEROUS", "Stingy", "Kind", "Liberal", "Charitable"),
  ant("VICTORY", "Defeat", "Success", "Triumph", "Win"),
  ant("TRANSPARENT", "Opaque", "Clear", "Lucid", "Visible"),
  ant("ARTIFICIAL", "Natural", "Fake", "Synthetic", "Man-made"),
  ant("ACCEPT", "Reject", "Receive", "Admit", "Agree"),
  ant("OPTIMISTIC", "Pessimistic", "Hopeful", "Cheerful", "Confident"),
  ant("SCARCE", "Plentiful", "Rare", "Limited", "Meagre"),
  ant("ENCOURAGE", "Discourage", "Support", "Inspire", "Motivate"),
  ant("TEMPORARY", "Permanent", "Brief", "Short-lived", "Fleeting"),
  ant("HUMBLE", "Arrogant", "Modest", "Meek", "Polite"),
  ant("ASCEND", "Descend", "Climb", "Rise", "Mount"),
  ant("CONCEAL", "Reveal", "Hide", "Cover", "Bury"),
  // ---- Fill in the blanks ----
  fill("She has been working here ___ 2015.", "since", "for", "from", "by", "'Since' is used with a fixed point in time (2015)."),
  fill("Neither the manager nor the employees ___ present at the meeting.", "were", "was", "is", "has been", "With 'neither … nor', the verb agrees with the nearer subject ('employees', plural)."),
  fill("He is senior ___ me by two years.", "to", "than", "from", "with", "'Senior' takes the preposition 'to'."),
  fill("I look forward ___ meeting you.", "to", "for", "at", "with", "'Look forward to' is followed by a gerund."),
  fill("Each of the students ___ given a certificate.", "was", "were", "are", "have been", "'Each' takes a singular verb."),
  fill("If I ___ you, I would accept the offer.", "were", "am", "was", "will be", "Unreal conditions use 'were' for all subjects."),
  fill("The teacher congratulated him ___ his success.", "on", "for", "at", "with", "We congratulate someone 'on' an achievement."),
  fill("She is good ___ mathematics.", "at", "in", "on", "for", "The correct collocation is 'good at'."),
  fill("He prevented me ___ making a mistake.", "from", "to", "of", "against", "'Prevent … from' is the correct structure."),
  fill("By the time we reached the station, the train ___.", "had left", "has left", "left", "leaves", "Past perfect shows the earlier of two past actions."),
  fill("The news ___ true.", "is", "are", "were", "have been", "'News' is an uncountable noun and takes a singular verb."),
  fill("He insisted ___ paying the bill.", "on", "to", "for", "at", "'Insist on' is followed by a gerund."),
  fill("Hardly had he reached the station ___ the train departed.", "when", "than", "then", "as", "'Hardly … when' is the correct correlative pair."),
  fill("One of my friends ___ a banker.", "is", "are", "were", "have", "'One of' takes a singular verb."),
  fill("I would rather ___ at home than go out.", "stay", "stayed", "staying", "to stay", "'Would rather' is followed by the base form of the verb."),
  fill("She is the ___ of the two sisters.", "taller", "tallest", "more tall", "most tall", "Comparative is used when comparing two."),
  fill("The bank manager, along with his staff, ___ attending the seminar.", "is", "are", "were", "have been", "The verb agrees with the main subject 'manager' (singular); 'along with' does not make it plural."),
  fill("We have been waiting for you ___ two hours.", "for", "since", "from", "by", "'For' is used with a period of time."),
  fill("The customer complained ___ the poor service.", "about", "on", "to", "from", "We complain 'about' something."),
  fill("He is fond ___ playing cricket.", "of", "for", "in", "at", "'Fond of' is the correct collocation."),
  // ---- Grammar: correct sentence ----
  gram("She doesn't like coffee.", "She don't like coffee.", "She not like coffee.", "She doesn't likes coffee.", "With a third-person singular subject, use 'doesn't' + base verb."),
  gram("The furniture in the room is expensive.", "The furniture in the room are expensive.", "The furnitures in the room is expensive.", "The furnitures in the room are expensive.", "'Furniture' is uncountable and singular."),
  gram("He has been living here for ten years.", "He has been living here since ten years.", "He has been living here from ten years.", "He has been living here for ten year.", "'For' + a period of time."),
  gram("Each of the boys has finished his work.", "Each of the boys have finished his work.", "Each of the boy has finished his work.", "Each of the boys are finished his work.", "'Each' takes a singular verb."),
  gram("I have never seen such a beautiful place.", "I have never saw such a beautiful place.", "I never have saw such a beautiful place.", "I has never seen such a beautiful place.", "Present perfect: have + past participle (seen)."),
  gram("The number of applicants is increasing.", "The number of applicants are increasing.", "The numbers of applicants is increasing.", "The number of applicant are increasing.", "'The number of' takes a singular verb."),
  gram("Many a student has failed in this test.", "Many a student have failed in this test.", "Many a students has failed in this test.", "Many a students have failed in this test.", "'Many a' is followed by a singular noun and a singular verb."),
  gram("Mathematics is my favourite subject.", "Mathematics are my favourite subject.", "Mathematic is my favourite subject.", "Mathematics were my favourite subject.", "Names of subjects ending in -s take a singular verb."),
  gram("Had I known, I would have told you.", "If I would have known, I would have told you.", "Had I knew, I would have told you.", "If I had know, I would have told you.", "Third conditional inversion: 'Had + subject + past participle'."),
  gram("The police have arrested the thief.", "The police has arrested the thief.", "The polices have arrested the thief.", "The police is arresting the thief yesterday.", "'Police' is a plural noun."),
  gram("Please lend me your pen.", "Please borrow me your pen.", "Please loan me you pen.", "Please lend me you pen.", "'Lend' means to give temporarily; 'borrow' means to take."),
  gram("I prefer tea to coffee.", "I prefer tea than coffee.", "I prefer tea from coffee.", "I prefer tea over than coffee.", "'Prefer' is followed by 'to'."),
  gram("The scenery of Kashmir is beautiful.", "The sceneries of Kashmir are beautiful.", "The sceneries of Kashmir is beautiful.", "The scenery of Kashmir are beautiful.", "'Scenery' is uncountable."),
  gram("She gave me some advice.", "She gave me some advices.", "She gave me an advice.", "She gave me many advices.", "'Advice' is an uncountable noun."),
  // ---- Voice & speech ----
  ["Active & Passive Voice", "Medium", "Change into passive voice: 'The manager approved the loan.'", "The loan was approved by the manager.", "The loan is approved by the manager.", "The loan were approved by the manager.", "The manager was approved by the loan.", "Simple past active → 'was/were + past participle'."],
  ["Active & Passive Voice", "Medium", "Change into passive voice: 'She is writing a letter.'", "A letter is being written by her.", "A letter was being written by her.", "A letter is written by her.", "A letter has been written by her.", "Present continuous passive: 'is being + past participle'."],
  ["Direct & Indirect Speech", "Medium", "Change into indirect speech: He said, 'I am busy.'", "He said that he was busy.", "He said that he is busy.", "He said that I am busy.", "He said that he were busy.", "Present tense shifts to past tense and 'I' becomes 'he'."],
  ["Direct & Indirect Speech", "Medium", "Change into indirect speech: She said, 'I will call you tomorrow.'", "She said that she would call me the next day.", "She said that she will call you tomorrow.", "She said that she would call you tomorrow.", "She said that she will call me the next day.", "'Will' → 'would', 'you' → 'me', 'tomorrow' → 'the next day'."],
  // ---- Idioms ----
  idiom("A piece of cake", "Something very easy", "A small dessert", "A rare thing", "A waste of time"),
  idiom("Once in a blue moon", "Very rarely", "Every month", "Very frequently", "At night"),
  idiom("To bite the bullet", "To face a difficult situation bravely", "To eat something hard", "To run away", "To lose one's temper"),
  idiom("Break the ice", "To start a conversation in an awkward situation", "To crack a frozen lake", "To end a friendship", "To become angry"),
  idiom("Hit the nail on the head", "To say exactly the right thing", "To make a mistake", "To hurt oneself", "To work hard"),
  idiom("Burn the midnight oil", "To work late into the night", "To waste resources", "To start a fire", "To sleep early"),
  idiom("Cost an arm and a leg", "To be very expensive", "To cause an injury", "To be cheap", "To be hard to find"),
  idiom("Spill the beans", "To reveal a secret", "To cook a meal", "To make a mess", "To tell a lie"),
  idiom("The ball is in your court", "It is your turn to take action", "You are winning", "You have lost the game", "You should stay silent"),
  idiom("Under the weather", "Feeling unwell", "Standing in the rain", "Very happy", "Extremely busy"),
  idiom("A blessing in disguise", "A good thing that seemed bad at first", "A hidden danger", "A religious event", "A false promise"),
  idiom("To call it a day", "To stop working for the day", "To start a new project", "To make a phone call", "To celebrate a birthday"),
  idiom("Beat around the bush", "To avoid coming to the main point", "To hit a plant", "To search carefully", "To speak loudly"),
  idiom("In the pipeline", "Being planned or under development", "Waiting in a queue", "Cancelled", "Already completed"),
  // ---- One-word substitution ----
  ows("A person who loves books", "Bibliophile", "Bibliographer", "Philatelist", "Numismatist"),
  ows("One who speaks many languages", "Polyglot", "Monoglot", "Orator", "Pedant"),
  ows("The study of birds", "Ornithology", "Entomology", "Etymology", "Ethnology"),
  ows("A person who cannot be corrected", "Incorrigible", "Invincible", "Inflexible", "Incurable"),
  ows("Government by the people", "Democracy", "Autocracy", "Aristocracy", "Bureaucracy"),
  ows("Fear of open spaces", "Agoraphobia", "Claustrophobia", "Hydrophobia", "Xenophobia"),
  ows("One who collects coins", "Numismatist", "Philatelist", "Epicure", "Cartographer"),
  ows("The murder of a king", "Regicide", "Homicide", "Suicide", "Fratricide"),
  ows("That which cannot be heard", "Inaudible", "Illegible", "Invisible", "Inedible"),
  ows("A place where bees are kept", "Apiary", "Aviary", "Aquarium", "Nursery"),
  ows("One who does not believe in God", "Atheist", "Theist", "Pagan", "Fanatic"),
  ows("A life story written by oneself", "Autobiography", "Biography", "Diary", "Chronicle"),
  // ---- Spelling ----
  spell("Accommodation", "Accomodation", "Acommodation", "Accommodtion"),
  spell("Necessary", "Neccessary", "Necesary", "Neccesary"),
  spell("Separate", "Seperate", "Separete", "Seprate"),
  spell("Occurrence", "Occurence", "Ocurrence", "Occurrance"),
  spell("Embarrass", "Embarass", "Embarras", "Embaras"),
  spell("Definitely", "Definately", "Definitly", "Defanitely"),
  spell("Recommend", "Reccomend", "Recomend", "Recommed"),
  spell("Government", "Goverment", "Govenment", "Governmant"),
];

export const ENGLISH_BANK: BankQuestion[] = fromHand("English", ROWS);
