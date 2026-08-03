// Mock data standing in for the Postgres event/concept tables (plan.md §6).
// No backend — the dashboard reads this directly so the UI is fully testable.

export type Category = "global" | "pakistani" | "islamic" | "custom";
export type RunStatus = "not_started" | "generating" | "pending_approval" | "approved";
export type Archetype = "Emotional" | "Educational" | "Modern";

export interface Scores {
  creativity: number;
  eventRelevance: number;
  brandAlignment: number;
  visualUniqueness: number;
  messageQuality: number;
}

export interface Concept {
  id: string;
  archetype: Archetype;
  oneLiner: string;
  caption: string;
  cta: string;
  hashtags: string[];
  gradient: string; // stand-in for the generated background image
  scores: Scores;
}

export interface EventItem {
  id: string;
  name: string;
  date: string; // ISO date
  category: Category;
  status: RunStatus;
  audience: string;
  tone: string;
  sensitivity?: string; // present when the researcher raised a flag
  concepts: Concept[];
}

const scores = (
  creativity: number,
  eventRelevance: number,
  brandAlignment: number,
  visualUniqueness: number,
  messageQuality: number
): Scores => ({ creativity, eventRelevance, brandAlignment, visualUniqueness, messageQuality });

export const events: EventItem[] = [
  {
    id: "independence-day",
    name: "Pakistan Independence Day",
    date: "2026-08-14",
    category: "pakistani",
    status: "pending_approval",
    audience: "Pakistani families and youth",
    tone: "Proud, hopeful",
    concepts: [
      {
        id: "independence-day-c1",
        archetype: "Emotional",
        oneLiner: "The dream of 1947 lives in every one of us.",
        caption:
          "Freedom was earned with courage and sacrifice. This Independence Day, we honour those who dreamed of a nation and remember that the dream is now ours to carry forward.",
        cta: "Share what Pakistan means to you.",
        hashtags: ["#Pakistan", "#IndependenceDay", "#14August"],
        gradient: "linear-gradient(135deg, #01411C 0%, #0a6b34 100%)",
        scores: scores(8, 10, 9, 8, 9),
      },
      {
        id: "independence-day-c2",
        archetype: "Educational",
        oneLiner: "79 years of Pakistan: a story worth knowing.",
        caption:
          "From 14 August 1947 to today — swipe through the milestones that shaped our nation. Knowing our history is how we protect our future.",
        cta: "Learn the moments that made us.",
        hashtags: ["#PakistanHistory", "#14August", "#Azadi"],
        gradient: "linear-gradient(135deg, #0a6b34 0%, #f4f4f4 100%)",
        scores: scores(7, 9, 9, 7, 8),
      },
      {
        id: "independence-day-c3",
        archetype: "Modern",
        oneLiner: "Green. Bold. Ours.",
        caption: "A flag. A feeling. A future. Happy Independence Day, Pakistan.",
        cta: "Tag someone who makes you proud.",
        hashtags: ["#14August", "#PakistanZindabad"],
        gradient: "linear-gradient(135deg, #01411C 0%, #ffffff 100%)",
        scores: scores(9, 9, 8, 9, 8),
      },
    ],
  },
  {
    id: "earth-day",
    name: "Earth Day",
    date: "2026-04-22",
    category: "global",
    status: "approved",
    audience: "Parents and community",
    tone: "Hopeful, action-oriented",
    concepts: [
      {
        id: "earth-day-c1",
        archetype: "Emotional",
        oneLiner: "Protect the planet — it's the only home we share.",
        caption:
          "The Earth gives us everything and asks for care in return. Small acts of love for our planet add up to a future our children can thrive in.",
        cta: "Plant one thing this week.",
        hashtags: ["#EarthDay", "#OurPlanet"],
        gradient: "linear-gradient(135deg, #5B8E7D 0%, #F4E285 100%)",
        scores: scores(8, 10, 9, 8, 9),
      },
      {
        id: "earth-day-c2",
        archetype: "Educational",
        oneLiner: "Small actions today create a greener tomorrow.",
        caption: "Recycle. Reuse. Replant. Here are three habits that make a measurable difference.",
        cta: "Pick one habit to start today.",
        hashtags: ["#EarthDay", "#Sustainability"],
        gradient: "linear-gradient(135deg, #F4A259 0%, #5B8E7D 100%)",
        scores: scores(7, 10, 9, 7, 9),
      },
      {
        id: "earth-day-c3",
        archetype: "Modern",
        oneLiner: "Earth doesn't need us. We need Earth.",
        caption: "A minimal reminder of a maximal truth.",
        cta: "Rethink one habit today.",
        hashtags: ["#EarthDay"],
        gradient: "linear-gradient(135deg, #2E2E2E 0%, #5B8E7D 100%)",
        scores: scores(9, 9, 8, 9, 8),
      },
    ],
  },
  {
    id: "mental-health-day",
    name: "World Mental Health Day",
    date: "2026-10-10",
    category: "global",
    status: "pending_approval",
    audience: "Parents and caregivers",
    tone: "Warm, supportive",
    concepts: [
      {
        id: "mental-health-day-c1",
        archetype: "Emotional",
        oneLiner: "It's okay to not be okay.",
        caption:
          "Your feelings are valid, and asking for help is a sign of strength. This World Mental Health Day, be gentle with yourself and with each other.",
        cta: "Reach out to someone today.",
        hashtags: ["#MentalHealthDay", "#YouMatter"],
        gradient: "linear-gradient(135deg, #F4A259 0%, #FDF6EC 100%)",
        scores: scores(8, 9, 9, 8, 9),
      },
      {
        id: "mental-health-day-c2",
        archetype: "Educational",
        oneLiner: "5 small habits that support your mind.",
        caption: "Rest, connection, movement, boundaries, and asking for help. Simple, proven, powerful.",
        cta: "Save this for a hard day.",
        hashtags: ["#MentalHealth", "#SelfCare"],
        gradient: "linear-gradient(135deg, #5B8E7D 0%, #FDF6EC 100%)",
        scores: scores(7, 9, 9, 7, 8),
      },
      {
        id: "mental-health-day-c3",
        archetype: "Modern",
        oneLiner: "Mind first.",
        caption: "Two words. One priority.",
        cta: "Check in with yourself.",
        hashtags: ["#MentalHealthDay"],
        gradient: "linear-gradient(135deg, #2E2E2E 0%, #F4A259 100%)",
        scores: scores(9, 8, 8, 9, 7),
      },
    ],
  },
  {
    id: "eid-ul-fitr",
    name: "Eid-ul-Fitr",
    date: "2027-03-20",
    category: "islamic",
    status: "generating",
    audience: "Muslim families",
    tone: "Joyful, reverent",
    sensitivity: "Religious event — requires human SME sign-off before approval.",
    concepts: [],
  },
  {
    id: "iqbal-day",
    name: "Iqbal Day",
    date: "2026-11-09",
    category: "pakistani",
    status: "not_started",
    audience: "Students and educators",
    tone: "Inspirational",
    concepts: [],
  },
];

export function getEvent(id: string): EventItem | undefined {
  return events.find((e) => e.id === id);
}
