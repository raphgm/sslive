import React, { useState, useMemo } from "react";
import { 
  Download, 
  Eye, 
  EyeOff, 
  BarChart2, 
  CheckCircle2, 
  FileText, 
  Users, 
  Star, 
  ArrowUpDown, 
  Search, 
  Tv, 
  Info, 
  ListOrdered, 
  Check, 
  X, 
  Pencil, 
  ChevronRight, 
  Activity, 
  HelpCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Trophy,
  Target,
  Pause,
  Copy,
  CheckCircle,
  Play,
  PieChart,
  SlidersHorizontal,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Participant, Question } from "../types";

interface LiveReportViewProps {
  participants: Participant[];
  questions: Question[];
  activeQuizTitle: string;
  onCloseReport: () => void;
}

export default function LiveReportView({ 
  participants, 
  questions, 
  activeQuizTitle, 
  onCloseReport 
}: LiveReportViewProps) {
  // Meeting core live toggles
  const [showNames, setShowNames] = useState(true);
  const [showResponses, setShowResponses] = useState(true);
  const [showResults, setShowResults] = useState(true);

  // Pause and invite states
  const [isPaused, setIsPaused] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sorting and table states
  const [sortBy, setSortBy] = useState<"name" | "progress" | "score">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cinematic Fullscreen projector view toggle
  const [projectorMode, setProjectorMode] = useState(false);

  // Unique Board View: "grid" (SSlive matrix) | "cards" (Athenian profiles) | "observatory" (analytics feed)
  const [activeBoardView, setActiveBoardView] = useState<"grid" | "cards" | "observatory">("grid");

  // Question inspector state (click Q column header)
  const [inspectedQuestionIdx, setInspectedQuestionIdx] = useState<number | null>(null);

  // Statistics calculation per question
  const questionStats = useMemo(() => {
    return questions.map((q, qIdx) => {
      let correctCount = 0;
      let totalAnswered = 0;
      const distribution: Record<string, number> = {};

      participants.forEach((p) => {
        const studentAns = p.answers[qIdx];
        if (studentAns !== undefined && studentAns !== null && studentAns !== "") {
          totalAnswered += 1;
          const cleanAns = String(studentAns).trim();
          distribution[cleanAns] = (distribution[cleanAns] || 0) + 1;

          const isCorrect = (q.type === "poll" || q.type === "scale") ? true : cleanAns.toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
          if (isCorrect) {
            correctCount += 1;
          }
        }
      });

      const pctCorrect = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
      return {
        correctCount,
        totalAnswered,
        pctCorrect,
        distribution
      };
    });
  }, [participants, questions]);

  // Overall meeting mastery metrics
  const overallMetrics = useMemo(() => {
    if (participants.length === 0) {
      return { averageScore: 0, completionRate: 0 };
    }

    // 1. Completion rate
    const completedCount = participants.filter((p) => p.progress >= questions.length).length;
    const completionRate = Math.round((completedCount / participants.length) * 100);

    // 2. Average score
    const scores = participants.map((p) => (p.score / (questions.length || 1)) * 100);
    const sum = scores.reduce((acc, curr) => acc + curr, 0);
    const averageScore = Math.round(sum / participants.length);

    return { averageScore, completionRate };
  }, [participants, questions]);

  // Audio Notifications for Submissions
  const [lastTotalAnswers, setLastTotalAnswers] = useState(0);
  const playPopSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      // Ignore audio errors
    }
  };

  React.useEffect(() => {
    const currentTotalAnswers = participants.reduce((acc, p) => acc + Object.keys(p.answers || {}).length, 0);
    if (currentTotalAnswers > lastTotalAnswers && lastTotalAnswers !== 0) {
      playPopSound();
    }
    setLastTotalAnswers(currentTotalAnswers);
  }, [participants, lastTotalAnswers]);

  // Handle Header Row Sorting
  const toggleSort = (field: "name" | "progress" | "score") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to desc for score/progress, asc for name
    }
  };

  // Elapsed Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  React.useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Filter & Sort Participants
  const processedParticipants = useMemo(() => {
    let result = [...participants];

    // Filter by name/team query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => 
          p.name.toLowerCase().includes(q) || 
          (p.team && p.team.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "name") {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        return sortOrder === "asc" ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortBy === "progress") {
        return sortOrder === "asc" ? a.progress - b.progress : b.progress - a.progress;
      } else if (sortBy === "score") {
        return sortOrder === "asc" ? a.score - b.score : b.score - a.score;
      }
      return 0;
    });

    return result;
  }, [participants, sortBy, sortOrder, searchQuery]);

  // Get display name based on obfuscation settings
  const getStudentDisplayName = (participant: Participant) => {
    if (showNames) return participant.name;
    const idx = participants.findIndex(p => p.id === participant.id);
    return `Scholar ${idx !== -1 ? idx + 1 : "Pilot"}`;
  };

  // Export CSV Helper
  const downloadCsvReport = () => {
    try {
      let csvContent = "\ufeffStudent Name,Score,Progress %";
      questions.forEach((_, idx) => {
        csvContent += `,Question ${idx + 1}`;
      });
      csvContent += "\n";

      participants.forEach((p) => {
        const pctScore = Math.round((p.score / (questions.length || 1)) * 100);
        let row = `"${p.name}",${p.score}/${questions.length} (${pctScore}%),${Math.round((p.progress / (questions.length || 1)) * 100)}%`;
        
        questions.forEach((q, qIdx) => {
          const ans = p.answers[qIdx];
          const displayVal = ans !== undefined ? String(ans).replace(/"/g, '""') : "No Answer";
          row += `,"${displayVal}"`;
        });
        csvContent += row + "\n";
      });

      // Summary statistics row
      let statRow1 = `"Class Match Success Rate",,""`;
      questionStats.forEach((stat) => {
        statRow1 += `,${stat.pctCorrect}% Correct`;
      });
      csvContent += statRow1 + "\n";

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `SSlive_${activeQuizTitle.replace(/\s+/g, '_')}_Report.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      className={`transition-all duration-500 rounded-3xl border ${
        projectorMode 
          ? "bg-slate-900 border-slate-800 p-6 md:p-8 text-white min-h-[90vh] shadow-2xl relative" 
          : "bg-white p-6 md:p-8 border-slate-200/60 shadow-xs text-slate-700 space-y-5"
      }`} 
      id="live-results-matrix"
    >
      
      {/* Pristine Socrative-style Title / Action Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-display font-bold text-neutral-800 tracking-tight flex items-center gap-2">
            {activeQuizTitle}
          </h2>
          <span className="text-slate-400 hover:text-slate-605 cursor-pointer flex items-center bg-slate-100 hover:bg-slate-200 p-1 rounded-full transition-colors" title="Activity Details">
            <Info size={14} />
          </span>
          {isPaused && (
            <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-amber-100 text-amber-700 rounded-md font-bold animate-pulse">
              PAUSED
            </span>
          )}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/80 border border-slate-200 rounded-lg text-slate-500 font-mono text-xs font-bold ml-2">
            <Clock size={12} className={!isPaused ? "animate-pulse text-indigo-500" : ""} />
            {formatTime(elapsedSeconds)}
          </div>
        </div>

        {/* Global Toolbar Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* EXPORT CSV BUTTON */}
          <button 
            type="button"
            onClick={downloadCsvReport}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
            title="Download CSV matrix"
          >
            <Download size={13} />
            <span>Export</span>
          </button>

          {/* PAUSE BUTTON */}
          <button 
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="flex items-center gap-1.5 px-4 py-2 border border-sky-200/80 bg-white hover:bg-sky-50 text-sky-600 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
          >
            {isPaused ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}
            <span>{isPaused ? "Resume" : "Pause"}</span>
          </button>

          {/* FINISH ACTIVITY */}
          <button 
            type="button"
            onClick={onCloseReport}
            className="flex items-center gap-1.5 px-4 py-2 border border-sky-200/80 bg-white hover:bg-sky-50 text-sky-600 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
          >
            <CheckCircle size={13} />
            <span>Finish Activity</span>
          </button>

          {/* INVITE STUDENTS */}
          <button 
            type="button"
            onClick={() => {
              setShowInvitePopup(true);
              setCopiedLink(false);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-3xs"
          >
            <Users size={13} />
            <span>Invite Students</span>
          </button>
        </div>
      </div>

      {/* Inline Socrative Toggle Switches and View Deck Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-1 border-b border-dashed border-neutral-100 pb-4">
        {/* Row of Switches */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Switch 1: Show Names */}
          <button
            type="button"
            onClick={() => setShowNames(!showNames)}
            className="flex items-center gap-2 cursor-pointer select-none text-left"
          >
            <div className={`w-9 h-5 rounded-full transition-all duration-200 relative flex items-center p-0.5 shrink-0 ${
              showNames ? "bg-emerald-500" : "bg-slate-300"
            }`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                showNames ? "translate-x-4" : "translate-x-0"
              }`} />
            </div>
            <span className="text-xs font-bold text-slate-700">
              Show Names
            </span>
          </button>

          {/* Switch 2: Show Responses */}
          <button
            type="button"
            onClick={() => setShowResponses(!showResponses)}
            className="flex items-center gap-2 cursor-pointer select-none text-left"
          >
            <div className={`w-9 h-5 rounded-full transition-all duration-200 relative flex items-center p-0.5 shrink-0 ${
              showResponses ? "bg-emerald-500" : "bg-slate-300"
            }`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                showResponses ? "translate-x-4" : "translate-x-0"
              }`} />
            </div>
            <span className="text-xs font-bold text-slate-700">
              Show Responses
            </span>
          </button>

          {/* Switch 3: Show Results */}
          <button
            type="button"
            onClick={() => setShowResults(!showResults)}
            className="flex items-center gap-2 cursor-pointer select-none text-left"
          >
            <div className={`w-9 h-5 rounded-full transition-all duration-200 relative flex items-center p-0.5 shrink-0 ${
              showResults ? "bg-emerald-500" : "bg-slate-300"
            }`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                showResults ? "translate-x-4" : "translate-x-0"
              }`} />
            </div>
            <span className="text-xs font-bold text-slate-700">
              Show Results
            </span>
          </button>
        </div>

        {/* View Mode & Export Tools on the right */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Navigation View Deck */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg items-center border border-slate-200/60 shrink-0">
            <button
              type="button"
              onClick={() => setActiveBoardView("grid")}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeBoardView === "grid"
                  ? "bg-white text-slate-950 shadow-3xs border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers size={11} />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBoardView("cards")}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeBoardView === "cards"
                  ? "bg-white text-slate-950 shadow-3xs border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Users size={11} />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBoardView("observatory")}
              className={`px-3 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                activeBoardView === "observatory"
                  ? "bg-white text-slate-950 shadow-3xs border border-slate-200/40"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Star size={11} />
              <span>Observatory</span>
            </button>
          </div>

          {/* Projector immersive view toggle button */}
          <button 
            type="button"
            onClick={() => setProjectorMode(!projectorMode)}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200/80 bg-slate-50 hover:bg-slate-10$ text-slate-600 hover:text-slate-800 text-[11px] font-bold transition-all cursor-pointer`}
            title="Toggle Projector Safe Full-Screen Mode"
          >
            <Tv size={12} />
            <span>Projector</span>
          </button>

          {/* Export Report CSV */}
          <button 
            type="button"
            onClick={downloadCsvReport}
            disabled={participants.length === 0}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-3xs disabled:opacity-45`}
          >
            <FileSpreadsheet size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Invite Popup Modal Socrative-style overlay */}
      <AnimatePresence>
        {showInvitePopup && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-100 shadow-xl space-y-4 text-center text-slate-800"
            >
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto">
                <Users size={20} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">Invite Your Students</h3>
                <p className="text-xs text-slate-500">
                  Students can join your live quiz instantly using the class code below!
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                  ACTIVE CLASS CODE
                </span>
                <span className="text-2xl font-black text-indigo-600 font-mono tracking-wider select-all block">
                  {window.location.hash ? window.location.hash.split("=")[1] || "SOCRATIVE_LIVE" : "SOCRATIVE_LIVE"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const roomCode = window.location.hash ? window.location.hash.split("=")[1] || "SOCRATIVE_LIVE" : "SOCRATIVE_LIVE";
                    navigator.clipboard.writeText(roomCode);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                  <span>{copiedLink ? "Copied!" : "Copy Code"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvitePopup(false)}
                  className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Core SSlive metrics cards info */}
      {activeBoardView !== "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {/* Metric 1 */}
          <div className={`p-5 rounded-2xl border transition-all ${
            projectorMode ? "bg-slate-850/40 border-slate-800" : "bg-slate-55 border-slate-200/50"
          }`}>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${projectorMode ? "text-slate-400" : "text-slate-450"}`}>
              Forum Guests
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-3xl font-display font-semibold ${projectorMode ? "text-white" : "text-slate-900"}`}>
                {participants.length}
              </span>
              <span className="text-xs text-slate-400">registered minds</span>
            </div>
          </div>

          {/* Metric 2 */}
          <div className={`p-5 rounded-2xl border transition-all ${
            projectorMode ? "bg-slate-850/40 border-slate-800" : "bg-slate-55 border-slate-200/50"
          }`}>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${projectorMode ? "text-slate-400" : "text-slate-450"}`}>
              Total Evaluations
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-3xl font-display font-semibold ${projectorMode ? "text-indigo-400" : "text-indigo-600"}`}>
                {questions.length}
              </span>
              <span className="text-xs text-slate-400">questions posed</span>
            </div>
          </div>

          {/* Metric 3 */}
          <div className={`p-5 rounded-2xl border transition-all ${
            projectorMode ? "bg-slate-850/40 border-slate-800" : "bg-slate-55 border-slate-200/50"
          }`}>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${projectorMode ? "text-slate-400" : "text-slate-450"}`}>
              Comprehension Ratio
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-3xl font-display font-semibold ${projectorMode ? "text-emerald-400" : "text-emerald-600"}`}>
                {showResults ? `${overallMetrics.averageScore}%` : "••%"}
              </span>
              <span className="text-xs text-slate-400">mastery level</span>
            </div>
          </div>

          {/* Metric 4 */}
          <div className={`p-5 rounded-2xl border transition-all ${
            projectorMode ? "bg-slate-850/40 border-slate-800" : "bg-slate-55 border-slate-200/50"
          }`}>
            <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${projectorMode ? "text-slate-400" : "text-slate-450"}`}>
              Completion Speed
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-3xl font-display font-semibold ${projectorMode ? "text-purple-400" : "text-purple-650"}`}>
                {overallMetrics.completionRate}%
              </span>
              <span className="text-xs text-slate-400">finished activity</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Filter / Interactive Question Inspector Drawer */}
      <AnimatePresence>
        {inspectedQuestionIdx !== null && questions[inspectedQuestionIdx] && (() => {
          const activeQ = questions[inspectedQuestionIdx];
          const stats = questionStats[inspectedQuestionIdx];
          return (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`p-6 rounded-2xl border relative ${
                projectorMode 
                  ? "bg-slate-850 border-indigo-500/30 text-white" 
                  : "bg-indigo-50/55 border-indigo-100/70 text-slate-800"
              }`}
            >
              <button 
                onClick={() => setInspectedQuestionIdx(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-450 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
              
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                    Question {inspectedQuestionIdx + 1} Inspector • {activeQ.type.replace("-", " ")}
                  </span>
                  <h3 className={`text-base font-display font-bold mt-2.5 leading-snug ${projectorMode ? "text-white" : "text-slate-900"}`}>
                    {activeQ.text}
                  </h3>
                </div>

                {/* Show Answer bar distribution summary */}
                {activeQ.type !== "short-answer" ? (
                  <div className="space-y-3.5 max-w-xl">
                    {activeQ.options.map((option, optIdx) => {
                      const letters = ["A", "B", "C", "D", "E"];
                      const optChar = letters[optIdx] || option.charAt(0);
                      
                      const rawOptionText = option;
                      let voteCount = stats.distribution[optChar] || 0;
                      
                      if (stats.distribution[rawOptionText]) {
                        voteCount += stats.distribution[rawOptionText];
                      }

                      const pct = stats.totalAnswered > 0 ? Math.round((voteCount / stats.totalAnswered) * 100) : 0;
                      const isCorrectOption = optChar.toLowerCase() === activeQ.correctAnswer.trim().toLowerCase() ||
                                              rawOptionText.toLowerCase() === activeQ.correctAnswer.toLowerCase();
                      
                      return (
                        <div key={optIdx} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className={`font-semibold flex items-center gap-1.5 ${
                              isCorrectOption && showResults ? "text-emerald-500 font-bold" : ""
                            }`}>
                              <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded-sm">{optChar}</span>
                              <span>{option}</span>
                              {isCorrectOption && showResults && (
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 animate-ping-once" />
                              )}
                            </span>
                            <span className="font-semibold text-slate-400 font-mono">
                              {voteCount} votes ({pct}%)
                            </span>
                          </div>
                          <div className={`w-full rounded-full h-3 overflow-hidden ${
                            projectorMode ? "bg-slate-750" : "bg-slate-200"
                          }`}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`h-full rounded-full ${
                                isCorrectOption && showResults ? "bg-emerald-500" : "bg-indigo-600"
                              }`} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Short answers submissions array
                  <div className="space-y-2.5">
                    <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">Student Answers Shelf:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {processedParticipants.filter(p => p.answers[inspectedQuestionIdx as number]).length === 0 ? (
                        <p className="text-xs text-slate-400 italic">No students have answered this text question yet.</p>
                      ) : (
                        processedParticipants.map((p) => {
                          const ans = p.answers[inspectedQuestionIdx as number];
                          if (!ans) return null;
                          return (
                            <div 
                              key={p.id} 
                              className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                                projectorMode 
                                  ? "bg-slate-800 border-slate-700/60" 
                                  : "bg-white border-slate-205 shadow-3xs"
                              }`}
                            >
                              <p className="text-sm italic font-medium">
                                "{showResponses ? ans : "••••••••"}"
                              </p>
                              <span className="block mt-2 text-[9px] font-mono uppercase text-slate-400 text-right font-bold">
                                — {getStudentDisplayName(p)}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Explanatory footer */}
                {activeQ.explanation && (
                  <div className={`mt-3 pt-3 border-t text-xs ${
                    projectorMode ? "border-slate-800 text-slate-400" : "border-indigo-100/70 text-slate-500"
                  }`}>
                    <strong className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] block mb-0.5">Explanation / Guide:</strong>
                    {activeQ.explanation}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Search Input Filter Panel */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            placeholder="Search scholar by name or team..."
            className={`w-full text-xs pl-9 pr-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 ${
              projectorMode 
                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500" 
                : "bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-indigo-400"
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono uppercase tracking-wider ${projectorMode ? "text-slate-400" : "text-slate-500"}`}>
            {activeBoardView === "grid" ? "💡 Click column headers to Inspect Questions!" : "💡 Hover nodes to see responses"}
          </span>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className={`border-2 border-dashed rounded-3xl py-16 text-center shadow-3xs ${
          projectorMode 
            ? "border-slate-800 bg-slate-850/50 text-slate-500" 
            : "border-slate-200 bg-slate-50/50 text-slate-400 font-medium"
        }`}>
          <Users className="mx-auto mb-4 text-slate-400 shrink-0 animate-bounce" size={40} />
          <p className="text-sm font-semibold tracking-tight">Active Scholar Lobby Gate</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto px-4">
            Waiting for students to join your Room ID to register responses. Tell students to sign up to start the quiz!
          </p>
        </div>
      ) : (
        /* Render Selected Custom Tab View with High Fidelity */
        <AnimatePresence mode="wait">
          
          {/* TAB 1: COLLABORATIVE RESPONSE MATRIX (Traditional spreadsheets with modern glowing grid) */}
          {activeBoardView === "grid" && (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className={`overflow-x-auto rounded-2xl border ${
                projectorMode ? "border-slate-800 bg-slate-850/30" : "border-slate-100 bg-white"
              }`}
            >
              <table className="w-full border-collapse min-w-[750px]">
                <thead>
                  <tr className={`border-b text-[10px] font-mono uppercase tracking-wider text-left font-bold ${
                    projectorMode ? "bg-slate-800/80 border-slate-750 text-slate-300" : "bg-slate-50/70 border-slate-100 text-slate-500"
                  }`}>
                    
                    {/* Name Header */}
                    <th 
                      onClick={() => toggleSort("name")}
                      className="py-4 px-5 hover:text-indigo-505 cursor-pointer min-w-[170px]"
                    >
                      <span className="flex items-center gap-1.5">
                        Scholar Name
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </span>
                    </th>

                    {/* Score Header */}
                    {showResults && (
                      <th 
                        onClick={() => toggleSort("score")}
                        className="py-4 px-4 hover:text-indigo-400 cursor-pointer text-center w-[100px]"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          Score
                          <ArrowUpDown size={11} className="text-slate-400" />
                        </span>
                      </th>
                    )}

                    {/* Progress Header */}
                    <th 
                      onClick={() => toggleSort("progress")}
                      className="py-4 px-4 hover:text-indigo-400 cursor-pointer text-center w-[110px]"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        Progress
                        <ArrowUpDown size={11} className="text-slate-400" />
                      </span>
                    </th>

                    {/* Q Headers */}
                    {questions.map((q, idx) => {
                      let colHeaderStyle = "bg-[#fff7ed] border-[#fdba74] text-[#ea580c]";
                      let headerIcon = <ListOrdered size={12} className="shrink-0" />;

                      if (q.type === "true-false") {
                        colHeaderStyle = "bg-[#eff6ff] border-[#bfdbfe] text-[#2563eb]";
                        headerIcon = <CheckCircle2 size={12} className="shrink-0" />;
                      } else if (q.type === "short-answer") {
                        colHeaderStyle = "bg-[#fef2f2] border-[#fecaca] text-[#dc2626]";
                        headerIcon = <Pencil size={11} className="shrink-0" />;
                      } else if (q.type === "poll") {
                        colHeaderStyle = "bg-[#fff1f2] border-[#fecdd3] text-[#e11d48]";
                        headerIcon = <PieChart size={11} className="shrink-0" />;
                      } else if (q.type === "scale") {
                        colHeaderStyle = "bg-[#ecfeff] border-[#a5f3fc] text-[#0891b2]";
                        headerIcon = <SlidersHorizontal size={11} className="shrink-0" />;
                      }

                      return (
                        <th 
                          key={idx} 
                          onClick={() => setInspectedQuestionIdx(idx)}
                          className={`py-3 px-1 text-center w-[100px] border-l hover:opacity-90 cursor-pointer select-none transition-colors group relative ${
                            projectorMode ? "border-slate-800" : "border-slate-100"
                          }`}
                          title="Click column header to inspect distribution breakdown"
                        >
                          <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                            <span className="text-[9px] font-sans font-bold tracking-wider text-slate-400 block">
                              Question {idx + 1}
                            </span>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold border rounded-lg shadow-3xs ${colHeaderStyle}`}>
                              {headerIcon}
                              <span>{idx + 1}</span>
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className={`divide-y text-xs font-semibold ${
                  projectorMode ? "divide-slate-800 text-slate-300" : "divide-slate-100 text-slate-700"
                }`}>
                  {processedParticipants.map((p) => {
                    const completedQs = p.progress;
                    const progressPct = Math.round((completedQs / (questions.length || 1)) * 100);
                    const scorePct = Math.round((p.score / (questions.length || 1)) * 100);

                    return (
                      <tr 
                        key={p.id} 
                        className={`transition-colors ${
                          projectorMode ? "hover:bg-slate-800/40" : "hover:bg-indigo-50/15"
                        }`}
                      >
                        {/* Name Column */}
                        <td className="py-3.5 px-5 font-bold flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${
                            p.completed ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                          }`} />
                          <div>
                            <span className={projectorMode ? "text-slate-100 font-medium" : "text-slate-900 font-medium"}>
                              {getStudentDisplayName(p)}
                            </span>
                            {p.team && (
                              <span className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">
                                {p.team}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Score Column */}
                        {showResults && (
                          <td className="py-3 px-4 text-center font-mono font-bold">
                            {showResults ? (
                              <>
                                <span className={projectorMode ? "text-indigo-300 text-sm" : "text-indigo-700 text-sm"}>{p.score}</span>
                                <span className="text-slate-400 text-[10px] font-normal">/{questions.length}</span>
                                <span className="block text-[9px] font-normal text-slate-400">({scorePct}%)</span>
                              </>
                            ) : (
                              <span className="text-slate-400 font-normal italic">Hidden</span>
                            )}
                          </td>
                        )}

                        {/* Progress column */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className={`text-[10px] font-mono font-bold ${
                              p.completed ? "text-emerald-500" : "text-slate-400"
                            }`}>
                              {p.progress}/{questions.length}
                            </span>
                            <div className={`w-16 h-1 rounded-full overflow-hidden ${
                              projectorMode ? "bg-slate-800" : "bg-slate-100"
                            }`}>
                              <div 
                                className={`h-full transition-all duration-300 ${p.completed ? "bg-emerald-500" : "bg-indigo-500"}`} 
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Answers mapping with Socrative style color codes */}
                        {questions.map((q, qIdx) => {
                          const studentAns = p.answers[qIdx];
                          const isAnswered = studentAns !== undefined && studentAns !== "";
                          const isCorrect = isAnswered && String(studentAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                          // Default color when not answered
                          let cellBg = projectorMode ? "bg-slate-850/40 text-slate-600 border border-slate-800" : "bg-slate-50 text-slate-300 border border-slate-100/50";
                          let cellVal: React.ReactNode = "—";
                          
                          if (isAnswered) {
                            if (q.type === "short-answer" || q.type === "poll" || q.type === "scale") {
                              cellBg = "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100/60";
                              if (showResponses) {
                                const ansStr = String(studentAns);
                                cellVal = (
                                  <span className="flex items-center justify-between w-full px-2 py-1 text-[11px] normal-case text-slate-705">
                                    <span className="truncate max-w-[80px]" title={ansStr}>
                                      {q.type === "scale" ? "★" : "-"} {ansStr}
                                    </span>
                                    {q.type === "poll" ? <PieChart size={11} className="text-slate-405 shrink-0 ml-1" /> : q.type === "scale" ? <SlidersHorizontal size={11} className="text-slate-405 shrink-0 ml-1" /> : <Pencil size={11} className="text-slate-405 shrink-0 ml-1" />}
                                  </span>
                                );
                              } else {
                                cellVal = (
                                  <span className="flex items-center justify-center text-slate-400">
                                    <Check size={14} className="text-emerald-500" />
                                  </span>
                                );
                              }
                            } else {
                                // Multiple choice or true/false
                                if (showResults) {
                                  if (isCorrect) {
                                    cellBg = "bg-[#dcfce7] border border-[#bbf7d0] text-[#15803d] font-bold";
                                    cellVal = (
                                      <span className="flex items-center gap-1 justify-center text-[13px] px-1 w-full min-w-0">
                                        <Check size={13} strokeWidth={3} className="text-[#16a34a] shrink-0" />
                                        {showResponses ? <span className="truncate min-w-0">{String(studentAns)}</span> : ""}
                                      </span>
                                    );
                                  } else {
                                    cellBg = "bg-[#ffe4e6] border border-[#fecdd3] text-[#be123c] font-bold";
                                    cellVal = (
                                      <span className="flex items-center gap-1 justify-center text-[13px] px-1 w-full min-w-0">
                                        <X size={13} strokeWidth={3} className="text-[#dc2626] shrink-0" />
                                        {showResponses ? <span className="truncate min-w-0">{String(studentAns)}</span> : ""}
                                      </span>
                                    );
                                  }
                                } else {
                                  // Neutral blue-tint filled mode when showResults is false
                                  cellBg = "bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] font-bold";
                                  cellVal = (
                                    <span className="text-[13px] px-1 w-full min-w-0 text-center">
                                      {showResponses ? <span className="truncate block mx-auto">{String(studentAns)}</span> : "✔"}
                                    </span>
                                  );
                                }
                            }
                          }

                          return (
                            <td 
                              key={qIdx} 
                              onClick={() => setInspectedQuestionIdx(qIdx)}
                              className={`py-3 px-1 text-center border-l cursor-pointer select-none ${
                                projectorMode ? "border-slate-800" : "border-slate-100"
                              }`}
                              title={`Submitted: ${studentAns || "No Answer"} | Click to inspect`}
                            >
                              <div className={`w-20 h-9 mx-auto rounded-lg flex items-center justify-center text-xs transition-all duration-200 shadow-3xs overflow-hidden ${cellBg}`}>
                                {cellVal}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}

                  {/* BOTTOM CLASS ACCURACY TOTAL ROW */}
                  <tr className={`border-t font-black font-mono text-[10px] text-left uppercase ${
                    projectorMode ? "bg-slate-800/40 border-slate-755 text-slate-300" : "bg-slate-100/60 border-slate-200/50 text-slate-550"
                  }`}>
                    <td className="py-4 px-5 tracking-wider font-extrabold flex items-center gap-1.5 whitespace-nowrap">
                      <Activity size={12} className="text-indigo-500 animate-pulse shrink-0" />
                      Meeting Accuracy
                    </td>

                    {showResults && (
                      <td className="py-4 px-4 text-center text-slate-400 font-normal">—</td>
                    )}

                    <td className="py-4 px-4 text-center text-slate-400 font-normal">
                      {showResults ? (
                        <span className="text-indigo-600 font-bold">{overallMetrics.averageScore}%</span>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* Question accuracy results */}
                    {questionStats.map((stat, idx) => {
                      const accuracy = stat.pctCorrect;
                      let blockColor = "text-slate-400";
                      let countDisplay = `${accuracy}%`;

                      if (accuracy >= 70) {
                        blockColor = projectorMode ? "text-emerald-400 font-extrabold" : "text-emerald-600 font-extrabold";
                      } else if (accuracy >= 45) {
                        blockColor = projectorMode ? "text-amber-400 font-extrabold" : "text-amber-600 font-extrabold";
                      } else if (accuracy > 0) {
                        blockColor = projectorMode ? "text-rose-450 font-extrabold" : "text-rose-600 font-extrabold";
                      } else {
                        countDisplay = "—";
                      }

                      return (
                        <td key={idx} className="py-4 px-1 text-center font-bold">
                          <div className="flex flex-col items-center justify-center">
                            {showResults ? (
                              <>
                                <span className={`text-xs ${blockColor}`}>{countDisplay}</span>
                                <span className="text-[8px] font-normal text-slate-400 tracking-tight lowercase">correct</span>
                              </>
                            ) : (
                              <EyeOff size={11} className="text-slate-400 mt-0.5" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </motion.div>
          )}

          {/* TAB 2: ATHENIAN DIALOGUE DECK (Gorgeous animated cards per pupil with visual responsive checkpoint nodes) */}
          {activeBoardView === "cards" && (
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
            >
              {processedParticipants.map((p, pIdx) => {
                const completedQs = p.progress;
                const progressPct = Math.round((completedQs / (questions.length || 1)) * 100);
                const isWinner = p.score === questions.length && questions.length > 0;
                
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: Math.min(0.2, pIdx * 0.04) }}
                    className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                      projectorMode 
                        ? "bg-slate-850 border-slate-800 hover:border-slate-700 text-white" 
                        : "bg-white border-slate-200/80 hover:border-slate-300 text-slate-750 shadow-3xs"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl font-display font-semibold flex items-center justify-center text-sm ${
                          isWinner 
                            ? "bg-amber-400 text-amber-950 animate-bounce" 
                            : projectorMode ? "bg-slate-800 text-indigo-300" : "bg-indigo-50 text-indigo-700 border border-indigo-100/50"
                        }`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold tracking-tight truncate max-w-[130px]" title={p.name}>
                            {getStudentDisplayName(p)}
                          </h4>
                          {p.team && (
                            <span className="inline-block mt-0.5 text-[8px] font-mono uppercase bg-slate-100 text-slate-500 px-1 rounded">
                              {p.team}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score gauge text */}
                      <div className="text-right">
                        {showResults ? (
                          <>
                            <span className="text-sm font-mono font-bold text-indigo-600">{p.score}</span>
                            <span className="text-[10px] text-slate-400">/{questions.length}</span>
                            <span className="block text-[8px] text-emerald-500 font-mono">
                              {Math.round((p.score / (questions.length || 1)) * 100)}% accuracy
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 block font-mono">Answers Safe</span>
                        )}
                      </div>
                    </div>

                    {/* Progress tracking line */}
                    <div className="mt-4 space-y-1">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Activity Completion</span>
                        <span className="font-mono font-bold text-slate-500">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-300" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Dialogue checkpoint answer timeline */}
                    <div className="mt-4 pt-3.5 border-t border-dashed border-slate-200/60">
                      <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-2.5">Response Path:</p>
                      <div className="flex flex-wrap gap-2">
                        {questions.map((q, qIdx) => {
                          const ans = p.answers[qIdx];
                          const hasAns = ans !== undefined && ans !== "";
                          const isCorrect = hasAns && String(ans).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();

                          let dotStyle = "bg-slate-100 text-slate-400";
                          let labelText = `Q${qIdx + 1}`;

                          if (hasAns) {
                            if (showResults) {
                              if (q.type === "short-answer" || q.type === "poll" || q.type === "scale") {
                                dotStyle = "bg-amber-500/10 text-amber-500 border border-amber-500/30";
                              } else {
                                dotStyle = isCorrect 
                                  ? "bg-emerald-500 text-white shadow-3xs shadow-emerald-500/20" 
                                  : "bg-rose-500 text-white shadow-3xs shadow-rose-500/20";
                              }
                            } else {
                              dotStyle = "bg-indigo-500 text-white";
                            }
                          }

                          return (
                            <div 
                              key={qIdx}
                              onClick={() => setInspectedQuestionIdx(qIdx)}
                              className={`w-8 h-8 rounded-lg flex flex-col justify-center items-center text-[9px] font-mono font-bold cursor-pointer transition-all hover:scale-105 select-none ${dotStyle}`}
                              title={`Question ${qIdx + 1}: ${hasAns ? (showResponses ? ans : "Answered") : "No Submission"}`}
                            >
                              <span>Q{qIdx + 1}</span>
                              {hasAns && showResponses && (
                                <span className="text-[8px] scale-90 font-black opacity-90 truncate max-w-[24px]">
                                  {q.type === "short-answer" ? "🖊" : q.type === "scale" ? "★" : String(ans).charAt(0)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* TAB 3: DIAGNOSTIC OBSERVATORY (Athenian cards displaying cumulative stats, options bar charts, and tutoring diagnostics per question) */}
          {activeBoardView === "observatory" && (
            <motion.div
              key="observatory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {questions.map((q, qIdx) => {
                const stats = questionStats[qIdx];
                const cleanAns = String(q.correctAnswer).trim();
                const totalMinds = participants.length;
                const unansweredCount = totalMinds - stats.totalAnswered;

                return (
                  <motion.div
                    key={qIdx}
                    className={`p-6 rounded-2xl border ${
                      projectorMode ? "bg-slate-850 border-slate-800 text-white" : "bg-white border-slate-205 text-slate-750 shadow-3xs"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4 pb-4 border-b border-dashed border-slate-200/50">
                      <div>
                        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                          Evaluation {qIdx + 1} • {q.type.toUpperCase()}
                        </span>
                        <h3 className="text-base font-display font-bold mt-2.5 text-slate-900 leading-snug">
                          {q.text}
                        </h3>
                      </div>

                      {/* Cumulative rate badge */}
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="text-right">
                          <span className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest">Mastery Ratio</span>
                          <span className={`text-xl font-mono font-bold ${
                            stats.pctCorrect >= 75 ? "text-emerald-500" : stats.pctCorrect >= 45 ? "text-amber-500" : "text-rose-500"
                          }`}>
                            {stats.pctCorrect}% Complete
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Left: Bar charts option selection statistics */}
                      <div className="lg:col-span-7 space-y-3.5">
                        <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Meeting Selection Breakdown</p>
                        
                        {q.type !== "short-answer" ? (
                          q.options.map((opt, oIdx) => {
                            const letters = ["A", "B", "C", "D", "E"];
                            const letterCode = (q.type === "scale" || q.type === "true-false") ? opt.charAt(0) : (letters[oIdx] || opt.charAt(0));
                            
                            let votes = stats.distribution[letterCode] || 0;
                            if (stats.distribution[opt]) votes += stats.distribution[opt];
                            if (letterCode !== opt.charAt(0) && stats.distribution[opt.charAt(0)]) votes += stats.distribution[opt.charAt(0)];
                            
                            const votePct = stats.totalAnswered > 0 ? Math.round((votes / stats.totalAnswered) * 100) : 0;
                            const isCore = (q.type === "multiple-choice" || q.type === "true-false") && (letterCode.toLowerCase() === cleanAns.toLowerCase() || opt.toLowerCase() === cleanAns.toLowerCase());

                            return (
                              <div key={oIdx} className="space-y-1 text-xs">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className={`font-semibold flex items-center gap-1.5 ${isCore && showResults ? "text-emerald-600 font-bold" : ""}`}>
                                    <span className="bg-slate-100 font-mono text-[9px] p-1 rounded font-bold">{letterCode}</span>
                                    <span>{opt}</span>
                                    {isCore && showResults && (
                                      <CheckCircle2 size={12} className="text-emerald-500" />
                                    )}
                                  </span>
                                  <span className="text-slate-400 font-mono">{votes} votes ({votePct}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${isCore && showResults ? "bg-emerald-500" : "bg-indigo-600"}`}
                                    style={{ width: `${votePct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          // Short answer summaries
                          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-500 italic">
                            Students write responses dynamically. Click on Matrix Grid headers (e.g. Q{qIdx + 1}) to read a full shelf of typed answers in real-time.
                          </div>
                        )}
                      </div>

                      {/* Right: Meeting Diagnostic Tutor Tip */}
                      <div className={`lg:col-span-5 p-4 rounded-xl border flex flex-col justify-between ${
                        projectorMode ? "bg-slate-800 border-slate-700/60" : "bg-indigo-50/20 border-indigo-100/50"
                      }`}>
                        <div className="space-y-2">
                          <span className="inline-flex gap-1 items-center text-[9px] font-mono font-bold uppercase text-indigo-550 tracking-widest leading-none">
                            <Sparkles size={11} className="text-indigo-500" /> SSlive Diagnosis Advice
                          </span>
                          <p className="text-slate-500 text-xs leading-relaxed font-sans mt-1">
                            {stats.pctCorrect >= 75 
                              ? `Meeting demonstrates robust competence! Re-affirm ${q.correctAnswer} and build on deeper conceptual applications in upcoming exercises.`
                              : stats.pctCorrect >= 45
                                ? `Satisfactory progress, though some scholar factions are confused by alternative options. Highlight and critique incorrect assumptions and explanations during summary.`
                                : stats.pctCorrect > 0
                                  ? `Critical teaching gap! Over 50% of the class has missed the concept. Slow the activity down, and run a spontaneous breakdown review live.`
                                  : "Waiting for scholar submit packets to formulate live diagnostic tutoring guidance."
                            }
                          </p>
                        </div>
                        
                        {q.explanation && (
                          <div className="mt-4 pt-3 border-t border-slate-205/60 text-[11px] text-slate-450 italic">
                            <strong>Note:</strong> {q.explanation}
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

        </AnimatePresence>
      )}

      {/* 5. Unique SSlive Observatory Footnotes */}
      <div className={`p-5 rounded-2xl border flex items-start gap-3 transition-colors duration-300 ${
        projectorMode 
          ? "bg-slate-850/30 border-slate-800 text-slate-300" 
          : "bg-indigo-50/30 border-indigo-150/40"
      }`}>
        <Star className="text-amber-400 mt-0.5 shrink-0" size={17} />
        <div>
          <h4 className={`text-xs font-mono font-bold uppercase tracking-wider ${
            projectorMode ? "text-indigo-300" : "text-indigo-700"
          }`}>
            Athenian Live Co-Pilot & Safe Sharing
          </h4>
          <p className="mt-1 text-xs leading-relaxed opacity-90">
            This observation center delivers live feedback. To hide student identity or shield grade anxieties in a crowded room, standardly toggle off <strong className="font-bold">Show Names</strong> or <strong className="font-semibold text-slate-750">Show Results</strong> before projecting onto a screen.
          </p>
        </div>
      </div>

    </div>
  );
}
