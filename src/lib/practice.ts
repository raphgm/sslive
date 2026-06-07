// Spaced-repetition practice deck — stored in localStorage per student.
// Wrong answers from any quiz get added to the deck and re-surface on a schedule.

import { Question } from "../types";

const LS_KEY_PREFIX = "sslive_practice_";
const LS_LAST_STUDENT = "sslive_practice_last_student";

export interface PracticeCard {
  id: string;                  // `${quizId}:${questionIndex}`
  quizId: string;
  quizTitle: string;
  questionIndex: number;
  question: Question;
  addedAt: string;             // ISO
  nextReview: string;          // ISO
  easeLevel: number;           // 0+ — increases with each correct review
  timesWrong: number;
  timesCorrect: number;
  /** True when easeLevel >= 5 — graduated, no longer surfaces */
  mastered?: boolean;
}

export interface PracticeDeck {
  studentName: string;
  cards: PracticeCard[];
  updatedAt: string;
}

const keyFor = (studentName: string) =>
  `${LS_KEY_PREFIX}${studentName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

// ─── Read / write ────────────────────────────────────────────────────────────
export function getDeck(studentName: string): PracticeDeck {
  if (!studentName) return { studentName, cards: [], updatedAt: new Date().toISOString() };
  try {
    const raw = localStorage.getItem(keyFor(studentName));
    if (!raw) return { studentName, cards: [], updatedAt: new Date().toISOString() };
    const parsed = JSON.parse(raw);
    return { studentName, cards: parsed.cards || [], updatedAt: parsed.updatedAt || new Date().toISOString() };
  } catch {
    return { studentName, cards: [], updatedAt: new Date().toISOString() };
  }
}

export function saveDeck(deck: PracticeDeck): void {
  if (!deck.studentName) return;
  try {
    localStorage.setItem(
      keyFor(deck.studentName),
      JSON.stringify({ cards: deck.cards, updatedAt: new Date().toISOString() }),
    );
    localStorage.setItem(LS_LAST_STUDENT, deck.studentName);
  } catch (e) {
    console.warn("Failed to save practice deck", e);
  }
}

export function getLastStudent(): string {
  try { return localStorage.getItem(LS_LAST_STUDENT) || ""; } catch { return ""; }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Push wrong questions from a finished quiz attempt into the deck. */
export function addWrongAnswers(
  studentName: string,
  quizId: string,
  quizTitle: string,
  wrongQuestions: Array<{ questionIndex: number; question: Question }>,
): PracticeDeck {
  const deck = getDeck(studentName);
  const now = new Date();
  // First review tomorrow
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

  wrongQuestions.forEach(({ questionIndex, question }) => {
    const id = `${quizId}:${questionIndex}`;
    const existing = deck.cards.find(c => c.id === id);
    if (existing) {
      // Re-failed in a fresh attempt — drop ease, schedule sooner
      existing.timesWrong += 1;
      existing.easeLevel = 0;
      existing.mastered = false;
      existing.nextReview = tomorrow;
    } else {
      deck.cards.push({
        id,
        quizId,
        quizTitle,
        questionIndex,
        question,
        addedAt: now.toISOString(),
        nextReview: tomorrow,
        easeLevel: 0,
        timesWrong: 1,
        timesCorrect: 0,
      });
    }
  });

  saveDeck(deck);
  return deck;
}

/** Record an answer on a practice card — updates ease + next review schedule. */
export function recordPracticeAnswer(
  studentName: string,
  cardId: string,
  wasCorrect: boolean,
): PracticeDeck {
  const deck = getDeck(studentName);
  const card = deck.cards.find(c => c.id === cardId);
  if (!card) return deck;

  const now = Date.now();

  if (wasCorrect) {
    card.timesCorrect += 1;
    card.easeLevel = Math.min(card.easeLevel + 1, 5);
    // Doubling-ish schedule: 1d, 2d, 4d, 7d, 14d, mastered
    const days = [1, 2, 4, 7, 14, 30][card.easeLevel] || 30;
    card.nextReview = new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
    if (card.easeLevel >= 5) card.mastered = true;
  } else {
    card.timesWrong += 1;
    card.easeLevel = 0;
    card.mastered = false;
    card.nextReview = new Date(now + 24 * 60 * 60 * 1000).toISOString();
  }

  saveDeck(deck);
  return deck;
}

// ─── Queries ─────────────────────────────────────────────────────────────────
export function getDueCards(studentName: string): PracticeCard[] {
  const deck = getDeck(studentName);
  const now = Date.now();
  return deck.cards.filter(c => !c.mastered && new Date(c.nextReview).getTime() <= now);
}

export function getDeckStats(studentName: string) {
  const deck = getDeck(studentName);
  const now = Date.now();
  const total = deck.cards.length;
  const due = deck.cards.filter(c => !c.mastered && new Date(c.nextReview).getTime() <= now).length;
  const mastered = deck.cards.filter(c => c.mastered).length;
  const learning = total - mastered - due;
  return { total, due, mastered, learning };
}
