/* ============================================================
   GCGO ADVISOR — PILLAR CONTENT
   Descriptive feedback and next-step recommendations for each
   of the four GCGO pillars, shown on the Results page once a
   student's top category is calculated. Kept separate from
   results.js (the rendering/canvas logic) for the same reason
   quiz-data.js is separate from quiz.js — content vs. engine.
   ============================================================ */

const PILLAR_INFO = {
  education: {
    label: 'Education',
    hex: '#F2B705',
    headline: "You're an Education Advocate",
    description:
      "Your answers kept circling back to access and learning — closing the gap between who gets a good education and who doesn't. You notice when a system leaves people behind because no one taught them the basics, and you want to be part of fixing that.",
    recommendations: [
      { title: 'Join the Peer Tutoring Society', blurb: 'Weekly sessions supporting first-years who are struggling to keep pace — a direct, hands-on way to close a learning gap.' },
      { title: 'Volunteer with a local literacy programme', blurb: 'Most towns run adult or child literacy drives that always need reading buddies or material designers.' },
      { title: "Take the 'Foundations of Global Education' elective", blurb: 'Offered most terms — a good next academic step if this pillar keeps pulling at you.' },
    ],
  },
  health: {
    label: 'Health',
    hex: '#FF6B6B',
    headline: "You're a Health Champion",
    description:
      "You kept choosing the option that gets care to the people who can't easily reach it. Whether it's mental health, access to clinics, or the systems that quietly fail people, you notice health gaps before most people do — and you want to close them.",
    recommendations: [
      { title: 'Join the campus wellbeing peer-support team', blurb: 'Trained student volunteers who provide a first point of contact for classmates who are struggling.' },
      { title: 'Volunteer at a blood donation or health-outreach drive', blurb: 'Local hospitals and NGOs run these regularly and always need hands for logistics, not just donors.' },
      { title: "Take an elective in public health or health policy", blurb: 'A natural academic complement if you want to understand the systems behind the gaps you noticed.' },
    ],
  },
  climate: {
    label: 'Climate Change',
    hex: '#2DD4A7',
    headline: "You're a Climate Advocate",
    description:
      "The environment kept showing up in your answers — plastic, pollution, rising temperatures, the systems driving a less stable planet. You think in terms of long-term consequences, and you want your first year to leave something greener behind it.",
    recommendations: [
      { title: 'Join (or start) a campus sustainability club', blurb: 'Clean-up drives, recycling audits, and pressure campaigns for greener campus policy.' },
      { title: 'Volunteer for a local tree-planting or river clean-up day', blurb: 'Low-commitment, high-visibility, and usually run by an NGO you can keep working with.' },
      { title: 'Take an elective touching climate science or policy', blurb: 'Even a single module will sharpen the instinct you\u2019re already showing.' },
    ],
  },
  women: {
    label: 'Women Empowerment',
    hex: '#B47AEA',
    headline: "You're an Equality Advocate",
    description:
      "Equity kept winning your attention — pay gaps, leadership representation, safety, opportunity. You notice when the playing field isn't level, and your answers show you'd rather help level it than just observe it.",
    recommendations: [
      { title: 'Join a Women in STEM or leadership mentoring circle', blurb: 'Most campuses run one — a concrete way to support representation where it\u2019s thinnest.' },
      { title: 'Volunteer with an organisation supporting women\u2019s safety or economic access', blurb: 'Local NGOs almost always need help with outreach, admin, or events.' },
      { title: 'Take an elective in gender studies or equity policy', blurb: 'Gives you the vocabulary and frameworks behind what you\u2019re already noticing.' },
    ],
  },
};

window.PILLAR_INFO = PILLAR_INFO;

