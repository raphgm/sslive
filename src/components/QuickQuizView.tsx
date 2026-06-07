import React, { useState } from "react";
import { ArrowLeft, Check, X, Trophy, Flame, Zap, Lightbulb, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";
import { Question } from "../types";
import { playSound, streakBonus, getRandomFact } from "../lib/gameEnhancements";
import { addWrongAnswers } from "../lib/practice";
import { creditSkillSchXp } from "../lib/skillschSync";
import { Doodles } from "./Doodles";

export interface QuickQuizPayload {
  title: string;
  course?: string;
  questions: Question[];
  /** skill.sch student UID (passed from the deep link). When present, XP is
   *  credited back to skill.sch on quiz completion. */
  studentUid?: string;
  /** skill.sch student display name (optional, used for nicer activity records) */
  studentName?: string;
  /** skill.sch student email (optional) */
  studentEmail?: string;
}

interface QuickQuizViewProps {
  payload: QuickQuizPayload;
  onExit: () => void;
}

// ── Shell: matches StudentScreen — Doodles bg, animated 3-circle logo header, footer ──
function QuickQuizShell({
  children,
  onExit,
  rightChip,
}: {
  children: React.ReactNode;
  onExit: () => void;
  rightChip?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between p-4 md:p-6 font-sans text-slate-800 relative z-0">
      <Doodles />

      {/* Top logo header — mirrors StudentScreen */}
      <header className="max-w-[600px] mx-auto w-full pt-6 flex justify-between items-center bg-transparent gap-4 relative z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-sm font-semibold mr-1"
            title="Return to Home Screen"
            type="button"
          >
            <ArrowLeft size={12} className="text-slate-400" />
            <span>Home</span>
          </button>

          <div className="flex items-center gap-2 select-none touch-none ml-1">
            <div className="relative w-8 h-8 flex items-center justify-center overflow-visible">
              <motion.div
                className="absolute w-[14px] h-[14px] rounded-full bg-[#fbbf24] opacity-90 shadow-[0_1px_3px_rgba(251,191,36,0.3)]"
                animate={{ x: [0, -5, -5, 0], y: [0, -4, -4, 0], scale: [1, 1.05, 1.05, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.65, 1] }}
              />
              <motion.div
                className="absolute w-[14px] h-[14px] rounded-full bg-[#10b981] opacity-90 shadow-[0_1px_3px_rgba(16,185,129,0.3)]"
                animate={{ x: [0, 5, 5, 0], y: [0, -4, -4, 0], scale: [1, 1.05, 1.05, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.65, 1], delay: 0.1 }}
              />
              <motion.div
                className="absolute w-[14px] h-[14px] rounded-full bg-[#6366f1] opacity-90 shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
                animate={{ x: [0, 0, 0, 0], y: [0, 5, 5, 0], scale: [1, 1.05, 1.05, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.35, 0.65, 1], delay: 0.2 }}
              />
            </div>
            <div className="flex items-center gap-1 text-[15px] sm:text-[17px] font-display font-bold tracking-tight text-slate-800 leading-[1.15] ml-1">
              <span>SSlive</span>
              <span>Student</span>
            </div>
          </div>
        </div>

        {rightChip && (
          <div className="flex items-center bg-white/70 backdrop-blur-xl px-3 py-1.5 rounded-full border border-slate-200/60 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] gap-1.5 ml-4 w-fit min-w-0">
            {rightChip}
          </div>
        )}
      </header>

      {/* Main content area */}
      <main className="max-w-md mx-auto w-full py-8 flex-1 flex flex-col justify-center relative z-10">
        {children}
      </main>

      {/* SSlive Wisdom Footer */}
      <footer className="max-w-md mx-auto w-full pb-4 text-center text-[10px] font-sans text-slate-400 tracking-wide relative z-10">
        Powered by SKILL.SCH | Interactive Meeting Forums
      </footer>
    </div>
  );
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
  const [syncedXp, setSyncedXp] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

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

      // Credit XP back to skill.sch user profile (silent if not signed in)
      if (payload.studentUid) {
        const correct = total - wrongQs.length;
        creditSkillSchXp({
          studentUid: payload.studentUid,
          studentName: payload.studentName,
          studentEmail: payload.studentEmail,
          quizTitle: payload.title,
          course: payload.course,
          score,
          correct,
          wrong: wrongQs.length,
          total,
          maxStreak,
        }).then(r => {
          if (r.ok) setSyncedXp(score);
          else setSyncError(r.error || null);
        });
      }

      setCompleted(true);
      playSound("podium");
      // Confetti! 🎉
      const burst = (x: number) => confetti({
        particleCount: 80,
        spread: 75,
        origin: { x, y: 0.6 },
        colors: ["#fbbf24", "#f59e0b", "#fcd34d", "#fb923c", "#a78bfa", "#60a5fa"],
        scalar: 1.05,
      });
      burst(0.2);
      burst(0.8);
      // Recurring smaller bursts for 5s
      const repeat = setInterval(() => burst(Math.random()), 1100);
      setTimeout(() => clearInterval(repeat), 5000);
    }
  };

  // ─── Name prompt ──────────────────────────────────────────────────────────
  if (!studentName || !started) {
    return (
      <QuickQuizShell
        onExit={onExit}
        rightChip={
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="text-amber-800 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">From skill.sch</span>
          </>
        }
      >
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-3xs space-y-5">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white mx-auto flex items-center justify-center shadow-sm text-xl">
              🚀
            </div>
            <h2 className="text-lg font-display font-black text-slate-900 leading-tight">{payload.title}</h2>
            {payload.course && <p className="text-xs text-slate-500">{payload.course}</p>}
            <p className="text-[11px] text-slate-500 mt-2">
              {total} questions · streak bonuses · wrong answers saved for practice
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = nameInput.trim() || studentName;
              if (v) { setStudentName(v); setStarted(true); }
            }}
          >
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
      </QuickQuizShell>
    );
  }

  // ─── Completion screen ───────────────────────────────────────────────────
  if (completed) {
    const correctCount = total - wrongQs.length;
    const pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <QuickQuizShell
        onExit={onExit}
        rightChip={
          <>
            <Trophy size={11} className="text-amber-500 shrink-0" />
            <span className="text-amber-700 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Complete</span>
          </>
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] space-y-6 text-center relative overflow-hidden"
        >
          {/* subtle animated background glow */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[50%] bg-gradient-to-b from-amber-50 to-transparent pointer-events-none" />

          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative mx-auto w-20 h-20"
          >
            <div className="absolute inset-0 bg-amber-400/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/30 border-4 border-white">
              <Trophy size={32} />
            </div>
          </motion.div>
          
          <div className="relative z-10">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-amber-600 font-black mb-2">Quiz Complete</p>
            <h2 className="text-3xl font-display font-black text-slate-900 tracking-tight leading-tight">{payload.title}</h2>
          </div>

          <div className="grid grid-cols-3 gap-3 relative z-10">
            <motion.div 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-2xl shadow-sm"
            >
              <p className="text-3xl font-mono font-black text-emerald-600 leading-none">{correctCount}</p>
              <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest mt-1.5">Correct</p>
            </motion.div>
            <motion.div 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="p-4 bg-gradient-to-br from-rose-50 to-pink-50/50 border border-rose-100 rounded-2xl shadow-sm"
            >
              <p className="text-3xl font-mono font-black text-rose-600 leading-none">{wrongQs.length}</p>
              <p className="text-[10px] font-bold text-rose-600/80 uppercase tracking-widest mt-1.5">Wrong</p>
            </motion.div>
            <motion.div 
              initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
              className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/50 border border-slate-200/60 rounded-2xl shadow-sm"
            >
              <p className="text-3xl font-mono font-black text-slate-800 leading-none">{pct}%</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Score</p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/50 rounded-2xl p-4 flex justify-between items-center relative z-10"
          >
            <div className="text-left">
              <p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wider">Final Score</p>
              <p className="text-xl font-black text-amber-600 leading-none mt-0.5">{score} pts</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-wider">Max Streak</p>
              <p className="text-base font-bold text-amber-700 leading-none mt-1">{maxStreak}x 🔥</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="relative z-10 space-y-4">
            {wrongQs.length > 0 && (
              <p className="text-xs text-slate-500 font-medium bg-slate-50 rounded-xl py-2 px-3 inline-block">
                💡 <strong className="text-slate-700">{wrongQs.length} question{wrongQs.length === 1 ? "" : "s"}</strong> saved to your practice deck
              </p>
            )}
            
            {payload.studentUid && syncedXp !== null && (
              <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-emerald-800 text-xs font-bold shadow-sm">
                <span className="text-base">✨</span>
                <span>+{syncedXp} XP added to your SKILL.SCH dashboard</span>
              </div>
            )}
            
            {payload.studentUid && syncedXp === null && !syncError && (
              <p className="text-[10px] text-slate-400 font-mono animate-pulse">Syncing XP to your SKILL.SCH dashboard…</p>
            )}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setQIdx(0); setScore(0); setStreak(0); setMaxStreak(0);
                  setWrongQs([]); setFeedback(null); setCompleted(false);
                }}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors active:scale-95"
              >
                <RotateCcw size={16} /> Retry
              </button>
              <button
                onClick={onExit}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/25 active:scale-95"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      </QuickQuizShell>
    );
  }

  // ─── Active quiz screen ──────────────────────────────────────────────────
  return (
    <QuickQuizShell
      onExit={onExit}
      rightChip={
        <>
          <Zap size={11} className="text-amber-500 shrink-0" />
          <span className="text-slate-700 text-[10px] sm:text-[11px] font-bold font-mono">{score} pts</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500 text-[10px] sm:text-[11px] font-mono">Q {qIdx + 1}/{total}</span>
        </>
      }
    >
      <div className="space-y-5">
        {/* Progress bar */}
        <div className="w-full h-1 bg-slate-200/70 rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${((qIdx + (feedback ? 1 : 0)) / total) * 100}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            From: {payload.title}
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
      </div>

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
    </QuickQuizShell>
  );
}
