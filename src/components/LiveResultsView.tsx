import React, { useState } from "react";
import { 
  Activity, 
  Users, 
  Zap, 
  Play, 
  ChevronRight, 
  ClipboardCheck,
  Sparkles
} from "lucide-react";
import { Participant, Quiz, Room } from "../types";
import SpaceRaceView from "./SpaceRaceView";
import LiveReportView from "./LiveReportView";
import TeacherDebateConsole from "./TeacherDebateConsole";
import Podium from "./Podium";
import { Trophy as TrophyIcon } from "lucide-react";

function InquiryFacilitatorConsole({ participants, type, inquiriesModeEnabled }: { participants: Participant[], type: string, inquiriesModeEnabled: boolean }) {
  const [prompt, setPrompt] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  const handleGenerateDialectics = () => {
    setLoadingPrompt(true);
    setTimeout(() => {
      let chosen = "";
      if (type === "short-answer") {
        const answersList = participants.map(p => p.answers[0]).filter(Boolean);
        if (answersList.length > 0) {
          chosen = `Based on the claims ("${answersList[0]}..."), prompt the class: 'Does this stance assume that our intentions are pure? What are the edge cases where this reasoning fractures?'`;
        } else {
          chosen = `Ask students: "What core values must we compromise to make this premise universal? Who holds the counter-evidence?"`;
        }
      } else if (type === "true-false") {
        chosen = `Trigger class debate: "What hidden assumptions lie in the True claim? If the premise is false, does the opposite necessarily hold absolute truth?"`;
      } else {
        chosen = `Challenge the majority vote: "If our popular choice is indeed correct, what are the subtle scenarios where the minority choice becomes the superior ethical option?"`;
      }
      setPrompt(chosen);
      setLoadingPrompt(false);
    }, 750);
  };

  if (!inquiriesModeEnabled) {
    return (
      <div className="p-3 bg-white/5 rounded-xl text-center border border-white/5 border-dashed">
        <p className="text-[10px] text-slate-400">Classical Rote Mode is active. Enable Inquiry Mode on the dashboard to activate the AI Coach!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-1">
      {prompt ? (
        <div className="p-3 bg-indigo-950/80 rounded-xl border border-indigo-500/20 space-y-1.5 text-left">
          <p className="text-[8px] font-mono font-bold text-indigo-300 uppercase">Interactive Catalyst Prompt:</p>
          <p className="text-[11px] font-sans italic text-slate-200 leading-relaxed font-semibold">"{prompt}"</p>
          <button 
            type="button"
            onClick={() => setPrompt(null)}
            className="text-[9px] text-indigo-300 hover:text-indigo-100 underline block font-mono cursor-pointer"
          >
            Clear / Re-Generate
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleGenerateDialectics}
          disabled={loadingPrompt}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] sm:text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-indigo-700/20 shadow-xs"
        >
          {loadingPrompt ? "Analyzing minds..." : "✨ Spark Inquiry Catalyst Question"}
        </button>
      )}
    </div>
  );
}

interface LiveResultsViewProps {
  room: Room | null;
  participants: Participant[];
  quizzes: Quiz[];
  qqStats: { breakdown: Record<string, number>; total: number };
  handleAdvanceTeacherPaced: (amount: number) => void;
  handleEndActivity: () => void;
  setCurrentView: (v: any) => void;
}

export default function LiveResultsView({
  room,
  participants,
  quizzes,
  qqStats,
  handleAdvanceTeacherPaced,
  handleEndActivity,
  setCurrentView
}: LiveResultsViewProps) {
  const currentQuiz = quizzes.find(q => q.id === (room?.activeQuizId || ""));
  const [showPodium, setShowPodium] = useState(false);

  // Auto-eligibility: quiz exists + on last Q + at least one participant scored
  const podiumEligible = !!currentQuiz
    && room?.activeActivity === "quiz"
    && room.activeQuestionIndex >= (currentQuiz.questions.length - 1)
    && participants.some(p => p.score > 0);

  return (
    <div className="space-y-6 fade-in-up" id="live-results-view-root">
      {/* Podium overlay — full-screen modal triggered by teacher when quiz wraps */}
      {showPodium && currentQuiz && (
        <div className="fixed inset-0 z-[200] bg-gradient-to-br from-slate-50 via-white to-amber-50/30 overflow-y-auto">
          <button
            onClick={() => setShowPodium(false)}
            className="absolute top-5 right-5 z-10 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
          >
            ✕ Close
          </button>
          <Podium participants={participants} subtitle={currentQuiz.title} />
        </div>
      )}

      {room && room.activeActivity ? (
        <div className="space-y-6">
          {/* Banner with state actions */}
          <div className="bg-slate-50 text-slate-800 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-3xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-600 uppercase font-black tracking-widest">
                  LIVE COMPASS MONITOR
                </span>
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
                {room.activeActivity === "quiz" && "Live Evaluation scoreboard in-progress"}
                {room.activeActivity === "space-race" && "Live Space Race Cosmic scoreboard in-progress"}
                {room.activeActivity === "quick-question" && `Live Quick Poll: ${room.quickQuestion?.type}`}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Sharing student screens inside meeting <span className="font-mono text-slate-800 underline font-bold">{room.roomId}</span>. Results update in real-time.
              </p>
            </div>

            <div className="flex gap-2.5 w-full md:w-auto">
              {room.activeActivity === "quiz" && room.pacing === "teacher-paced" && (
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Pacing:</span>
                  <button 
                    type="button"
                    onClick={() => handleAdvanceTeacherPaced(-1)}
                    disabled={room.activeQuestionIndex <= 0}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 text-[10px] font-bold rounded cursor-pointer border border-slate-200"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-800 px-1">
                    Q{room.activeQuestionIndex + 1}
                  </span>
                  <button 
                    type="button"
                    onClick={() => handleAdvanceTeacherPaced(1)}
                    disabled={room.activeQuestionIndex >= (currentQuiz?.questions.length || 1) - 1}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 text-[10px] font-bold rounded cursor-pointer border border-slate-200"
                  >
                    Next
                  </button>
                </div>
              )}
              
              {podiumEligible && (
                <button
                  type="button"
                  onClick={() => setShowPodium(true)}
                  className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-amber-950 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Show animated podium for top 3"
                >
                  <TrophyIcon size={13} /> Show Podium
                </button>
              )}

              <button 
                type="button"
                onClick={handleEndActivity}
                className="w-full md:w-auto px-4 py-2 bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                End Activity & Grade
              </button>
            </div>
          </div>

          {/* Space Race View */}
          {room.activeActivity === "space-race" && (
            <SpaceRaceView 
              participants={participants}
              questions={currentQuiz?.questions || []}
              activeQuizTitle={currentQuiz?.title || "Space Race"}
              onFinishRace={handleEndActivity}
            />
          )}
          
          {/* Quick Question View */}
          {room.activeActivity === "quick-question" && room.quickQuestion && (
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-3xs space-y-6">
              <h4 className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                STUDENT FEED FEEDBACK - {room.quickQuestion.type.toUpperCase()}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                  {room.quickQuestion.type === "true-false" ? (
                    ["True", "False"].map((opt) => {
                      const count = qqStats.breakdown[opt] || 0;
                      const pct = qqStats.total > 0 ? Math.round((count / qqStats.total) * 105) : 0;
                      return (
                        <div key={opt} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-705">
                            <span>{opt}</span>
                            <span className="font-mono">{count} votes ({Math.min(pct, 100)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                            <div className="bg-violet-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : room.quickQuestion.type === "multiple-choice" ? (
                    ["A", "B", "C", "D", "E"].map((opt) => {
                      const count = qqStats.breakdown[opt] || 0;
                      const pct = qqStats.total > 0 ? Math.round((count / qqStats.total) * 100) : 0;
                      return (
                        <div key={opt} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-705">
                            <span>Option {opt}</span>
                            <span className="font-mono">{count} votes ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all duration-505" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-2">
                      {participants.length === 0 ? (
                        <p className="text-slate-400 text-xs font-sans italic">Awaiting short answer submissions...</p>
                      ) : (
                        participants.map((p, idx) => (
                          <div key={p.id || idx} className="p-3 bg-slate-50/50 rounded-xl border border-slate-150 text-xs flex justify-between items-center">
                            <span className="font-medium text-slate-800">"{p.answers[0] || "No response recorded"}"</span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 font-bold shrink-0">— {p.name}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Total Minds Telemetry */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                    <Users className="mx-auto text-indigo-550 mb-1" size={24} />
                    <p className="text-2xl font-mono font-bold text-slate-900">{qqStats.total}</p>
                    <p className="text-[10px] text-slate-500 font-medium font-sans">Total responsive minds joined inside the room</p>
                  </div>

                    {/* Inquiry AI Coach */}
                    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl border border-indigo-500/20 space-y-3 shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full filter blur-xl" />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono tracking-widest text-indigo-300 font-bold uppercase py-0.5 px-1.5 bg-indigo-500/20 rounded-md border border-indigo-400/20 flex items-center gap-1">
                          <Sparkles size={8} className="text-indigo-400 animate-pulse" />
                          Inquiry AI Coach
                        </span>
                      </div>

                      <h5 className="text-xs font-display font-bold text-indigo-50 leading-tight">Generate Live Debate Prompts</h5>
                      
                      <p className="text-[10px] text-slate-300 leading-normal">
                        Cultivate critical class dialectics! Ask deep maieutic questions instead of measuring rote memory.
                      </p>

                      <InquiryFacilitatorConsole 
                        participants={participants} 
                        type={room.quickQuestion.type} 
                        inquiriesModeEnabled={room.inquiryModeEnabled !== false && room.inquiryAiChallengerEnabled !== false} 
                      />
                    </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Debate View */}
          {room.activeActivity === "live-debate" && (
            <TeacherDebateConsole 
              room={room}
              participants={participants}
              onEndActivity={handleEndActivity}
            />
          )}

          {/* Regular Live Quiz report table listing */}
          {room.activeActivity === "quiz" && (
            <LiveReportView 
              participants={participants}
              questions={currentQuiz?.questions || []}
              activeQuizTitle={currentQuiz?.title || "Formative Evaluation"}
              onCloseReport={handleEndActivity}
            />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 md:p-16 text-center max-w-2xl mx-auto space-y-6 shadow-3xs">
          <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto">
            <Activity size={32} className="animate-pulse text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-display font-medium text-slate-850">No Active Meeting Session Running</h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
               There is no live quiz, space race, exit ticket, or poll run right now. Select an activity in the <strong className="text-indigo-600 hover:underline cursor-pointer" onClick={() => setCurrentView("launch")}>Launch</strong> tab to ignite student screens!
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-left">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450">DIRECT INTEGRATE</h4>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">Join link is automatically bound to whatever class room code you toggle active.</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-450">STREAM FEEDBACKS</h4>
              <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">Answers instantly stream live here with full diagnostic grading overlays.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
