// ============================================================
// BankOS — Complete Banking Exam Syllabus
// Every topic across every section. Nothing skipped.
// Used to power the Syllabus checklist view.
// ============================================================

export type SyllabusGroup = {
  name: string;
  topics: string[];
};

export type SyllabusSubject = {
  subject: string;
  icon: string; // lucide icon name
  color: string;
  groups: SyllabusGroup[];
};

export const SYLLABUS: SyllabusSubject[] = [
  // ===================== REASONING ABILITY =====================
  {
    subject: "Reasoning Ability",
    icon: "Brain",
    color: "#8b5cf6",
    groups: [
      {
        name: "Puzzles & Seating Arrangement",
        topics: [
          "Linear Seating Arrangement (Single Row)",
          "Linear Seating Arrangement (Dual Row)",
          "Circular Seating Arrangement (Facing Centre)",
          "Circular Seating Arrangement (Facing Outside)",
          "Circular Seating Arrangement (Mixed Directions)",
          "Square / Rectangular Seating Arrangement",
          "Polygon Seating Arrangement",
          "Floor-based Puzzle",
          "Floor & Flat Puzzle",
          "Box Puzzle",
          "Shelf / Stack Puzzle",
          "Scheduling Puzzle (Day / Month / Year)",
          "Date of Birth Puzzle",
          "Blood Relation Puzzle",
          "Comparison / Ranking Puzzle",
          "Designation / Salary Puzzle",
          "Variable Puzzles (5–8 variables)",
        ],
      },
      {
        name: "Syllogism",
        topics: [
          "Definite Syllogism (Old Pattern)",
          "Possibility Syllogism",
          "Coded Syllogism",
          "Reverse Syllogism",
          "Only a Few Syllogism",
          "Syllogism with Negative Conclusions",
        ],
      },
      {
        name: "Inequality",
        topics: [
          "Direct Inequality",
          "Coded Inequality",
          "Filling Blanks Inequality",
        ],
      },
      {
        name: "Coding-Decoding",
        topics: [
          "Letter Coding",
          "Number Coding",
          "Substitution Coding",
          "Mixed Coding",
          "New Pattern Coding (Word/Number with conditions)",
          "Chinese Coding",
          "Sentence Coding",
        ],
      },
      {
        name: "Series",
        topics: [
          "Number Series (Reasoning)",
          "Alphabet Series",
          "Alphanumeric Series",
          "Alphanumeric Symbol Series",
          "Mixed Series",
        ],
      },
      {
        name: "Direction & Distance",
        topics: [
          "Basic Direction Sense",
          "Direction with Distance",
          "Shadow-based Direction",
          "Coded Direction",
        ],
      },
      {
        name: "Blood Relations",
        topics: [
          "Family Tree / Generation Puzzle",
          "Coded Blood Relations",
          "Blood Relations with Direction",
          "Pointing / Introducing Type",
        ],
      },
      {
        name: "Order & Ranking",
        topics: [
          "Ranking in a Line",
          "Position from Both Ends",
          "Comparison Ranking",
          "Person Comparison Puzzles",
        ],
      },
      {
        name: "Machine Input-Output",
        topics: [
          "Word & Number Shifting",
          "Letter Shifting",
          "Mathematical Operation Based",
          "New Pattern Input-Output",
        ],
      },
      {
        name: "Data Sufficiency",
        topics: [
          "Two-statement Data Sufficiency",
          "Three-statement Data Sufficiency",
          "Reasoning Based Data Sufficiency",
        ],
      },
      {
        name: "Verbal / Logical Reasoning",
        topics: [
          "Statement & Assumption",
          "Statement & Conclusion",
          "Statement & Argument",
          "Statement & Course of Action",
          "Cause & Effect",
          "Inference",
          "Strong & Weak Arguments",
          "Decision Making",
          "Deriving Conclusions from Passages",
        ],
      },
      {
        name: "Miscellaneous",
        topics: [
          "Odd One Out",
          "Analogy",
          "Classification",
          "Mirror Image & Water Image",
          "Paper Folding & Cutting",
          "Embedded Figures",
          "Cube & Dice",
        ],
      },
    ],
  },

  // ===================== QUANTITATIVE APTITUDE =====================
  {
    subject: "Quantitative Aptitude",
    icon: "Sigma",
    color: "#3b82f6",
    groups: [
      {
        name: "Simplification & Approximation",
        topics: [
          "Simplification (BODMAS)",
          "Approximation",
          "Number System Basics",
          "HCF & LCM",
          "Squares, Cubes, Square Roots & Cube Roots",
          "Surds & Indices",
        ],
      },
      {
        name: "Number Series",
        topics: [
          "Missing Number Series",
          "Wrong Number Series",
          "Wrong Term Series",
          "Double Pattern Series",
        ],
      },
      {
        name: "Quadratic Equations",
        topics: [
          "Quadratic Equations",
          "Quadratic Inequalities",
          "Quantity Comparison (Quadratic)",
        ],
      },
      {
        name: "Data Interpretation",
        topics: [
          "Tabular Data Interpretation",
          "Bar Graph DI",
          "Line Graph DI",
          "Pie Chart DI (Single)",
          "Pie Chart DI (Multiple)",
          "Mixed / Combination DI",
          "Caselet DI",
          "Radar / Web DI",
          "Missing Data DI",
          "Arithmetic-based DI",
          "Time & Work DI",
          "Probability-based DI",
        ],
      },
      {
        name: "Data Sufficiency",
        topics: [
          "Two-statement Data Sufficiency",
          "Three-statement Data Sufficiency",
        ],
      },
      {
        name: "Quantity Comparison",
        topics: [
          "Quantity I vs Quantity II",
          "Quantity Comparison with Arithmetic",
        ],
      },
      {
        name: "Arithmetic",
        topics: [
          "Ratio & Proportion",
          "Proportion & Variations",
          "Percentage",
          "Average",
          "Profit, Loss & Discount",
          "Successive Selling",
          "Dishonest Dealer / Faulty Weight",
          "Partnership",
          "Mixture & Alligation",
          "Problem on Ages",
          "Simple Interest",
          "Compound Interest",
          "Time & Work",
          "Pipe & Cistern",
          "Work & Wages",
          "Alternate Day Work",
          "Efficiency-based Work",
          "Time, Speed & Distance",
          "Average Speed",
          "Relative Speed",
          "Trains",
          "Boats & Streams",
          "Races & Games",
          "Speed in still water / downstream / upstream",
          "Permutation & Combination",
          "Probability",
          "Mensuration 2D (Triangle, Rectangle, Square, Circle, Parallelogram, Rhombus, Trapezium)",
          "Mensuration 3D (Cube, Cuboid, Cylinder, Cone, Sphere, Hemisphere, Frustum)",
          "Calendar",
          "Clocks & Angles",
          "Income & Expenditure",
          "Expenditure & Saving",
        ],
      },
      {
        name: "Advanced / Misc",
        topics: [
          "Number System Divisibility",
          "Remainder Theorem",
          "Unit Digit",
          "Last Two Digits",
          "Number of Factors / Sum of Factors",
          "Concept of Total / Zero / Negative marks",
        ],
      },
    ],
  },

  // ===================== ENGLISH LANGUAGE =====================
  {
    subject: "English Language",
    icon: "BookOpen",
    color: "#22d3ee",
    groups: [
      {
        name: "Reading Comprehension",
        topics: [
          "Theme / Main Idea based RC",
          "Inference based RC",
          "Fact based RC",
          "Vocabulary based RC",
          "Economy / Banking based RC",
          "Business / Finance based RC",
          "Social Issue based RC",
          "Technology based RC",
          "History / Philosophy based RC",
          "RC with Synonym / Antonym questions",
          "RC with Title / Tone questions",
        ],
      },
      {
        name: "Cloze Test",
        topics: [
          "Old Pattern Cloze Test",
          "New Pattern Cloze Test (Word Replacement)",
          "Cloze Test with Phrasal Verbs",
          "Cloze Test with Fill in the Blanks",
        ],
      },
      {
        name: "Fill in the Blanks",
        topics: [
          "Single Fill in the Blank",
          "Double Fill in the Blank",
          "Triple Fill in the Blank",
          "Fill in the Blanks with Phrasal Verbs",
        ],
      },
      {
        name: "Spotting Errors",
        topics: [
          "Spotting Errors (Grammar)",
          "Spelling Error Spotting",
          "Error in Underlined Part",
          "Find the Correct Sentence",
        ],
      },
      {
        name: "Sentence Improvement & Correction",
        topics: [
          "Sentence Improvement",
          "Sentence Correction",
          "Phrase Replacement",
          "Phrase Correction",
          "Choose the Correct Alternative",
        ],
      },
      {
        name: "Sentence Rearrangement",
        topics: [
          "Para Jumbles (Old Pattern)",
          "Para Jumbles (New Pattern - First Sentence Fixed)",
          "Para Jumbles with Options",
          "Odd Sentence Out (Para Jumble)",
        ],
      },
      {
        name: "Para Based",
        topics: [
          "Para Completion",
          "Para Summary",
          "Para Connectors",
          "Sentence Connectors",
          "Paragraph Connectors",
        ],
      },
      {
        name: "Word Level",
        topics: [
          "Synonyms",
          "Antonyms",
          "Word Swap (in sentence)",
          "Word Usage (Correct Usage)",
          "Word Replacement",
          "Idioms & Phrases (Meaning)",
          "Idioms & Phrases (Usage in Sentence)",
          "One Word Substitution",
          "Spelling Correction",
        ],
      },
      {
        name: "Grammar",
        topics: [
          "Active / Passive Voice",
          "Direct / Indirect Speech",
          "Tenses",
          "Subject-Verb Agreement",
          "Articles",
          "Prepositions",
          "Conjunctions",
          "Conditionals",
          "Parts of Speech",
        ],
      },
      {
        name: "New Pattern",
        topics: [
          "Match the Column",
          "Column Based Sentence Correction",
          "Sentence Starters",
          "Sentence Completion with Multiple Options",
          "Word Association",
          "Vocabulary Based Fillers",
        ],
      },
    ],
  },

  // ===================== COMPUTER AWARENESS =====================
  {
    subject: "Computer Awareness",
    icon: "Cpu",
    color: "#ec4899",
    groups: [
      {
        name: "Computer Fundamentals",
        topics: [
          "History of Computers",
          "Generations of Computers",
          "Types of Computers",
          "Computer Architecture (Input/Output/Storage)",
          "Computer Hardware Components",
          "Computer Software (System & Application)",
          "Boot Process",
        ],
      },
      {
        name: "Operating Systems",
        topics: [
          "OS Fundamentals",
          "Types of OS",
          "Functions of OS",
          "File Management",
          "Process Management",
        ],
      },
      {
        name: "MS Office",
        topics: [
          "MS Word",
          "MS Excel (Formulas, Functions, Charts)",
          "MS PowerPoint",
          "MS Access",
        ],
      },
      {
        name: "Internet & Networking",
        topics: [
          "Internet Basics & History",
          "Web Browsers",
          "Search Engines",
          "Email & Protocols (SMTP, POP, IMAP)",
          "URL, HTTP, HTTPS, FTP",
          "Networking Fundamentals (LAN, WAN, MAN)",
          "Network Topologies",
          "IP Addressing (IPv4, IPv6)",
          "Wireless Communication (Wi-Fi, Bluetooth)",
        ],
      },
      {
        name: "Data & Security",
        topics: [
          "Database Management Systems (DBMS)",
          "Data Warehouse & Data Mining",
          "Cloud Computing (IaaS, PaaS, SaaS)",
          "Computer Security",
          "Viruses, Worms, Trojans",
          "Malware & Spyware",
          "Antivirus & Firewalls",
          "Cryptography (Symmetric & Asymmetric)",
          "Digital Signatures",
          "Two-Factor Authentication",
        ],
      },
      {
        name: "Modern Technology",
        topics: [
          "Artificial Intelligence",
          "Machine Learning",
          "Internet of Things (IoT)",
          "Blockchain",
          "Big Data",
          "Data Science",
          "5G Technology",
          "Quantum Computing",
        ],
      },
      {
        name: "Memory & Storage",
        topics: [
          "Primary Memory (RAM, ROM, Cache)",
          "Secondary Memory (HDD, SSD, Pen Drive)",
          "Memory Units (Bit, Byte, KB, MB, GB, TB)",
          "Registers",
        ],
      },
      {
        name: "Miscellaneous",
        topics: [
          "Computer Abbreviations",
          "Shortcut Keys",
          "Programming Languages (Basics)",
          "E-Governance Initiatives",
          "Digital India",
        ],
      },
    ],
  },

  // ===================== BANKING & FINANCIAL AWARENESS =====================
  {
    subject: "Banking & Financial Awareness",
    icon: "Landmark",
    color: "#f59e0b",
    groups: [
      {
        name: "Indian Banking System",
        topics: [
          "History of Banking in India",
          "Nationalisation of Banks (1969 & 1980)",
          "Structure of Indian Banking",
          "RBI (Reserve Bank of India)",
          "Functions of RBI",
          "RBI Acts & Framework",
          "NABARD",
          "SIDBI",
          "EXIM Bank",
          "SEBI",
          "IRDAI",
          "PFRDA",
          "Small Finance Banks",
          "Payments Banks",
          "Cooperative Banks",
          "Regional Rural Banks (RRBs)",
          "Local Area Banks",
        ],
      },
      {
        name: "Monetary Policy",
        topics: [
          "Repo Rate",
          "Reverse Repo Rate",
          "Cash Reserve Ratio (CRR)",
          "Statutory Liquidity Ratio (SLR)",
          "Marginal Standing Facility (MSF)",
          "Bank Rate",
          "Open Market Operations (OMO)",
          "Inflation (CPI, WPI)",
          "Deflation & Disinflation",
          "Monetary Policy Committee (MPC)",
          "Quantitative & Qualitative Tools",
        ],
      },
      {
        name: "Banking Products & Services",
        topics: [
          "Types of Accounts (Savings, Current, Fixed, Recurring)",
          "Interest Rates on Deposits",
          "Cheques & Types of Cheques",
          "Demand Draft (DD)",
          "Banker's Cheque",
          "Pay Order",
          "Traveller's Cheque",
          "Negotiable Instruments (Act 1881)",
          "Bill of Exchange",
          "Promissory Note",
          "Kisan Credit Card (KCC)",
          "Credit Cards, Debit Cards, Prepaid Cards",
          "ATM & Types of ATMs",
          "Lockers & Safe Deposit",
        ],
      },
      {
        name: "Digital Banking",
        topics: [
          "Unified Payments Interface (UPI)",
          "IMPS (Immediate Payment Service)",
          "NEFT (National Electronic Funds Transfer)",
          "RTGS (Real Time Gross Settlement)",
          "AEPS (Aadhaar Enabled Payment System)",
          "BBPS (Bharat Bill Payment System)",
          "NACH (National Automated Clearing House)",
          "ECS (Electronic Clearing Service)",
          "Mobile Banking",
          "Internet Banking",
          "Wallets (Paytm, PhonePe, etc.)",
          "BharatQR",
          "Contactless Payments (NFC)",
          "Digital Rupee (CBDC)",
        ],
      },
      {
        name: "Financial Inclusion & Schemes",
        topics: [
          "Pradhan Mantri Jan Dhan Yojana (PMJDY)",
          "JAM Trinity (Jan Dhan, Aadhaar, Mobile)",
          "Pradhan Mantri Mudra Yojana",
          "Stand Up India Scheme",
          "Atal Pension Yojana",
          "Pradhan Mantri Suraksha Bima Yojana",
          "Pradhan Mantri Jeevan Jyoti Bima Yojana",
          "Sukanya Samriddhi Yojana",
          "Public Provident Fund (PPF)",
          "National Pension System (NPS)",
          "Gold Monetisation Scheme",
          "Sovereign Gold Bond Scheme",
          "Priority Sector Lending (PSL)",
          "Lead Bank Scheme",
          "Business Correspondent Model",
        ],
      },
      {
        name: "Banking Regulation & Reforms",
        topics: [
          "Banking Regulation Act 1949",
          "Narasimham Committee (I & II)",
          "Basel Norms (I, II, III)",
          "NPA (Non-Performing Assets)",
          "SARFAESI Act",
          "Insolvency and Bankruptcy Code (IBC)",
          "Insolvency and Bankruptcy Board of India (IBBI)",
          "Fugitive Economic Offenders Act",
          "Recapitalisation of Banks",
          "Merger of Banks",
          "Banking Ombudsman Scheme",
          "KYC (Know Your Customer)",
          "AML (Anti-Money Laundering)",
          "PMLA (Prevention of Money Laundering Act)",
        ],
      },
      {
        name: "Financial Markets",
        topics: [
          "Money Market Instruments (T-Bills, Commercial Paper, Certificate of Deposit)",
          "Capital Market (Primary & Secondary)",
          "Shares & Bonds",
          "Debentures",
          "Mutual Funds (Types)",
          "SIP (Systematic Investment Plan)",
          "Derivatives (Forwards, Futures, Options)",
          "Foreign Exchange Market (FOREX)",
          "Stock Exchanges (BSE, NSE)",
          "Indices (Sensex, Nifty)",
          "SEBI Regulations",
        ],
      },
      {
        name: "Insurance",
        topics: [
          "Life Insurance Corporation (LIC)",
          "General Insurance Corporation (GIC)",
          "Types of Life Insurance",
          "Types of General Insurance",
          "Insurance Ombudsman",
          "Pradhan Mantri Fasal Bima Yojana",
          "Pradhan Mantri Jan Arogya Yojana (Ayushman Bharat)",
        ],
      },
      {
        name: "Important Committees & Reports",
        topics: [
          "Narasimham Committee",
          "Kelkar Committee",
          "Urjit Patel Committee",
          "Bimal Jalan Committee",
          "P.J. Nayak Committee",
          "Nachiket Mor Committee",
          "Economic Survey Highlights",
          "Union Budget Highlights",
        ],
      },
    ],
  },

  // ===================== CURRENT AFFAIRS =====================
  {
    subject: "Current Affairs",
    icon: "Newspaper",
    color: "#10b981",
    groups: [
      {
        name: "National Affairs",
        topics: [
          "Government Policies & Schemes",
          "Cabinet Approvals & Decisions",
          "State-level Schemes & News",
          "Constitutional Amendments",
          "Parliament Bills & Acts",
          "Supreme Court Judgements",
          "Election Commission News",
        ],
      },
      {
        name: "Banking & Economy",
        topics: [
          "RBI Announcements",
          "Repo / Reverse Repo Changes",
          "Bank Mergers & Acquisitions",
          "New Bank Licenses",
          "Financial Results of Banks",
          "Credit / Debit Card Trends",
          "Digital Payment Statistics",
          "FDI / FII Data",
          "GDP Growth Rate",
          "Inflation Data",
          "Repo & Monetary Policy Reviews",
        ],
      },
      {
        name: "International Affairs",
        topics: [
          "World Leaders & Summits (G20, BRICS, ASEAN)",
          "Bilateral Agreements",
          "MoUs with Other Countries",
          "International Organisations (IMF, World Bank, WTO, UN)",
          "Global Indices & India's Rank",
          "Wars & Conflicts",
        ],
      },
      {
        name: "Awards & Honours",
        topics: [
          "Nobel Prize",
          "Bharat Ratna, Padma Awards",
          "National Sports Awards (Khel Ratna, Arjuna)",
          "National Film Awards",
          "Pulitzer Prize",
          "Oscar Awards",
          "Booker Prize",
          "Sahitya Akademi Award",
        ],
      },
      {
        name: "Sports",
        topics: [
          "Cricket Tournaments (IPL, World Cup, Asia Cup)",
          "Olympic Games",
          "Commonwealth Games",
          "Asian Games",
          "Football Tournaments",
          "Tennis Grand Slams",
          "Badminton Tournaments",
          "Hockey Tournaments",
          "Indian Athletes Achievements",
        ],
      },
      {
        name: "Science & Technology",
        topics: [
          "ISRO Missions (Chandrayaan, Mangalyaan, Gaganyaan)",
          "NASA & Space News",
          "New Inventions & Discoveries",
          "AI & Tech Developments",
          "Health & Medicine",
          "Vaccines & Diseases",
          "Defence Technology",
        ],
      },
      {
        name: "Defence & Security",
        topics: [
          "Defence Exercises (Indian & Joint)",
          "New Defence Equipment",
          "DRDO Developments",
          "Military Ranks & Appointments",
          "Border Security News",
        ],
      },
      {
        name: "Summits & Conferences",
        topics: [
          "G20 Summit",
          "BRICS Summit",
          "ASEAN Summit",
          "SAARC Summit",
          "BIMSTEC Summit",
          "COP (Climate) Summit",
          "World Economic Forum (Davos)",
        ],
      },
      {
        name: "Appointments & Resignations",
        topics: [
          "National Appointments (President, PM, Ministers, Judges)",
          "RBI Governor & Deputy Governors",
          "Heads of Banks & PSUs",
          "International Appointments",
          "Chief Ministers & Governors",
        ],
      },
      {
        name: "Books & Authors",
        topics: [
          "New Book Releases",
          "Books by Famous Personalities",
          "Books on Banking & Economy",
        ],
      },
      {
        name: "Obituaries",
        topics: [
          "National Obituaries",
          "International Obituaries",
          "Famous Personalities",
        ],
      },
      {
        name: "Important Days",
        topics: [
          "National Days",
          "International Days (UN)",
          "Theme-based Days",
        ],
      },
      {
        name: "Static GK (Mains/Interview)",
        topics: [
          "Indian Constitution (Parts, Schedules, Articles)",
          "Fundamental Rights & Duties",
          "Indian History (Ancient, Medieval, Modern)",
          "Indian Geography (Rivers, Mountains, States)",
          "World Geography",
          "Indian Polity",
          "Census 2011 Highlights",
          "First in India (Men & Women)",
          "First in World",
          "Dances of India",
          "Festivals of India",
          "Rivers & Dams in India",
          "National Parks & Wildlife Sanctuaries",
        ],
      },
    ],
  },

  // ===================== INTERVIEW PREPARATION =====================
  {
    subject: "Interview Preparation",
    icon: "Building2",
    color: "#a855f7",
    groups: [
      {
        name: "Personal Profile",
        topics: [
          "Tell Me About Yourself",
          "Strengths & Weaknesses",
          "Why Banking Career",
          "Why This Bank",
          "Background (Education, Hometown)",
          "Hobbies & Interests",
          "Family Background",
        ],
      },
      {
        name: "Banking Awareness (Interview)",
        topics: [
          "Latest Banking Developments",
          "Functions of Your Preferred Bank",
          "Difference Between Banks",
          "Recent Banking Schemes",
          "Your Views on Banking Sector",
        ],
      },
      {
        name: "Current Affairs (Interview)",
        topics: [
          "Last 6 Months Current Affairs",
          "Latest Economic News",
          "Latest Government Policies",
          "Your Opinion on Burning Issues",
        ],
      },
      {
        name: "HR Questions",
        topics: [
          "Where Do You See Yourself in 5 Years",
          "Why Should We Hire You",
          "Salary Expectations",
          "Relocation Willingness",
          "Handling Pressure",
          "Teamwork Scenarios",
          "Leadership Examples",
        ],
      },
      {
        name: "Situational / Case Questions",
        topics: [
          "Ethical Dilemmas",
          "Customer Handling Scenarios",
          "Conflict Resolution",
          "Decision Making Under Stress",
        ],
      },
    ],
  },
];

/** Flatten all topics for quick lookup / total count. */
export const ALL_TOPICS: { subject: string; topic: string }[] = SYLLABUS.flatMap(
  (s) => s.groups.flatMap((g) => g.topics.map((t) => ({ subject: s.subject, topic: t })))
);

export const TOTAL_TOPICS = ALL_TOPICS.length;
