import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../firebase";
import { Room, DebateArgument, Participant } from "../types";
import { 
  Sparkles, 
  Users, 
  Flame, 
  ThumbsUp, 
  ShieldAlert, 
  Zap, 
  ArrowRight, 
  Clock, 
  Award, 
  Activity, 
  MessageSquareX,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TeacherDebateConsoleProps {
  room: Room;
  participants: Participant[];
  onEndActivity: () => void;
}

export default function TeacherDebateConsole({
  room,
  participants,
  onEndActivity
}: TeacherDebateConsoleProps) {
  const [argumentsList, setArgumentsList] = useState<DebateArgument[]>([]);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [isGeneratingCatalyst, setIsGeneratingCatalyst] = useState(false);
  const [catalystError, setCatalystError] = useState<string | null>(null);

  const debateConfig = room.liveDebate || {
    prompt: "To what extent does digital architecture shape human morality?",
    sideA: "Structure Dictates Norms",
    sideB: "Human Agency Primacy"
  };

  // 1. Live stream actual posted arguments
  useEffect(() => {
    const qArgs = query(
      collection(db, "rooms", room.roomId, "debate_arguments"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(qArgs, (snap) => {
      const args: DebateArgument[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        args.push({
          id: docSnap.id,
          author: data.author,
          authorTeam: data.authorTeam,
          avatar: data.avatar,
          content: data.content,
          timestamp: data.timestamp,
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          challenged: data.challenged || false,
          tags: data.tags || []
        });
      });
      setArgumentsList(args);
    });

    return unsubscribe;
  }, [room.roomId]);

  // 2. Count current stances
  const sideAVoters = participants.filter(p => p.answers && p.answers[0] === "A");
  const sideBVoters = participants.filter(p => p.answers && p.answers[0] === "B");
  const totalStanceVotes = sideAVoters.length + sideBVoters.length;

  const pctA = totalStanceVotes > 0 ? Math.round((sideAVoters.length / totalStanceVotes) * 100) : 50;
  const pctB = totalStanceVotes > 0 ? Math.round((sideBVoters.length / totalStanceVotes) * 100) : 50;

  // 3. AISocratic Catalyst trigger
  const handleTriggerAICatalyst = async () => {
    setIsGeneratingCatalyst(true);
    setCatalystError(null);

    try {
      const response = await fetch("/api/debate/catalyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: debateConfig.prompt,
          arguments: argumentsList.slice(0, 5).map(a => ({
            author: a.author,
            content: a.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Socratic catalyst middleware.");
      }

      const data = await response.json();
      const catalystContent = data.catalyst;

      // Post Socratic catalyst directly into debate_arguments feed so everyone sees it live!
      await addDoc(collection(db, "rooms", room.roomId, "debate_arguments"), {
        author: "Socrates (AI Catalyst)",
        authorTeam: "Neutral",
        avatar: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=100&q=80",
        content: catalystContent,
        timestamp: new Date().toISOString(), // Use simple string for reliable sorting/timestamping in preview
        likes: 0,
        likedBy: [],
        challenged: false,
        tags: ["#Catalyst", "#Disruptor"]
      });

    } catch (e: any) {
      console.error(e);
      setCatalystError(e.message || "Something went wrong. Let's retry.");
    } finally {
      setIsGeneratingCatalyst(false);
    }
  };

  // 4. Toggle Socratic Challenge on arguments
  const handleToggleChallenge = async (argId: string, currentChallenged: boolean) => {
    try {
      const docRef = doc(db, "rooms", room.roomId, "debate_arguments", argId);
      await updateDoc(docRef, {
        challenged: !currentChallenged
      });
    } catch (e) {
      console.error("Failed to challenge claim", e);
    }
  };

  // 5. Delete extreme/clatter argument if needed
  const handleDeleteArgument = async (argId: string) => {
    if (!confirm("Are you sure you want to permanently delete this argument claim?")) {
      return;
    }
    try {
      const docRef = doc(db, "rooms", room.roomId, "debate_arguments", argId);
      await deleteDoc(docRef);
    } catch (e) {
      console.error("Failed to delete argument", e);
    }
  };

  // Sort logic
  const sortedArgs = [...argumentsList].sort((a, b) => {
    if (sortBy === "popular") {
      return b.likes - a.likes || (b.timestamp > a.timestamp ? 1 : -1);
    }
    return b.timestamp > a.timestamp ? 1 : -1;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" id="teacher-debate-console-root">
      
      {/* LEFT COLUMN: ACTIVE STATUS, STANCE STATS & AI CATALYST (5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Debate Prompt Panel */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full filter blur-xl" />
          <div className="flex items-center gap-2">
            <span className="py-0.5 px-2 bg-rose-550/20 border border-rose-500/30 rounded text-[9px] font-mono tracking-widest text-rose-300 font-bold uppercase">
              Main Dialectic
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
              <Users size={12} /> {participants.length} Active Minds
            </span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-xs font-mono font-bold text-slate-400">PROPONENT QUESTION</h4>
            <p className="text-sm font-display font-semibold leading-normal text-slate-100">
              {debateConfig.prompt}
            </p>
          </div>

          {/* Real-time Meter bar */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-[10px] font-mono font-black tracking-wider text-slate-350">
              <span className="text-[#fbbc05]">THESIS (A): {pctA}%</span>
              <span className="text-[#016a40]">ANTITHESIS (B): {pctB}%</span>
            </div>

            <div className="w-full h-4 bg-slate-950 rounded-full flex overflow-hidden border border-slate-800">
              <motion.div 
                className="bg-[#fbbc05] h-full"
                animate={{ width: `${pctA}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.div 
                className="bg-[#016a40] h-full"
                animate={{ width: `${pctB}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1 text-center">
              <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60">
                <span className="text-xs font-mono font-bold text-[#fbbc05]/95">{sideAVoters.length}</span>
                <p className="text-[9px] text-slate-400 font-medium font-sans leading-tight mt-0.5">{debateConfig.sideA}</p>
              </div>
              <div className="p-2.5 bg-slate-950/40 rounded-xl border border-slate-800/60">
                <span className="text-xs font-mono font-bold text-[#016a40]/95">{sideBVoters.length}</span>
                <p className="text-[9px] text-slate-400 font-medium font-sans leading-tight mt-0.5">{debateConfig.sideB}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Catalyst Launcher */}
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-2xl border border-indigo-500/20 space-y-4 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full filter blur-2xl" />
          
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono tracking-widest text-indigo-300 font-bold uppercase py-0.5 px-2 bg-indigo-505/20 border border-indigo-400/20 rounded">
              maieutic inject
            </span>
            <span className="text-[9px] font-mono text-slate-400">AI Powered</span>
          </div>

          <div className="space-y-1.5">
            <h4 className="text-sm font-display font-semibold text-indigo-50">Disrupt & Stimulate thinking with AI Catalyst</h4>
            <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
              Is class discussion reaching an consensus too fast? Inject an AI Catalyst! Our Athens-trained Socratic middleware analyzes ongoing student claims and introduces a sharp critical edge case to ignite fresh arguments.
            </p>
          </div>

          <div className="pt-2">
            <button 
              onClick={handleTriggerAICatalyst}
              disabled={isGeneratingCatalyst}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-55 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={14} className={isGeneratingCatalyst ? "animate-spin" : "animate-pulse"} />
              {isGeneratingCatalyst ? "Synthesizing dialectical challenge..." : "Inject AI Debate Catalyst"}
            </button>
            
            {catalystError && (
              <p className="text-[10px] font-mono text-rose-400 mt-2 bg-rose-950/20 border border-rose-900/30 p-2 rounded-lg text-center">
                ⚠️ {catalystError}
              </p>
            )}
          </div>
        </div>

        {/* Classroom stance list summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs space-y-3.5 max-h-[300px] overflow-y-auto">
          <h4 className="text-[10px] font-mono uppercase font-black tracking-wider text-slate-400 flex items-center gap-1.5">
            <Activity size={12} className="text-rose-500" /> STANCE REGISTRY ({participants.length})
          </h4>

          {participants.length === 0 ? (
            <p className="text-xs text-slate-400 font-sans italic py-1.5">Waiting for students to join or pick sides...</p>
          ) : (
            <div className="space-y-2">
              {participants.map((p, idx) => {
                const stance = p.answers && p.answers[0];
                return (
                  <div key={p.id || idx} className="flex justify-between items-center text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-150 rounded-xl">
                    <span className="font-semibold text-slate-700">{p.name}</span>
                    {stance === "A" ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#fbbc05]/10 border border-[#fbbc05]/20 text-yellow-800 font-mono text-[9px] font-black uppercase">
                        THESIS
                      </span>
                    ) : stance === "B" ? (
                      <span className="px-2 py-0.5 rounded-md bg-[#016a40]/10 border border-[#016a40]/20 text-[#016a40] font-mono text-[9px] font-black uppercase">
                        ANTITHESIS
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-400 font-mono text-[9px] uppercase font-bold">
                        DECIDING
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: REAL-TIME CLAIMS FEED STREAM (7 cols) */}
      <div className="lg:col-span-12 xl:col-span-7 col-span-1 border border-slate-200 bg-white p-6 rounded-2xl shadow-3xs space-y-5">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-display font-medium text-slate-900 flex items-center gap-2">
              <Flame className="text-rose-500" size={16} /> Dilectical Arguments Stream
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Real-time student textual claim submission ledger.</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl self-end sm:self-auto shrink-0">
            <button
              onClick={() => setSortBy("latest")}
              className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg cursor-pointer ${
                sortBy === "latest" ? "bg-white text-slate-850 shadow-3xs" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Latest
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`px-3 py-1 text-[10px] font-mono font-bold rounded-lg cursor-pointer ${
                sortBy === "popular" ? "bg-white text-slate-850 shadow-3xs" : "text-slate-500 hover:text-slate-705"
              }`}
            >
              Popular
            </button>
          </div>
        </div>

        {/* LIST OF POSTED CLAIMS */}
        <div className="space-y-4 max-h-[620px] overflow-y-auto pr-2">
          <AnimatePresence initial={false}>
            {sortedArgs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="mx-auto text-slate-300 animate-pulse" size={28} />
                <p className="text-xs font-sans italic">Quiet in the agora right now. No arguments posted yet!</p>
                <p className="text-[10px] max-w-sm mx-auto">Instruct students to join via code and complete stance arguments from their mobile terminals.</p>
              </div>
            ) : (
              sortedArgs.map((arg) => {
                const isCatalyst = arg.tags && arg.tags.includes("#Catalyst");
                const stanceColor = arg.authorTeam === "A" ? "#fbbc05" : arg.authorTeam === "B" ? "#016a40" : "#64748b";

                return (
                  <motion.div
                    key={arg.id}
                    layoutId={`arg-card-${arg.id}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className={`p-4 rounded-xl border relative transition-all ${
                      isCatalyst
                        ? "bg-indigo-50/50 border-indigo-200/60 shadow-3xs"
                        : arg.challenged
                        ? "bg-rose-50/40 border-rose-200/80 shadow-3xs"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    
                    {/* Highlighted Banner for special cards */}
                    {isCatalyst && (
                      <span className="absolute top-3 right-3 text-[8.5px] font-mono text-indigo-700 font-extrabold px-1.5 py-0.5 bg-indigo-100 rounded border border-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={10} className="animate-spin" /> AI Catalyst Highlighted
                      </span>
                    )}

                    <div className="flex gap-3">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-205 flex items-center justify-center font-bold text-slate-600 font-mono text-sm uppercase shrink-0 overflow-hidden select-none">
                        {arg.avatar ? (
                          <img src={arg.avatar} alt="avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          arg.author.substring(0, 2)
                        )}
                      </div>

                      {/* Content column */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 font-sans truncate">{arg.author}</span>
                          
                          {/* Stance Tag */}
                          {!isCatalyst && arg.authorTeam && (
                            <span 
                              className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded"
                              style={{ 
                                backgroundColor: arg.authorTeam === "A" ? "rgba(251,188,5,0.11)" : "rgba(1,106,64,0.11)",
                                color: stanceColor,
                                border: `1px solid ${arg.authorTeam === "A" ? "rgba(251,188,5,0.22)" : "rgba(1,106,64,0.22)"}`
                              }}
                            >
                              {arg.authorTeam === "A" ? "THESIS" : "ANTITHESIS"}
                            </span>
                          )}
                        </div>

                        {/* Argument Text Box */}
                        <div className="text-xs font-medium text-slate-705 leading-relaxed break-words pr-2">
                          {arg.content}
                        </div>

                        {/* Actions line */}
                        <div className="pt-2 flex flex-wrap items-center gap-3.5 text-[10px] font-mono text-slate-400 font-semibold select-none">
                          <span className="flex items-center gap-1">
                            <ThumbsUp size={11} className="text-indigo-500" /> {arg.likes} likes
                          </span>

                          {/* Quick Socratic tag badges */}
                          {arg.tags && arg.tags.map(t => (
                            <span key={t} className="text-[9px] text-indigo-500 uppercase font-black">{t}</span>
                          ))}

                          <div className="ml-auto flex items-center gap-2">
                            {/* Toggle Socratic Challenge trigger */}
                            {!isCatalyst && (
                              <button
                                onClick={() => handleToggleChallenge(arg.id, arg.challenged)}
                                className={`px-2 py-1 rounded text-[9px] border transition-all cursor-pointer flex items-center gap-1 ${
                                  arg.challenged
                                    ? "bg-rose-600 border-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-3xs"
                                    : "bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600"
                                }`}
                              >
                                <ShieldAlert size={10} />
                                {arg.challenged ? "Socratic Challenge ACTIVE" : "Socratic Challenge"}
                              </button>
                            )}

                            {/* Moderator Delete */}
                            <button
                              onClick={() => handleDeleteArgument(arg.id)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-rose-100"
                              title="Delete claim"
                            >
                              <Trash2 size={13} className="shrink-0" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>

                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
