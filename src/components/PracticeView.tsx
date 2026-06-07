import React, { useState, useMemo } from "react";
import { ArrowLeft, Brain, Check, X, RotateCcw, Trophy, Clock, Flame } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  PracticeCard,
  getDueCards,
  getDeckStats,
  recordPracticeAnswer,
  getLastStudent,
} from "../lib/practice";
import { playSound } from "../lib/gameEnhancements";

interface PracticeViewProps {
  onExit: () => void;
  /** Optional override — if not passed, picks up last-used student name */
  studentName?: string;
}

export default function PracticeView({ onExit, studentName: studentOverride }: PracticeViewProps) {
  const [studentName, setStudentName] = useState(studentOverride || getLastStudent() || "");
  const [nameInput, setNameInput] = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [dueCards, setDueCards] = useState<PracticeCard[]>([]);
  const [feedback, setFeedback] = useState<{ correct: boolean; correctAnswer: string; explanation?: string } | null>(null);
  const [stats, setStats] = useState(() => studentName ? getDeckStats(studentName) : { total: 0, due: 0, mastered: 0, learning: 0 });
  const [sessionScore, setSessionScore] = useState({ correct: 0, wrong: 0 });

  const currentCard = dueCards[currentCardIndex];

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const startSession = (name: string) => {
    const due = getDueCards(name);
    if (due.length === 0) {
      setStudentName(name);
      setStats(getDeckStats(name));
      return;
    }
    setStudentName(name);
    setDueCards(due);
    setCurrentCardIndex(0);
    setSessionActive(true);
    setSessionScore({ correct: 0, wrong: 0 });
    setStats(getDeckStats(name));
  };

  const handleAnswer = (answer: string) => {
    if (!currentCard || feedback) return;
    const q = currentCard.question;
    let correct: boolean;
    if (q.type === "multiple-choice") {
      const idx = q.options.findIndex(o => o === answer);
      correct = idx !== -1 && idx === q.correctOptionIndex;
    } else if (q.type === "puzzle-order") {
      const expected = (q.correctAnswer || q.options.join("|")).trim();
      correct = answer.trim() === expected;
    } else {
      correct = answer.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
    }
    playSound(correct ? "correct" : "wrong");
    setFeedback({ correct, correctAnswer: q.correctAnswer, explanation: q.explanation });
    recordPracticeAnswer(studentName, currentCard.id, correct);
    setSessionScore(s => correct ? { ...s, correct: s.correct + 1 } : { ...s, wrong: s.wrong + 1 });
  };

  const nextCard = () => {
    setFeedback(null);
    if (currentCardIndex + 1 < dueCards.length) {
      setCurrentCardIndex(i => i + 1);
    } else {
      // Session complete
      setSessionActive(false);
      setStats(getDeckStats(studentName));
      playSound("podium");
    }
  };

  // ─── Render: name prompt ──────────────────────────────────────────────────
  if (!studentName) {
    return (
      <div className="min-h-screen bg-neutral-50/60 text-slate-800 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-3xs space-y-5">
          <button onClick={onExit} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={13} /> Back
          </button>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mx-auto flex items-center justify-center shadow-sm">
              <Brain size={22} />
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900">Practice Mode</h2>
            <p className="text-xs text-slate-500">Enter your name to load your practice deck — wrong answers from past quizzes return on a spaced schedule.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (nameInput.trim()) setStudentName(nameInput.trim()); }}>
            <input
              type="text"
              placeholder="Your name (as used in quizzes)"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-hidden text-sm text-slate-800 mb-3"
              autoFocus
            />
            <button type="submit" className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white text-xs font-bold rounded-xl transition-opacity">
              Load my deck
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Render: session complete or empty deck ───────────────────────────────
  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-neutral-50/60 text-slate-800 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-3xs space-y-5">
          <button onClick={onExit} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={13} /> Back
          </button>

          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mx-auto flex items-center justify-center shadow-sm">
              <Brain size={22} />
            </div>
            <h2 className="text-lg font-display font-bold text-slate-900">Practice Deck</h2>
            <p className="text-xs text-slate-500">Welcome back, <strong className="text-slate-700">{studentName}</strong></p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-center">
              <p className="text-2xl font-mono font-black text-amber-700">{stats.due}</p>
              <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">Due now</p>
            </div>
            <div className="p-3 bg-sky-50 border border-sky-200/60 rounded-xl text-center">
              <p className="text-2xl font-mono font-black text-sky-700">{stats.learning}</p>
              <p className="text-[9px] font-bold text-sky-600 uppercase tracking-wider mt-0.5">Learning</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-center">
              <p className="text-2xl font-mono font-black text-emerald-700">{stats.mastered}</p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Mastered</p>
            </div>
          </div>

          {sessionScore.correct + sessionScore.wrong > 0 && (
            <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/40 border border-indigo-200/40 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Last session</p>
              <p className="text-sm text-slate-700">
                <strong className="text-emerald-700">{sessionScore.correct}</strong> correct ·{" "}
                <strong className="text-rose-600">{sessionScore.wrong}</strong> wrong
              </p>
            </div>
          )}

          {stats.due > 0 ? (
            <button
              onClick={() => startSession(studentName)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white text-sm font-bold rounded-xl transition-opacity flex items-center justify-center gap-2"
            >
              <Flame size={14} /> Start practice ({stats.due} due)
            </button>
          ) : stats.total === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">No cards yet 📚</p>
              <p className="text-[11px] text-slate-400">Take a live quiz — wrong answers will appear here for review.</p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <Trophy className="mx-auto text-emerald-600 mb-1" size={20} />
              <p className="text-xs font-bold text-emerald-700">All caught up!</p>
              <p className="text-[11px] text-emerald-600 mt-1">No cards due. Check back tomorrow.</p>
            </div>
          )}

          <button
            onClick={() => { setStudentName(""); setNameInput(""); }}
            className="w-full py-2 text-[11px] text-slate-400 hover:text-slate-700 transition-colors"
          >
            Switch student
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: active practice session ──────────────────────────────────────
  if (!currentCard) return null;
  const q = currentCard.question;

  return (
    <div className="min-h-screen bg-neutral-50/60 text-slate-800 font-sans">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSessionActive(false)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={13} /> Pause
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            <Brain size={11} className="inline mr-1" />
            {currentCardIndex + 1} / {dueCards.length}
          </span>
        </div>
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
            style={{ width: `${((currentCardIndex + (feedback ? 1 : 0)) / dueCards.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 py-6 space-y-5">
        {/* Source attribution */}
        <div className="text-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            from quiz: {currentCard.quizTitle}
          </span>
          {currentCard.timesWrong > 1 && (
            <p className="text-[10px] text-rose-500 mt-1 font-mono">⚠️ Missed {currentCard.timesWrong}× before</p>
          )}
        </div>

        {/* Question */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
          <h3 className="text-base font-display font-bold text-slate-900 leading-snug">{q.text}</h3>
        </div>

        {/* Answer options */}
        <AnimatePresence mode="wait">
          {!feedback ? (
            <motion.div
              key="answers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {(q.type === "multiple-choice" || q.type === "poll") && q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="w-full p-3.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-sm text-slate-800 font-medium text-left transition-colors"
                >
                  {opt}
                </button>
              ))}
              {q.type === "true-false" && ["True", "False"].map(v => (
                <button
                  key={v}
                  onClick={() => handleAnswer(v)}
                  className="w-full p-3.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-sm text-slate-800 font-bold transition-colors"
                >
                  {v}
                </button>
              ))}
              {q.type === "short-answer" && (
                <form onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem("a") as HTMLInputElement).value; if (v.trim()) handleAnswer(v.trim()); }}>
                  <input name="a" type="text" placeholder="Your answer..." className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:border-indigo-500 focus:outline-hidden" autoFocus />
                  <button type="submit" className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors">Submit</button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-2xl border-2 ${feedback.correct ? "bg-emerald-50 border-emerald-200" : "bg-rose-50 border-rose-200"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center ${feedback.correct ? "bg-emerald-500" : "bg-rose-500"}`}>
                  {feedback.correct ? <Check size={15} /> : <X size={15} />}
                </div>
                <p className={`font-bold text-sm ${feedback.correct ? "text-emerald-800" : "text-rose-800"}`}>
                  {feedback.correct ? "Correct!" : "Not quite"}
                </p>
              </div>
              <p className="text-xs text-slate-700 mb-2">
                Correct answer: <strong className="text-emerald-700">{feedback.correctAnswer}</strong>
              </p>
              {feedback.explanation && (
                <p className="text-[11px] text-slate-600 italic leading-relaxed">{feedback.explanation}</p>
              )}
              <button
                onClick={nextCard}
                className="w-full mt-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {currentCardIndex + 1 < dueCards.length ? "Next card →" : "Finish session"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Session score */}
        <div className="text-center text-[11px] font-mono text-slate-400">
          <span className="text-emerald-600">{sessionScore.correct} ✓</span>
          {" · "}
          <span className="text-rose-500">{sessionScore.wrong} ✗</span>
        </div>
      </main>
    </div>
  );
}
