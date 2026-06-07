import React, { useEffect } from "react";
import { motion } from "motion/react";
import { Trophy, Medal, Crown } from "lucide-react";
import confetti from "canvas-confetti";
import { Participant } from "../types";
import { playSound } from "../lib/gameEnhancements";

interface PodiumProps {
  participants: Participant[];
  /** Optional subtitle, e.g. quiz title */
  subtitle?: string;
}

const RANKS = [
  { place: 1, height: "h-44", color: "from-amber-400 to-yellow-500", text: "text-amber-900", glow: "shadow-amber-500/40", label: "1st", icon: Crown, ring: "ring-amber-400/40" },
  { place: 2, height: "h-32", color: "from-slate-300 to-slate-500", text: "text-slate-900", glow: "shadow-slate-400/40", label: "2nd", icon: Trophy, ring: "ring-slate-400/40" },
  { place: 3, height: "h-24", color: "from-orange-400 to-amber-700", text: "text-amber-100", glow: "shadow-orange-500/40", label: "3rd", icon: Medal, ring: "ring-orange-400/40" },
];

export default function Podium({ participants, subtitle }: PodiumProps) {
  const sorted = [...participants].sort((a, b) => b.score - a.score);
  const top3 = sorted.slice(0, 3);

  // Order for visual layout: 2nd, 1st, 3rd
  const layoutOrder = [top3[1], top3[0], top3[2]];

  useEffect(() => {
    playSound("podium");

    // Confetti shower from both corners
    const colors = ["#fbbf24", "#f59e0b", "#fcd34d", "#a78bfa", "#60a5fa"];
    const burst = (originX: number) => {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { x: originX, y: 0.6 },
        colors,
        scalar: 1.1,
      });
    };
    burst(0.15);
    burst(0.85);
    const repeat = setInterval(() => {
      burst(Math.random());
    }, 1200);
    setTimeout(() => clearInterval(repeat), 6000);
    return () => clearInterval(repeat);
  }, []);

  if (top3.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p className="text-lg font-display font-medium">No participants yet</p>
      </div>
    );
  }

  return (
    <div className="relative py-10 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/40 via-transparent to-amber-50/30 pointer-events-none" />

      <div className="relative">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-600 font-bold mb-1">
            ★ Final Standings ★
          </p>
          <h2 className="text-3xl font-display font-black text-slate-900">Top of the Class</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </motion.div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-4 max-w-3xl mx-auto px-6">
          {layoutOrder.map((p, idx) => {
            if (!p) return <div key={idx} className="flex-1" />;
            const rank = top3.findIndex(t => t?.id === p.id);
            const cfg = RANKS[rank];
            const Icon = cfg.icon;
            const delay = rank === 0 ? 1.2 : rank === 1 ? 0.6 : 0.9;

            return (
              <motion.div
                key={p.id}
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.7, delay, type: "spring", stiffness: 90 }}
                className="flex-1 flex flex-col items-center max-w-[180px]"
              >
                {/* Avatar + name */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: delay + 0.4, type: "spring", stiffness: 150 }}
                  className="flex flex-col items-center mb-3"
                >
                  <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${cfg.color} flex items-center justify-center mb-2 shadow-lg ${cfg.glow} ring-4 ${cfg.ring}`}>
                    <span className={`text-2xl font-black ${cfg.text}`}>
                      {p.name.substring(0, 2).toUpperCase()}
                    </span>
                    {rank === 0 && (
                      <motion.div
                        initial={{ y: -10, opacity: 0, rotate: -20 }}
                        animate={{ y: -20, opacity: 1, rotate: 0 }}
                        transition={{ delay: delay + 0.8, type: "spring" }}
                        className="absolute -top-6"
                      >
                        <Crown size={28} className="text-amber-400 fill-amber-300 drop-shadow-lg" />
                      </motion.div>
                    )}
                  </div>
                  <p className="font-bold text-sm text-slate-800 text-center truncate max-w-[160px]">{p.name}</p>
                  <p className="text-xs text-slate-500 font-mono">{p.score} pts</p>
                </motion.div>

                {/* Podium block */}
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.5, delay, ease: "easeOut" }}
                  style={{ transformOrigin: "bottom" }}
                  className={`w-full ${cfg.height} bg-gradient-to-b ${cfg.color} rounded-t-2xl shadow-xl ${cfg.glow} relative overflow-hidden flex items-start justify-center pt-4`}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                  <div className="relative flex flex-col items-center gap-1">
                    <Icon size={22} className={cfg.text} />
                    <span className={`font-black text-2xl ${cfg.text}`}>{cfg.label}</span>
                  </div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Runners-up (4th–10th) */}
        {sorted.length > 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            className="mt-10 max-w-md mx-auto"
          >
            <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold mb-2 text-center">
              Runners-up
            </p>
            <div className="space-y-1.5">
              {sorted.slice(3, 10).map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 2.6 + i * 0.08 }}
                  className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg text-xs"
                >
                  <span className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-slate-400 w-6">#{i + 4}</span>
                    <span className="font-semibold text-slate-700">{p.name}</span>
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">{p.score} pts</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
