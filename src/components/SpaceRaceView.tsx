import React, { useMemo } from "react";
import { Rocket, Trophy, Users, Award, PlayCircle, Shield } from "lucide-react";
import { Participant, Question } from "../types";

interface SpaceRaceViewProps {
  participants: Participant[];
  questions: Question[];
  activeQuizTitle: string;
  onFinishRace: () => void;
}

const LANES_CONFIG = [
  { name: "Blue Nova", color: "from-blue-400 to-indigo-600", text: "text-blue-500", bg: "bg-blue-500/10", code: "#3b82f6" },
  { name: "Magenta Comet", color: "from-pink-400 to-red-600", text: "text-pink-500", bg: "bg-pink-500/10", code: "#ec4899" },
  { name: "Lime Nebula", color: "from-emerald-400 to-teal-600", text: "text-emerald-500", bg: "bg-emerald-500/10", code: "#10b981" },
  { name: "Peach Solar", color: "from-orange-400 to-amber-600", text: "text-orange-500", bg: "bg-orange-500/10", code: "#f59e0b" },
  { name: "Daffodil Ray", color: "from-yellow-300 to-amber-500", text: "text-yellow-500", bg: "bg-yellow-500/10", code: "#eab308" }
];

export default function SpaceRaceView({ participants, questions, activeQuizTitle, onFinishRace }: SpaceRaceViewProps) {
  const totalQuestionsCount = questions.length || 1;

  // Compute team standing
  // Group participants by team (Blue Nova, Magenta Comet, etc.)
  const teamStandings = useMemo(() => {
    // Initialize teams
    const standings = LANES_CONFIG.map((lane) => ({
      ...lane,
      bestProgress: 0, // Max question slot reached by any member in this team
      totalScore: 0,   // Total correct answers
      memberCount: 0,
      completionRate: 0,
    }));

    // Fill team stats with participants
    participants.forEach((p) => {
      // Find team slot
      const teamName = p.team || "Blue Nova";
      const teamIndex = standings.findIndex((s) => s.name === teamName);
      if (teamIndex !== -1) {
        standings[teamIndex].memberCount += 1;
        standings[teamIndex].totalScore += p.score;
        // Progress percentage for this member (how far they are)
        const progressPercent = Math.min((p.progress / totalQuestionsCount) * 100, 100);
        if (progressPercent > standings[teamIndex].bestProgress) {
          standings[teamIndex].bestProgress = progressPercent;
        }
      }
    });

    return standings;
  }, [participants, totalQuestionsCount]);

  // Find leading team
  const leadingTeam = useMemo(() => {
    let leader = teamStandings[0];
    teamStandings.forEach((team) => {
      if (team.totalScore > leader.totalScore || 
         (team.totalScore === leader.totalScore && team.bestProgress > leader.bestProgress)) {
        leader = team;
      }
    });
    return leader.memberCount > 0 ? leader : null;
  }, [teamStandings]);

  return (
    <div className="bg-slate-950 text-slate-100 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl relative overflow-hidden font-sans" id="space-race-screen">
      
      {/* Dynamic Cosmic Grid Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 opacity-90 z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1020_1px,transparent_1.1px),linear-gradient(to_bottom,#0c1020_1px,transparent_1.1px)] bg-[size:32px_32px] opacity-25 z-0" />

      <div className="relative z-10 space-y-6">
        
        {/* Race Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center animate-bounce">
              <Rocket size={24} />
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">Meeting Activity Live Conflict</p>
              <h2 className="text-xl md:text-2xl font-display font-medium text-slate-100 flex items-center gap-2">
                <span>Space Race:</span>
                <span className="text-slate-300 font-normal">{activeQuizTitle}</span>
              </h2>
            </div>
          </div>

          <button 
            onClick={onFinishRace}
            className="px-5 py-2 bg-red-600/90 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm shadow-red-950 hover:shadow-red-900 border border-red-500/40 flex items-center gap-2"
            id="btn-finish-space-race"
          >
            End Space Race
          </button>
        </div>

        {/* Live Leader Board Indicator */}
        {leadingTeam ? (
          <div className="bg-indigo-950/20 border border-indigo-500/10 p-4 rounded-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Trophy size={20} className="text-amber-400 shrink-0" />
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-slate-100">Leading Launcher: </span>
                <span className={`font-mono text-sm uppercase px-2 py-0.5 rounded-sm bg-indigo-900/40 font-bold ${leadingTeam.text}`}>
                  {leadingTeam.name}
                </span>
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1 rounded-sm border border-slate-800">
              Total score: <span className="text-indigo-400 font-bold">{leadingTeam.totalScore} pts</span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl text-center text-xs text-slate-400 font-mono">
            Waiting for pilot answers to launch off the docking terminals...
          </div>
        )}

        {/* RACING GRID */}
        <div className="space-y-6 pt-4">
          {teamStandings.map((team, idx) => {
            const progressPct = team.bestProgress;
            return (
              <div key={team.name} className="space-y-2">
                
                {/* Lane HUD */}
                <div className="flex justify-between items-center text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-tr ${team.color}`} />
                    <span className="uppercase font-bold tracking-wider text-slate-300">{team.name}</span>
                    <span className="text-slate-500">({team.memberCount} flight members)</span>
                  </div>
                  <div className="text-slate-400">
                    Progress: <span className="text-slate-200 font-bold">{Math.round(progressPct)}%</span>
                  </div>
                </div>

                {/* Visual Lane track with custom rocket animations! */}
                <div className="h-16 w-full bg-slate-900/60 rounded-xl relative border border-slate-800/60 overflow-hidden flex items-center p-1">
                  
                  {/* Orbit speed effect lines */}
                  <div className="absolute inset-x-0 h-[1px] bg-slate-800 top-1/2 -translate-y-1/2 opacity-35" />
                  <div className="absolute right-[20%] top-0 bottom-0 w-[1px] bg-slate-800/40 border-dashed" />
                  <div className="absolute right-[40%] top-0 bottom-0 w-[1px] bg-slate-800/40 border-dashed" />
                  <div className="absolute right-[60%] top-0 bottom-0 w-[1px] bg-slate-800/40 border-dashed" />
                  <div className="absolute right-[80%] top-0 bottom-0 w-[1px] bg-slate-800/40 border-dashed" />

                  {/* ROCKET VESSEL */}
                  <div 
                    className="absolute h-full flex items-center transition-all duration-700 ease-out"
                    style={{ left: `calc(${progressPct}% - 48px)`, minLeft: "12px" }}
                  >
                    {/* Launch fuel burn visual trail if moving */}
                    {progressPct > 0 && (
                      <div className="flex items-center">
                        <div className="w-12 h-1 bg-gradient-to-r from-transparent to-orange-500/50 rounded-full blur-xs mr-1 animate-pulse" />
                        <div className="w-6 h-2 bg-radial from-orange-400 to-transparent rounded-full blur-xs mr-2 border-r-2 border-amber-500" />
                      </div>
                    )}

                    {/* Rocket avatar custom themed per track name! */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${team.color} text-white flex items-center justify-center shadow-lg border border-white/20 relative z-10 group`}>
                      <Rocket size={18} className="transform rotate-45 group-hover:scale-110 transition-transform" />
                      {/* Interactive glow bubble */}
                      <span className="absolute -inset-1 rounded-xl bg-white/10 animate-ping opacity-30 pointer-events-none" />
                    </div>
                  </div>

                  {/* Dock Terminal gate (Finish) */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-slate-800/35 border-l border-slate-700/50 flex flex-col justify-center items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                    <span className="transform rotate-90 whitespace-nowrap">Gate F</span>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* Detailed Team stats block */}
        <div className="border-t border-slate-800/80 pt-6">
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Users size={16} /> Team Cargo Flight Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamStandings.map((team) => (
              <div key={team.name} className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                <span className="text-xs font-mono font-bold uppercase text-slate-300">{team.name}</span>
                <div className="mt-2 flex justify-between items-baseline">
                  <p className="text-xl font-display font-medium text-slate-100">{team.totalScore} <span className="text-xs text-slate-500">correct</span></p>
                  <p className="text-xs font-mono text-slate-500">{team.memberCount} pilots</p>
                </div>
                {/* Horizontal simple index progress bar */}
                <div className="w-full bg-slate-950 h-1 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${team.color}`}
                    style={{ width: `${team.bestProgress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
