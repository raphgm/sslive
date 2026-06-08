import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Download, RefreshCw, ImageOff } from "lucide-react";
import { generateVisualSummary, VisualSummary, VisualSummaryPoint } from "../lib/groqAi";
import { Question } from "../types";

// ── Pollinations AI image URL — free, no API key, generates from a prompt ───
function pollinationsUrl(prompt: string, width = 600, height = 400): string {
  // Append style guidance for clean educational visuals
  const fullPrompt = `${prompt}, educational illustration, clean background, vivid colors, professional, photorealistic`;
  const encoded = encodeURIComponent(fullPrompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${Math.floor(Math.random() * 99999)}`;
}

// ── Single concept card ──────────────────────────────────────────────────────
function ConceptCard({ point, index }: { point: VisualSummaryPoint; index: number; key?: React.Key }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  // Build prompt from concept + imageKeyword for richer AI generation
  const [imgSrc] = useState(() => pollinationsUrl(`${point.concept}: ${point.imageKeyword}`));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full h-36 bg-slate-100 overflow-hidden flex-shrink-0">
        {!imgError ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-slate-300 border-t-amber-500 animate-spin" />
              </div>
            )}
            <img
              src={imgSrc}
              alt={point.concept}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2">
            <ImageOff size={24} />
            <span className="text-[10px] font-medium text-slate-400">Image unavailable</span>
          </div>
        )}
        {/* Index pill */}
        <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
          {index + 1}
        </div>
      </div>

      {/* Text */}
      <div className="p-3 flex flex-col gap-1 flex-1">
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-wide leading-tight">{point.concept}</p>
        <p className="text-[11px] text-slate-500 leading-relaxed">{point.caption}</p>
        <p className="text-[9px] font-mono text-slate-300 mt-auto pt-1 truncate">🤖 AI generated · {point.imageKeyword}</p>
      </div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
interface VisualSummaryCardProps {
  lessonTitle: string;
  questions: Question[];
  onClose: () => void;
}

export default function VisualSummaryCard({ lessonTitle, questions, onClose }: VisualSummaryCardProps) {
  const [summary, setSummary] = useState<VisualSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateVisualSummary(
        lessonTitle,
        questions.map(q => ({ text: q.text, correctAnswer: q.correctAnswer, explanation: q.explanation })),
      );
      setSummary(result);
    } catch (e: any) {
      setError(e.message || "Could not generate visual summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="vs-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="vs-panel"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="bg-[#fffdf9] w-full max-w-2xl max-h-[92vh] rounded-3xl border border-amber-200/60 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                <Sparkles size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Visual Study Card</p>
                <p className="text-sm font-black text-slate-900 leading-tight truncate max-w-[280px]">{lessonTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {summary && (
                <>
                  <button
                    onClick={load}
                    title="Regenerate"
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    <RefreshCw size={15} />
                  </button>
                  <button
                    onClick={handlePrint}
                    title="Print / Save as PDF"
                    className="p-2 hover:bg-amber-50 rounded-xl text-amber-500 hover:text-amber-700 transition-colors"
                  >
                    <Download size={15} />
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading && (
              <div className="flex flex-col items-center justify-center h-48 gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                  Generating your visual study card…
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                <p className="text-sm text-rose-600 font-medium">{error}</p>
                <button
                  onClick={load}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {summary && !loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2">
                {summary.points.map((point, i) => (
                  <ConceptCard key={i} point={point} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {summary && !loading && (
            <div className="px-6 py-3 border-t border-slate-100 shrink-0 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-mono">5 key concepts · AI images by Pollinations · Powered by SKILL.SCH</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
