// Cross-database sync to the skill.sch Firestore — used to credit students with
// XP and log activity when they finish a SSLive quiz launched from a skill.sch
// lesson. Both apps live under the same Firebase project (skillschwebsite-20e2d)
// but SSLive talks to a separate Firestore database (ai-studio-...) for its
// rooms/participants. The student-facing data (users/{uid} with totalXp + topicXp)
// lives in the DEFAULT database, so we open a second Firestore client just for
// these writes.

import { initializeApp, getApp, getApps } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  increment,
  serverTimestamp,
  Firestore,
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

let _defaultDb: Firestore | null = null;
const getDefaultDb = (): Firestore => {
  if (_defaultDb) return _defaultDb;
  // Reuse the existing app instance — only the database client differs
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  _defaultDb = getFirestore(app); // omit database id -> connects to (default)
  return _defaultDb;
};

export interface QuizActivityRecord {
  studentUid: string;
  studentName?: string;
  studentEmail?: string;
  quizTitle: string;
  course?: string;
  score: number;
  correct: number;
  wrong: number;
  total: number;
  maxStreak: number;
}

/**
 * Credits XP to the student's profile on skill.sch and logs the quiz activity.
 * Resolves silently on failure — UX should never depend on this succeeding.
 */
export async function creditSkillSchXp(record: QuizActivityRecord): Promise<{ ok: boolean; error?: string }> {
  if (!record.studentUid) {
    return { ok: false, error: "No student UID" };
  }
  try {
    const db = getDefaultDb();

    // 1. Update users/{uid} — increments totalXp + bumps a per-topic counter
    const userRef = doc(db, "users", record.studentUid);
    const topicKey = (record.course || record.quizTitle).slice(0, 80);
    // Use setDoc + merge so it works whether the doc exists or not
    await setDoc(
      userRef,
      {
        totalXp: increment(record.score),
        topicXp: { [topicKey]: increment(record.score) },
        lastSsliveQuizAt: serverTimestamp(),
        ...(record.studentEmail ? { email: record.studentEmail } : {}),
        ...(record.studentName  ? { name:  record.studentName  } : {}),
      },
      { merge: true },
    );

    // 2. Append to a per-user activity sub-collection
    const activityRef = collection(db, "users", record.studentUid, "sslive_quiz_activity");
    await addDoc(activityRef, {
      quizTitle: record.quizTitle,
      course: record.course || null,
      score: record.score,
      correct: record.correct,
      wrong: record.wrong,
      total: record.total,
      maxStreak: record.maxStreak,
      createdAt: serverTimestamp(),
      source: "sslive-quickquiz",
    });

    return { ok: true };
  } catch (err: any) {
    console.warn("creditSkillSchXp failed:", err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}
