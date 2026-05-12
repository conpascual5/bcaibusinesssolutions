export type SalesFrameworkId =
  | "six-w"
  | "story-solve-sell"
  | "solution-savings-social-proof"
  | "pain-agitate-relief"
  | "friend-expert"
  | "past-present-future"
  | "positive-negative"
  | "exclusive-inclusive"
  | "expectation-surprise"
  | "urgency-patience"
  | "personal-universal"
  | "emotion-logic"
  | "strong-weak"
  | "consistent-contrasting"
  | "five-basic-objections"
  | "awareness-comprehension-conviction-action"
  | "picture-promise-prove-push"
  | "star-story-solution"
  | "problem-agitate-solve"
  | "aida"
  | "before-after-bridge"
  | "pastor"
  | "four-c"
  | "fab";

export type SalesFramework = {
  id: SalesFrameworkId;
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  promptHint: string;
};

export const SALES_FRAMEWORKS: SalesFramework[] = [
  {
    id: "six-w",
    title: "6 W Sales Page Framework",
    subtitle: "Sales Page Frameworks",
    emoji: "📈",
    description:
      "A step-by-step guide to creating a high-converting sales page every time.",
    promptHint:
      "Answer the 6 W’s clearly: Who, What, Why, When, Where, and What’s Next.",
  },
  {
    id: "story-solve-sell",
    title: "Story-Solve-Sell",
    subtitle: "Sales Page Frameworks",
    emoji: "📖🧩💰",
    description:
      "Tell a story, solve a problem, and drive sales with a strong CTA.",
    promptHint:
      "Open with a relatable story, show the struggle, reveal the solution, then sell.",
  },
  {
    id: "solution-savings-social-proof",
    title: "Solution-Savings-Social Proof",
    subtitle: "Sales Page Frameworks",
    emoji: "📈💰👥",
    description:
      "Leverage savings and social proof to increase conversions.",
    promptHint:
      "Lead with the solution, quantify savings/value, then add proof and CTA.",
  },
  {
    id: "pain-agitate-relief",
    title: "Pain-Agitate-Relief",
    subtitle: "Sales Page Frameworks",
    emoji: "👉🏼",
    description:
      "Highlight the struggle, intensify it, then offer a clear relief path.",
    promptHint:
      "Describe the pain, agitate with consequences, then deliver relief + CTA.",
  },
  {
    id: "friend-expert",
    title: "Friend-Expert",
    subtitle: "Sales Page Frameworks",
    emoji: "👥📈🛍️",
    description:
      "Build trust by sounding like a friend while backing it with expert authority.",
    promptHint:
      "Warm friendly tone + credible expert tips + specific steps and CTA.",
  },
  {
    id: "past-present-future",
    title: "Past-Present-Future",
    subtitle: "Sales Page Frameworks",
    emoji: "🔙🔜🔮",
    description:
      "Turn your pitch into a time journey that motivates action.",
    promptHint:
      "Paint the past pain, present turning point, and future transformation.",
  },
  {
    id: "positive-negative",
    title: "Positive-Negative",
    subtitle: "Sales Page Frameworks",
    emoji: "📈📉",
    description:
      "Show the upside while addressing worries and objections.",
    promptHint:
      "List positives, acknowledge negatives, then neutralize with proof.",
  },
  {
    id: "exclusive-inclusive",
    title: "Exclusive-Inclusive",
    subtitle: "Sales Page Frameworks",
    emoji: "📈👥",
    description:
      "Appeal to aspirational buyers while staying approachable for everyone.",
    promptHint:
      "Make it feel premium, then show how anyone can join and benefit.",
  },
  {
    id: "expectation-surprise",
    title: "Expectation-Surprise",
    subtitle: "Sales Page Frameworks",
    emoji: "👀",
    description:
      "Keep attention by flipping expectations with a compelling twist.",
    promptHint:
      "Set expectation, surprise with insight, then offer the solution.",
  },
  {
    id: "urgency-patience",
    title: "Urgency-Patience",
    subtitle: "Sales Page Frameworks",
    emoji: "🚨🕰️",
    description:
      "Balance urgency with trust-building and clarity.",
    promptHint:
      "Give a time-bound reason + reassure with guarantees and transparency.",
  },
  {
    id: "personal-universal",
    title: "Personal-Universal",
    subtitle: "Sales Page Frameworks",
    emoji: "🚀",
    description:
      "Start personal, then zoom out to why it matters for everyone.",
    promptHint:
      "Use a personal story, then generalize to the audience’s situation.",
  },
  {
    id: "emotion-logic",
    title: "Emotion-Logic",
    subtitle: "Sales Page Frameworks",
    emoji: "🧠💕",
    description:
      "Combine emotional pull with logical proof to convert.",
    promptHint:
      "Lead with feeling, then back it up with specs, proof, and ROI.",
  },
  {
    id: "strong-weak",
    title: "Strong-Weak",
    subtitle: "Sales Page Frameworks",
    emoji: "📈📉",
    description:
      "Highlight the strongest benefits and address weak points honestly.",
    promptHint:
      "Put best benefits first, then address weak spots with solutions.",
  },
  {
    id: "consistent-contrasting",
    title: "Consistent-Contrasting",
    subtitle: "Sales Page Frameworks",
    emoji: "🚀",
    description:
      "Use clear consistency plus contrast to make the message pop.",
    promptHint:
      "Keep structure consistent; use contrast for key benefits and CTA.",
  },
  {
    id: "five-basic-objections",
    title: "5 Basic Objections",
    subtitle: "Sales Page Frameworks",
    emoji: "🛑",
    description:
      "Proactively handle the top objections before customers ask.",
    promptHint:
      "Address price, time, trust, need, and fit with proof.",
  },
  {
    id: "awareness-comprehension-conviction-action",
    title: "Awareness-Comprehension-Conviction-Action",
    subtitle: "Sales Page Frameworks",
    emoji: "📈👀🧠💪💰",
    description:
      "Guide prospects through the stages that lead to purchase.",
    promptHint:
      "Start with awareness, build understanding, create conviction, then CTA.",
  },
  {
    id: "picture-promise-prove-push",
    title: "Picture-Promise-Prove-Push",
    subtitle: "Sales Page Frameworks",
    emoji: "📷💍💪",
    description:
      "Paint the picture, make a promise, prove it, then push to action.",
    promptHint:
      "Vivid scenario + promise + proof + urgency CTA.",
  },
  {
    id: "star-story-solution",
    title: "Star-Story-Solution",
    subtitle: "Sales Page Frameworks",
    emoji: "🌟📖💡",
    description:
      "Make the customer the hero, tell a story, then give the solution.",
    promptHint:
      "Customer as star, story arc, then solution and CTA.",
  },
  {
    id: "problem-agitate-solve",
    title: "Problem-Agitate-Solve",
    subtitle: "Sales Page Frameworks",
    emoji: "📈🤔💡",
    description:
      "Identify pain, amplify it, then offer the solution.",
    promptHint:
      "Problem statement, agitation, then solve with offer and CTA.",
  },
  {
    id: "aida",
    title: "Attention-Interest-Desire-Action (AIDA)",
    subtitle: "Sales Page Frameworks",
    emoji: "📢🤔💕💰",
    description:
      "Classic structure: grab attention, build interest, create desire, then action.",
    promptHint:
      "Punchy hook, benefits, proof, then CTA.",
  },
  {
    id: "before-after-bridge",
    title: "Before-After-Bridge",
    subtitle: "Sales Page Frameworks",
    emoji: "🌉",
    description:
      "Show life before, paint the after, then bridge with your product.",
    promptHint:
      "Before pain, after transformation, bridge steps with offer.",
  },
  {
    id: "pastor",
    title: "PASTOR",
    subtitle: "Sales Page Frameworks",
    emoji: "🛍️💰",
    description:
      "Problem, Amplify, Story, Transformation, Offer, Response.",
    promptHint:
      "Clear sections: problem → amplify → story → transformation → offer → response.",
  },
  {
    id: "four-c",
    title: "Four C’s",
    subtitle: "Sales Page Frameworks",
    emoji: "👉📈",
    description:
      "Captivating, Clear, Compelling, Convincing.",
    promptHint:
      "Tight copy: strong headline, clear points, compelling proof, convincing CTA.",
  },
  {
    id: "fab",
    title: "Features-Advantages-Benefits (FAB)",
    subtitle: "Sales Page Frameworks",
    emoji: "📝",
    description:
      "Turn features into advantages, then into real-world benefits.",
    promptHint:
      "List features, explain advantages, then benefits with proof.",
  },
];
