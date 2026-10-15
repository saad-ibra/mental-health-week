/* ===================================================================
   DATA DEFINITIONS — MENTAL HEALTH WEEK
   Crossword words, Match-Up pairs, Quiz questions, and Lucide icons
   =================================================================== */

// Crossword definitions: [Word, Row, Col, Direction ("A"|"D"), LucideIcon, Clue, WellbeingTip]
export const CROSSWORD_DATA = [
  [
    "STRESS", 0, 4, "A", "zap",
    "The body's alarm response to pressure or demands. A little can motivate; too much for too long wears us down.",
    "Short bursts of stress can sharpen focus; chronic stress is the one linked to poorer sleep, mood and health."
  ],
  [
    "EMPATHY", 2, 5, "A", "heart-handshake",
    "Trying to understand and share what another person is feeling, not just what they say.",
    "Listening without rushing to fix is often the most helpful support."
  ],
  [
    "ANXIETY", 4, 5, "A", "activity",
    "Persistent worry or fear about what might happen, often with a racing heart or restless mind.",
    "Anxiety disorders are among the most common mental health conditions worldwide, and they are treatable."
  ],
  [
    "MEMORY", 6, 0, "A", "sparkles",
    "Our ability to store and recall experiences. It can get patchy when we are exhausted or overloaded.",
    "Poor sleep and high stress both make learning and recall harder."
  ],
  [
    "BALANCE", 8, 7, "A", "scale",
    "Fitting work, study, rest and relationships together so no one area swallows everything.",
    "Protecting rest and social time is part of performing well, not a reward for it."
  ],
  [
    "RESILIENCE", 10, 5, "A", "sprout",
    "The ability to adapt and bounce back after setbacks. It can be built and is not a fixed trait.",
    "Resilience grows through supportive relationships, routines and learned coping skills."
  ],
  [
    "THERAPY", 0, 5, "D", "message-circle-heart",
    "Talking treatment with a trained professional to understand feelings and build coping tools.",
    "Seeking therapy is a sign of self-awareness, and many people use it without a 'crisis'."
  ],
  [
    "SLEEP", 4, 1, "D", "moon",
    "Nightly rest of roughly 7–9 hours for most adults. Skimping on it affects mood and concentration.",
    "Regular sleep and wake times support emotional regulation."
  ],
  [
    "MOOD", 5, 3, "D", "sun-dim",
    "How we feel over hours or days, like emotional weather that shifts and passes.",
    "Mood changes are normal; long-lasting low mood is worth talking to someone about."
  ],
  [
    "ISOLATION", 4, 8, "D", "compass",
    "Being cut off from other people, whether by circumstance or by choice, and feeling alone as a result.",
    "Strong social connection is one of the best-supported protections for wellbeing."
  ]
];

// Match-Up definitions: [LucideIcon, Label, Statement, ActionableInsight]
export const MATCHUP_DATA = [
  [
    "moon",
    "Sleep",
    "Skimping on rest makes mood, memory and concentration worse.",
    "Regular sleep and wake times help emotions stay steadier."
  ],
  [
    "users",
    "Support",
    "Talking to someone you trust can make a heavy load feel lighter.",
    "Feeling heard is a powerful protector of wellbeing."
  ],
  [
    "footprints",
    "Movement",
    "A short walk can lift mood and ease tension.",
    "Even 10 minutes of movement can help."
  ],
  [
    "wind",
    "Breathing",
    "Slow, deep breaths help calm the body's stress response.",
    "Try breathing out longer than you breathe in."
  ],
  [
    "smartphone-off",
    "Screen break",
    "Regular breaks from notifications reduce mental overload.",
    "Short offline pauses help attention recover."
  ],
  [
    "palette",
    "Hobbies",
    "Enjoyable activities give the mind a rest from worry.",
    "Doing something just for pleasure is not wasted time."
  ],
  [
    "sprout",
    "Resilience",
    "Setbacks are normal, and coping skills can be learned over time.",
    "Resilience is built, not something you either have or lack."
  ],
  [
    "life-buoy",
    "Asking for help",
    "Reaching out early is a sign of strength, not weakness.",
    "Early support often prevents problems from growing."
  ]
];

// Quiz Questions derived directly from the statements, clues, and science tips in the dumps
export const QUIZ_DATA = [
  {
    id: 1,
    topic: "Stress & Nervous System",
    icon: "zap",
    question: "What is the true nature of stress according to psychological research?",
    options: [
      "All stress is toxic and must be completely avoided at all times",
      "Short bursts can sharpen focus, but chronic persistent stress wears the body down",
      "Stress only affects your mind and has zero effect on your physical heart or sleep",
      "Stress is a sign of personal weakness and lack of discipline"
    ],
    correctIndex: 1,
    explanation: "Short bursts of stress can sharpen focus and motivation; however, chronic stress is what impairs sleep, mood, memory, and physical health."
  },
  {
    id: 2,
    topic: "Interpersonal Support",
    icon: "heart-handshake",
    question: "When supporting a friend going through emotional distress, which response is most helpful?",
    options: [
      "Rushing immediately to give advice and fix all their problems for them",
      "Telling them other people have it worse so they should cheer up",
      "Practicing active listening without judgment and validating their feelings",
      "Changing the subject quickly so they don't dwell on sadness"
    ],
    correctIndex: 2,
    explanation: "Listening without rushing to fix or judge is often the most empowering and helpful support you can offer."
  },
  {
    id: 3,
    topic: "Emotional Regulation",
    icon: "wind",
    question: "Why do controlled deep breathing techniques (like exhaling longer than inhaling) calm anxiety?",
    options: [
      "They activate the parasympathetic 'rest and digest' response to lower heart rate",
      "They permanently eliminate cortisol from the bloodstream in 5 seconds",
      "They distract the ears from hearing background noises",
      "They increase adrenaline so you can fight off negative thoughts"
    ],
    correctIndex: 0,
    explanation: "Slow, deep exhalations stimulate the vagus nerve, triggering the parasympathetic nervous system to slow your heart rate and ease physical tension."
  },
  {
    id: 4,
    topic: "Rest & Brain Health",
    icon: "moon",
    question: "What is the recommended nightly sleep duration for most adults, and why is it vital?",
    options: [
      "4–5 hours; anything more reduces academic and work productivity",
      "7–9 hours; essential for emotional regulation, memory consolidation, and cell repair",
      "12 hours minimum for every adult regardless of age",
      "Sleep duration doesn't affect cognitive performance or mood"
    ],
    correctIndex: 1,
    explanation: "7–9 hours of sleep is necessary for the brain to consolidate memory and regulate neurotransmitters. Skimping on sleep directly compromises mood stability."
  },
  {
    id: 5,
    topic: "Coping & Growth",
    icon: "sprout",
    question: "Which of the following statements about psychological resilience is accurate?",
    options: [
      "Resilience means never feeling sad, overwhelmed, or distressed",
      "Resilience is an innate genetic trait you either have from birth or never have",
      "Resilience is built over time through routines, supportive relationships, and coping skills",
      "Resilience requires solving all your struggles completely on your own"
    ],
    correctIndex: 2,
    explanation: "Resilience is not a fixed trait. It is a learnable capacity that develops through supportive relationships, healthy coping strategies, and reflection."
  },
  {
    id: 6,
    topic: "Digital Wellbeing",
    icon: "smartphone-off",
    question: "How do intentional breaks from screen notifications benefit mental clarity?",
    options: [
      "They reduce cognitive overload and allow attention and focus to recover",
      "They permanently delete your social anxiety",
      "They ensure you never experience stress again",
      "They only help children and have zero effect on university students or adults"
    ],
    correctIndex: 0,
    explanation: "Constant notifications trigger micro-distractions and hypervigilance. Short offline breaks allow your working memory and attention to replenish."
  },
  {
    id: 7,
    topic: "Seeking Guidance",
    icon: "life-buoy",
    question: "When is the best time to speak to a counselor, therapist, or trusted mentor?",
    options: [
      "Only after you have experienced a severe breakdown and have no other choice",
      "Early, as a proactive sign of self-awareness and strength before issues escalate",
      "Never, because seeking therapy shows you cannot manage your own life",
      "Only if you have an officially certified medical referral"
    ],
    correctIndex: 1,
    explanation: "Reaching out early is a sign of strength and emotional intelligence. Many people use counseling proactively for personal growth and stress prevention."
  },
  {
    id: 8,
    topic: "Work-Life Harmony",
    icon: "scale",
    question: "What does maintaining healthy life balance genuinely involve?",
    options: [
      "Spending exactly equal minutes on study, sleep, leisure, and work every day",
      "Protecting rest and social connection as integral to high performance, not as an afterthought",
      "Working without breaks until exhaustion, then taking one day off",
      "Eliminating all hobbies until all academic or professional goals are achieved"
    ],
    correctIndex: 1,
    explanation: "Protecting rest, nourishment, and social connection is a prerequisite for sustained cognitive and emotional performance, not a reward for it."
  }
];

// Support resources for celebration/helpline display
export const SUPPORT_RESOURCES = [
  {
    name: "Campus Wellbeing / Counseling Center",
    desc: "Confidential on-campus guidance for students and faculty.",
    badge: "Campus Resource"
  },
  {
    name: "Tele-MANAS (Govt of India Helpline)",
    desc: "Toll-free 24/7 mental health counseling: 14416 or 1800-891-4416",
    badge: "24/7 Free"
  },
  {
    name: "Vandrevala Foundation",
    desc: "Free 24/7 psychological crisis support: +91 9999 666 555",
    badge: "Helpline"
  },
  {
    name: "KIRAN Helpline",
    desc: "Toll-free mental health rehabilitation support: 1800-599-0019",
    badge: "Govt Helpline"
  }
];
