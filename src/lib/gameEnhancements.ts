// Game enhancements: sounds, nicknames, "did you know?" facts.
// All client-side — no asset uploads needed (Web Audio API for sounds).

// ─── Sounds ──────────────────────────────────────────────────────────────────
let _ctx: AudioContext | null = null;
const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); }
    catch { return null; }
  }
  return _ctx;
};

const tone = (freq: number, durationMs: number, type: OscillatorType = "sine", volume = 0.15) => {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch {}
};

const sequence = (notes: Array<{ freq: number; dur: number; delay: number; type?: OscillatorType }>) => {
  notes.forEach(n => setTimeout(() => tone(n.freq, n.dur, n.type || "sine"), n.delay));
};

export type SoundType =
  | "correct" | "wrong" | "streak" | "tick" | "submit" | "join" | "podium" | "powerup" | "reaction";

export const playSound = (kind: SoundType) => {
  switch (kind) {
    case "correct":
      // Cheerful two-note ascending
      sequence([
        { freq: 660, dur: 120, delay: 0, type: "triangle" },
        { freq: 880, dur: 180, delay: 100, type: "triangle" },
      ]);
      break;
    case "wrong":
      // Descending buzz
      sequence([
        { freq: 250, dur: 140, delay: 0, type: "sawtooth" },
        { freq: 180, dur: 200, delay: 120, type: "sawtooth" },
      ]);
      break;
    case "streak":
      // Triumphant arpeggio for streak milestone
      sequence([
        { freq: 523, dur: 100, delay: 0, type: "triangle" },
        { freq: 659, dur: 100, delay: 80, type: "triangle" },
        { freq: 784, dur: 100, delay: 160, type: "triangle" },
        { freq: 1047, dur: 200, delay: 240, type: "triangle" },
      ]);
      break;
    case "tick":
      tone(900, 40, "square", 0.05);
      break;
    case "submit":
      tone(440, 80, "sine", 0.1);
      break;
    case "join":
      sequence([
        { freq: 523, dur: 100, delay: 0, type: "sine" },
        { freq: 784, dur: 150, delay: 100, type: "sine" },
      ]);
      break;
    case "podium":
      // Victory fanfare
      sequence([
        { freq: 523, dur: 150, delay: 0, type: "triangle" },
        { freq: 659, dur: 150, delay: 130, type: "triangle" },
        { freq: 784, dur: 150, delay: 260, type: "triangle" },
        { freq: 1047, dur: 400, delay: 390, type: "triangle" },
        { freq: 1318, dur: 500, delay: 700, type: "triangle" },
      ]);
      break;
    case "powerup":
      sequence([
        { freq: 660, dur: 80, delay: 0, type: "square" },
        { freq: 880, dur: 80, delay: 60, type: "square" },
        { freq: 1100, dur: 120, delay: 120, type: "square" },
      ]);
      break;
    case "reaction":
      tone(700, 60, "sine", 0.08);
      break;
  }
};

// ─── Nickname generator ──────────────────────────────────────────────────────
const ADJECTIVES = [
  "Shiny", "Brave", "Quick", "Mighty", "Cosmic", "Stellar", "Quantum", "Neon",
  "Turbo", "Silent", "Wild", "Mystic", "Royal", "Lucky", "Crystal", "Atomic",
  "Phantom", "Solar", "Lunar", "Electric", "Frosty", "Blazing", "Velvet", "Iron",
  "Golden", "Silver", "Plasma", "Sonic", "Vivid", "Hyper",
];
const NOUNS = [
  "Panda", "Fox", "Tiger", "Eagle", "Wolf", "Dragon", "Phoenix", "Falcon",
  "Hawk", "Lynx", "Otter", "Raven", "Shark", "Whale", "Jaguar", "Cheetah",
  "Cobra", "Mantis", "Hornet", "Owl", "Bear", "Lion", "Pegasus", "Komet",
  "Nova", "Pulsar", "Quark", "Atom", "Nebula", "Photon",
];

export const generateNickname = (): string => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
};

export const generateNicknames = (count = 3): string[] => {
  const out: string[] = [];
  const seen = new Set<string>();
  while (out.length < count) {
    const n = generateNickname();
    if (!seen.has(n)) { seen.add(n); out.push(n); }
  }
  return out;
};

// ─── "Did you know?" facts ──────────────────────────────────────────────────
// Topic-tagged so we can pick relevant ones based on quiz topic.
type Fact = { text: string; tags?: string[] };

const FACTS: Fact[] = [
  // Tech / programming
  { text: "The first computer bug was a literal moth — found in a Harvard relay in 1947.", tags: ["tech", "computing", "history"] },
  { text: "Linux runs on over 96% of the world's top 1 million web servers.", tags: ["linux", "devops", "cloud"] },
  { text: "JavaScript was created in just 10 days by Brendan Eich in May 1995.", tags: ["js", "javascript", "programming"] },
  { text: "The term 'debugging' was popularized by Grace Hopper, a pioneering programmer.", tags: ["tech", "history"] },
  { text: "There are over 700 programming languages in active use today.", tags: ["programming"] },
  { text: "Python is named after Monty Python, not the snake.", tags: ["python", "programming"] },
  { text: "Docker was created in 2013 and revolutionised how we ship software.", tags: ["docker", "devops"] },
  { text: "Kubernetes means 'helmsman' in Greek — the one who steers the ship.", tags: ["kubernetes", "devops"] },
  { text: "AWS launched its first service (S3) in 2006 — predating most modern cloud platforms.", tags: ["aws", "cloud"] },
  { text: "Git was created by Linus Torvalds in 2005 to manage Linux kernel development.", tags: ["git", "devops"] },
  { text: "The 'Cloud' isn't actually in the sky — it's just thousands of servers in data centres.", tags: ["cloud"] },
  { text: "Terraform was created by HashiCorp in 2014 and is now industry-standard for IaC.", tags: ["terraform", "devops"] },

  // Science
  { text: "A teaspoon of neutron star material would weigh about 6 billion tonnes on Earth.", tags: ["science", "astronomy"] },
  { text: "Octopuses have three hearts and blue blood.", tags: ["science", "biology"] },
  { text: "Honey never spoils — archaeologists found edible honey in 3,000-year-old tombs.", tags: ["science", "biology"] },
  { text: "There are more atoms in a glass of water than there are glasses of water in all the oceans.", tags: ["science"] },

  // Learning
  { text: "Spaced repetition can improve long-term retention by up to 200%.", tags: ["learning"] },
  { text: "Teaching others is the most effective way to learn — known as the 'protégé effect'.", tags: ["learning"] },
  { text: "Short, frequent study sessions beat long marathons for memory consolidation.", tags: ["learning"] },
  { text: "Multitasking can reduce productivity by up to 40%.", tags: ["learning"] },

  // Math
  { text: "The number π contains every possible finite digit sequence — your phone number is probably in there.", tags: ["math"] },
  { text: "Zero wasn't widely accepted as a number until the 7th century.", tags: ["math", "history"] },
  { text: "There are infinitely many prime numbers — Euclid proved this over 2,000 years ago.", tags: ["math"] },

  // General
  { text: "The average person blinks about 28,000 times a day.", tags: ["general"] },
  { text: "Bananas are berries, but strawberries aren't.", tags: ["general"] },
];

export const getRandomFact = (topicHint?: string): string => {
  if (topicHint) {
    const hint = topicHint.toLowerCase();
    const matching = FACTS.filter(f =>
      f.tags?.some(t => hint.includes(t) || t.includes(hint))
    );
    if (matching.length > 0) {
      return matching[Math.floor(Math.random() * matching.length)].text;
    }
  }
  return FACTS[Math.floor(Math.random() * FACTS.length)].text;
};

// ─── Streak scoring ──────────────────────────────────────────────────────────
// Bonus points awarded for consecutive correct answers.
// Streak 2 = +1, 3 = +2, 5+ = +5, etc.
export const streakBonus = (currentStreak: number): number => {
  if (currentStreak >= 5) return 5;
  if (currentStreak === 4) return 4;
  if (currentStreak === 3) return 3;
  if (currentStreak === 2) return 2;
  return 0;
};

// ─── Reactions ───────────────────────────────────────────────────────────────
export const REACTIONS = ["👏", "🔥", "😂", "🤯", "💡", "🚀"] as const;
export type Reaction = typeof REACTIONS[number];
