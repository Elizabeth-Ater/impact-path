
/* ============================================================
   GCGO ADVISOR — QUIZ QUESTION BANK
   Kept separate from js/quiz.js (the engine) so the content and
   the logic that renders/scores it don't tangle together.

   Each question has:
     - id, type ('choice' | 'hotspot' | 'audio' | 'video')
     - prompt: the question text
     - options: array of { text, scores } where `scores` is a
       partial map of { education, health, climate, women } points
       awarded if that option is chosen. Missing keys count as 0.

   'hotspot', 'audio', and 'video' types reuse the same `options`
   shape — only the way the student picks an option differs
   (clicking an SVG region / choosing after listening / choosing
   after a video pause) — so the scoring engine in quiz.js can
   treat every question type identically once an option is picked.
   ============================================================ */

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    type: 'choice',
    prompt: "It's your first free afternoon on campus. Where do you end up?",
    options: [
      { text: 'Tutoring a first-year in the library', scores: { education: 3 } },
      { text: 'Helping out at the campus health kiosk', scores: { health: 3 } },
      { text: 'Joining the campus clean-up crew', scores: { climate: 3 } },
      { text: 'Sitting in on the Women in Tech panel', scores: { women: 3 } },
    ],
  },
  {
    id: 'q2',
    type: 'choice',
    prompt: 'Which headline stops your scroll first?',
    options: [
      { text: 'Millions of children still lack access to basic schooling', scores: { education: 3 } },
      { text: 'New study links air pollution to rising child illness', scores: { health: 2, climate: 1 } },
      { text: 'Coral reefs could vanish within a generation', scores: { climate: 3 } },
      { text: 'Gender pay gap widens across the tech industry', scores: { women: 3 } },
    ],
  },
  {
    id: 'q3',
    type: 'choice',
    prompt: 'A group project needs a research lead. Which topic do you volunteer for?',
    options: [
      { text: 'Literacy rates in rural schools', scores: { education: 3 } },
      { text: 'Mental health support on campus', scores: { health: 3 } },
      { text: 'Plastic waste in local rivers', scores: { climate: 3 } },
      { text: 'Women in leadership roles', scores: { women: 3 } },
    ],
  },
  {
    id: 'q4',
    type: 'choice',
    prompt: 'Which volunteering slot do you sign up for this weekend?',
    options: [
      { text: 'Homework help at the community centre', scores: { education: 2, women: 1 } },
      { text: 'Blood donation drive', scores: { health: 3 } },
      { text: 'Tree-planting day', scores: { climate: 3 } },
      { text: 'Mentoring young women in STEM', scores: { women: 3 } },
    ],
  },
  {
    id: 'q5',
    type: 'hotspot',
    prompt: 'Click the zone of the compass that calls to you first.',
    // Hotspot regions are rendered from this array by quiz.js —
    // coordinates are percentages of the SVG viewBox, matched to
    // the four cardinal points used in the landing-page compass.
    options: [
      { text: 'North — Education', scores: { education: 4 }, zone: 'north' },
      { text: 'East — Health', scores: { health: 4 }, zone: 'east' },
      { text: 'South — Climate Change', scores: { climate: 4 }, zone: 'south' },
      { text: 'West — Women Empowerment', scores: { women: 4 }, zone: 'west' },
    ],
  },
  {
    id: 'q6',
    type: 'choice',
    prompt: "Which book is on your nightstand right now, hypothetically?",
    options: [
      { text: "Freire's Pedagogy of the Oppressed", scores: { education: 3 } },
      { text: 'The Body Keeps the Score', scores: { health: 3 } },
      { text: 'The Uninhabitable Earth', scores: { climate: 3 } },
      { text: 'Invisible Women', scores: { women: 3 } },
    ],
  },
  {
    id: 'q7',
    type: 'choice',
    prompt: 'Group project roles — which do you take?',
    options: [
      { text: 'Curriculum designer', scores: { education: 3 } },
      { text: 'Wellbeing survey lead', scores: { health: 3 } },
      { text: 'Sustainability auditor', scores: { climate: 3 } },
      { text: 'Equity policy reviewer', scores: { women: 3 } },
    ],
  },
  {
    id: 'q8',
    type: 'choice',
    prompt: 'Which statistic bothers you the most?',
    options: [
      { text: '1 in 5 children worldwide are out of school', scores: { education: 3 } },
      { text: 'Half the world lacks access to essential health services', scores: { health: 3 } },
      { text: 'Global temperatures could rise 2.7°C by 2100', scores: { climate: 3 } },
      { text: 'Women hold under 30% of research jobs worldwide', scores: { women: 3 } },
    ],
  },
  {
    id: 'q9',
    type: 'audio',
    prompt: 'Listen to the scenario, then choose how you\u2019d respond.',
    audioSrc: 'audio/audio-question.mp3',
    transcript: '"Your neighbourhood just lost its only free clinic. Families now travel two hours for a checkup." What do you do first?',
    options: [
      { text: 'Start a petition for a mobile health unit', scores: { health: 3 } },
      { text: 'Organize a fundraiser for transport costs', scores: { health: 2, women: 1 } },
      { text: 'Research the policy that closed it', scores: { education: 1, health: 2 } },
      { text: 'Map which communities are worst affected', scores: { climate: 1, health: 2 } },
    ],
  },
  {
    id: 'q10',
    type: 'video',
    prompt: 'Watch the scenario \u2014 it will pause partway through.',
    // Placeholder path — add a copyright-free short clip here
    // before submission. The pause behaviour still works without
    // a real file; the transcript below covers the same beat.
    videoSrc: 'assets/video/scenario-clip.mp4',
    pauseAt: 5, // seconds — where the video auto-pauses via 'timeupdate'
    transcript: 'A student council is choosing next term\u2019s campaign focus and the room is split.',
    options: [
      { text: 'Push for a free-textbook exchange', scores: { education: 3 } },
      { text: 'Push for a campus mental-health week', scores: { health: 3 } },
      { text: 'Push for a single-use plastics ban', scores: { climate: 3 } },
      { text: 'Push for an equal-pay-in-internships pledge', scores: { women: 3 } },
    ],
  },
];

window.QUIZ_QUESTIONS = QUIZ_QUESTIONS;

/* ============================================================
   "DID YOU KNOW?" FACT PANEL CONTENT
   One entry per question index, shown in the sidebar panel next
   to the quiz card (see js/quiz.js renderQuestion). Purely
   informational — doesn't affect scoring.
   ============================================================ */
const QUIZ_FACTS = [
  'UNESCO estimates over 250 million children and youth are currently out of school worldwide.',
  'The WHO reports that roughly half the world\u2019s population still lacks full coverage of essential health services.',
  'Even small increases in average global temperature can significantly raise the frequency of extreme weather events.',
  'Research links companies with more women in leadership to stronger long-term financial performance.',
  'Literacy programs that involve the whole family tend to show higher long-term success rates than child-only programs.',
  'Community health workers can extend basic care to populations hours away from the nearest clinic.',
  'Reforestation projects can start measurably improving local air and water quality within just a few years.',
  'Mentorship is repeatedly shown to be one of the strongest predictors of career advancement for underrepresented groups.',
  'Peer tutoring benefits both people involved — explaining a concept reinforces the tutor\u2019s own understanding of it.',
  'Small, consistent actions — not just big policy shifts — are often what sustain long-term progress on global goals.',
];

window.QUIZ_FACTS = QUIZ_FACTS;

