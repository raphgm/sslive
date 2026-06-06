import React, { useState, useEffect } from "react";
import { Sparkles, Send, Check } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";

interface DialecticProps {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
  roomId: string;
  participantId: string;
}

export function DialecticChallengeCard({
  question,
  studentAnswer,
  correctAnswer,
  roomId,
  participantId,
}: DialecticProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [rebuttal, setRebuttal] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const fetchPrompt = async () => {
      try {
        const res = await fetch("/api/inquiry/dialectic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, studentAnswer, correctAnswer }),
        });
        const data = await res.json();
        if (active && data && data.prompt) {
          setPrompt(data.prompt);
        }
      } catch (err) {
        console.error("Dialectic fetch failed:", err);
        if (active) {
          setPrompt(`If we assume "${studentAnswer}" is completely correct, what values or metrics are we prioritizing above all else?`);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPrompt();
    return () => {
      active = false;
    };
  }, [question, studentAnswer, correctAnswer]);

  const handleSubmitRebuttal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rebuttal.trim() || sending) return;

    setSending(true);
    try {
      const pRef = doc(db, "rooms", roomId, "participants", participantId);
      // Store rebuttal in participant document so classmates can see it in discussions
      await updateDoc(pRef, {
        rebuttalText: rebuttal.trim(),
        rebuttalTimestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to commit rebuttal:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div id="dialectic-card" className="bg-[#0f172a] text-slate-100 p-4.5 rounded-2xl border border-indigo-500/35 relative overflow-hidden shadow-lg mt-3">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white scale-90">
          <Sparkles size={11} className="animate-pulse" />
        </div>
        <p className="font-mono text-[9px] text-indigo-300 font-extrabold tracking-widest uppercase mb-0">
          Inquiry AI Challenger Active
        </p>
      </div>

      {loading ? (
        <div className="space-y-2 py-2">
          <div className="h-3.5 bg-slate-800/80 rounded-md animate-pulse w-3/4" />
          <div className="h-3 bg-slate-800/80 rounded-md animate-pulse w-5/6" />
        </div>
      ) : (
        <div className="space-y-3.5">
          <p className="text-xs text-slate-200 leading-relaxed font-sans italic pl-1 border-l-2 border-indigo-400/40">
            "{prompt}"
          </p>

          {submitted ? (
            <div className="bg-emerald-900/25 border border-emerald-500/25 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in">
              <Check size={14} className="shrink-0" />
              <span>Your dialectic rebuttal is live-posted to classmates' roster forum!</span>
            </div>
          ) : (
            <form onSubmit={handleSubmitRebuttal} className="flex gap-2">
              <input
                type="text"
                value={rebuttal}
                onChange={(e) => setRebuttal(e.target.value)}
                placeholder="Formulate your defense..."
                maxLength={400}
                required
                className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-hidden focus:border-indigo-500 text-white placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={sending || !rebuttal.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5 shrink-0 disabled:opacity-40 disabled:hover:bg-indigo-600"
              >
                <span>{sending ? "Posting..." : "Post"}</span>
                <Send size={11} />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

interface HintProps {
  question: string;
  studentAnswer: string;
  correctAnswer: string;
}

export function MaieuticDialogueCard({
  question,
  studentAnswer,
  correctAnswer,
}: HintProps) {
  const [clicked, setClicked] = useState<boolean>(false);
  const [hint, setHint] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHint = async () => {
    setClicked(true);
    setLoading(true);
    try {
      const res = await fetch("/api/inquiry/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, studentAnswer, correctAnswer }),
      });
      const data = await res.json();
      if (data && data.hint) {
        setHint(data.hint);
      }
    } catch (err) {
      console.error("Maieutic Hint fetch failed:", err);
      setHint(`Re-examine the specific framing of the question. Ask yourself if your choice overlooks a crucial nuance or stakeholder.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="maieutic-card" className="mt-3">
      {!clicked ? (
        <button
          type="button"
          onClick={fetchHint}
          className="w-full py-2.5 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/15 hover:to-amber-600/15 text-amber-700 rounded-xl border border-amber-300/40 text-xs font-bold transition-all flex items-center justify-center gap-2"
        >
          <span>💡 Summon SSlive Hint on Mistake</span>
        </button>
      ) : (
        <div className="bg-amber-50/50 p-4 rounded-xl border border-dashed border-amber-200 animate-fade-in">
          <p className="font-mono text-amber-800 font-bold uppercase text-[9px] mb-1">
            SSlive Hint:
          </p>
          {loading ? (
            <div className="space-y-1.5 py-1">
              <div className="h-3 bg-amber-200/40 rounded-sm animate-pulse w-4/5" />
              <div className="h-3 bg-amber-200/40 rounded-sm animate-pulse w-2/3" />
            </div>
          ) : (
            <p className="text-slate-600 italic leading-relaxed text-xs font-sans">
              "{hint}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
