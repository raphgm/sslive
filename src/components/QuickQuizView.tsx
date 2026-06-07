import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Check, X, Trophy, Flame, Zap, Lightbulb, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Question } from "../types";
import { playSound, streakBonus, getRandomFact } from "../lib/gameEnhancements";
import { addWrongAnswers } from "../lib/practice";

export interface QuickQuizPayload {
  title: string;
  course?: string;
  questions: Question[];
}

interface QuickQuizViewProps {
  payload: QuickQuizPayload;
  onExit: () => void;
}

export default function QuickQuizView({ payload, onExit }: QuickQuizViewProps) {
  const [studentName, setStudentName] = useState<string>(() => {
    try { return localStorage.getItem("sslive_practice_last_student") || ""; } catch { return ""; }
  });
  const [nameInput, setNameInput] = useState("");
  const [started, setStarted] = useState(false);

  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [bonusPop, setBonusPop] = useState<{ pts: number; streak: number } | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; chosen: string; answer: string; explanation?: string } | null>(null);
  const [completed, setCompleted] = useState(false);
  const [wrongQs, setWrongQs] = useState<Array<{ questionIndex: number; question: Question }>>([]);
  const [funFact] = useState(() => getRandomFact());

  const total = payload.questions.length;
  const currentQ = payload.questions[qIdx];

  const handleAnswer = (selectedAnswer: string) => {
    if (!currentQ || feedback) return;
    let isCorrect: boolean;
    if (currentQ.type === "multiple-choice") {
      const idx = currentQ.options.findIndex(o => o === selectedAnswer);
      isCorrect = idx !== -1 && idx === currentQ.correctOptionIndex;
    } else {
      isCorrect = String(selectedAnswer).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();
    }

    const newStreak = isCorrect ? streak + 1 : 0;
    const bonus = isCorrect ? streakBonus(newStreak) : 0;
    const earned = isCorrect ? 1 + bonus : 0;

    if (isCorrect) {
      playSound(bonus > 0 ? "streak" : "correct");
      if (bonus > 0) {
        setBonusPop({ pts: bonus, streak: newStreak });
        setTimeout(() => setBonusPop(null), 2200);
      }
    } else {
      playSound("wrong");
      setWrongQs(w => [...w, { questionIndex: qIdx, question: currentQ }]);
    }

    setScore(s => s + earned);
    setStreak(newStreak);
    setMaxStreak(m => Math.max(m, newStreak));
    setFeedback({
      correct: isCorrect,
      chosen: selectedAnswer,
      answer: currentQ.correctAnswer,
      explanation: currentQ.explanation,
    });
  };

  const next = () => {
    setFeedback(null);
    if (qIdx + 1 < total) {
      setQIdx(i => i + 1);
    } else {
      // Finish: persist wrong answers to practice deck
      try {
        if (studentName && wrongQs.length > 0) {
          addWrongAnswers(studentName, `skillsch-${Date.now()}`, payload.title, wrongQs);
        }
      } catch {}
      setCompleted(true);
      playSound("podium");
      const burst = (x: number) => confetti({ particleCount: 60, spread: 70, origin: { x, y: 0.6 }, colors: ["#fbbf24", "#f59e0b", "#fcd34d", "#fb923c"] });
      burst(0.2);
      burst(0.8);
    }
  };

  // ─── Name prompt ──────────────────────────────────────────────────────────
  if (!studentName || !started) {
    return (
      <div className="min-h-screen bg-neutral-50/60 text-slate-800 font-sans flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-3xs space-y-5">
          <button onClick={onExit} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={13} /> Back
          </button>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white mx-auto flex items-center justify-center shadow-sm text-xl">
              🚀
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold">From skill.sch</p>
            <h2 className="text-lg font-display font-black text-slate-900 leading-tight">{payload.title}</h2>
            {payload.course && <p className="text-xs text-slate-500">{payload.course}</p>}
            <p className="text-[11px] text-slate-500 mt-2">
              {total} questions · streak bonuses · wrong answers saved for practice
            </p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); const v = nameInput.trim() || studentName; if (v) { setStudentName(v); setStarted(true); } }}>
            {!studentName && (
              <input
                type="text"
                placeholder="Your name (saves your practice deck)"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:border-amber-500 focus:outline-hidden text-sm text-slate-800 mb-3"
                required
                autoFocus
              />
            )}
            {studentName && (
              <p className="text-xs text-slate-500 text-center mb-3">
                Welcome back, <strong className="text-slate-800">{studentName}</strong>
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold rounded-xl transition-all"
            >
              🎯 Start Quiz
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Completion screen ───────────────────────────────────────────────────
  if (completed) {
    const correctCount = total - wrongQs.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50/40 via-white to-orange-50/40 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-xl space-y-5 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30">
            <Trophy size={28} />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold mb-1">Quiz Complete</p>
            <h2 className="text-2xl font-display font-black text-slate-900">{payload.title}</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl">
              <p className="text-2xl font-mono font-black text-emerald-700">{correctCount}</p>
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Correct</p>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200/60 rounded-xl">
              <p className="text-2xl font-mono font-black text-rose-600">{wrongQs.length}</p>
              <p className="text-[9px] font-bold text-rose-600 uppercase tracking-wider mt-0.5">Wrong</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
              <p className="text-2xl font-mono font-black text-slate-800">{pct}%</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">Score</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/60 border border-amber-200/60 rounded-xl p-3">
            <p className="text-xs text-slate-700">
              <strong className="text-amber-700">{score} points</strong> · Max streak: <strong>{maxStreak}x</strong>
            </p>
          </div>
          {wrongQs.length > 0 && (
            <p className="text-[11px] text-slate-500">
              💡 {wrongQs.length} question{wrongQs.length === 1 ? "" : "s"} saved to your practice deck
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setQIdx(0); setScore(0); setStreak(0); setMaxStreak(0);
                setWrongQs([]); setFeedback(null); setCompleted(false);
              }}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} /> Retry
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white text-xs font-bold rounded-xl"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Active quiz screen ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-neutral-50/60 text-slate-800 font-sans">
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={onExit} className="text-xs text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1.5">
            <ArrowLeft size={13} /> Exit
          </button>
          <span className="text-[11px] font-mono text-slate-500 truncate max-w-[160px]">{payload.title}</span>
          <span className="text-[11px] font-mono text-amber-600 font-bold">
            <Zap size={11} className="inline mr-0.5" />{score}
          </span>
        </div>
        <div className="w-full h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-300"
            style={{ width: `${((qIdx + (feedback ? 1 : 0)) / total) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            Q {qIdx + 1} / {total}
          </span>
          {streak >= 2 && (
            <motion.span
              key={streak}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-full text-[10px] font-bold text-orange-700"
            >
              <Flame size={11} className="text-orange-500" />
              {streak}x
            </motion.span>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs">
          <h3 className="text-base font-display font-bold text-slate-900 leading-snug">{currentQ.text}</h3>
        </div>

        <AnimatePresence mode="wait">
          {!feedback ? (
            <motion.div
              key={`q-${qIdx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {(currentQ.type === "multiple-choice" || currentQ.type === "poll") && currentQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(opt)}
                  className="w-full p-3.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-sm text-slate-800 font-medium text-left transition-colors"
                >
                  {opt}
                </button>
              ))}
              {currentQ.type === "true-false" && ["True", "False"].map(v => (
                <button
                  key={v}
                  onClick={() => handleAnswer(v)}
                  className="w-full p-3.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-xl text-sm text-slate-800 font-bold transition-colors"
                >
                  {v}
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key={`fb-${qIdx}`}
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
              {!feedback.correct && (
                <p className="text-xs text-slate-700 mb-1">
                  Correct: <strong className="text-emerald-700">{feedback.answer}</strong>
                </p>
              )}
              {feedback.explanation && (
                <p className="text-[11px] text-slate-600 italic leading-relaxed mb-2">{feedback.explanation}</p>
              )}
              {!feedback.correct && qIdx === 0 && funFact && (
                <div className="mt-3 p-2.5 bg-amber-50/80 border border-amber-200/60 rounded-lg flex items-start gap-2">
                  <Lightbulb size={13} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">Did you know?</p>
                    <p className="text-[11px] text-amber-900">{funFact}</p>
                  </div>
                </div>
              )}
              <button
                onClick={next}
                className="w-full mt-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
              >
                {qIdx + 1 < total ? "Next →" : "Finish 🏆"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {bonusPop && (
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-2xl flex items-center gap-2.5"
          style={{ background: "linear-gradient(135deg, #f97316, #ef4444)", boxShadow: "0 20px 50px -10px rgba(239,68,68,0.5)" }}
        >
          <Flame size={18} className="text-yellow-200" />
          <div>
            <div className="font-black">+{bonusPop.pts} Streak Bonus!</div>
            <div className="text-[10px] opacity-90 font-mono">{bonusPop.streak} correct in a row</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
