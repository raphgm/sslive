import React, { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { db } from "../firebase";
import { Room, Participant, DebateArgument } from "../types";
import { 
  ThumbsUp, 
  Send, 
  MessageSquare, 
  ShieldAlert, 
  Sparkles, 
  ChevronRight, 
  Vote, 
  Flame,
  Info 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudentDebateInterfaceProps {
  room: Room;
  studentRecord: Participant;
}

export default function StudentDebateInterface({
  room,
  studentRecord
}: StudentDebateInterfaceProps) {
  const [argumentText, setArgumentText] = useState("");
  const [argumentsList, setArgumentsList] = useState<DebateArgument[]>([]);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);
  const [activeTab, setActiveTab] = useState<"arguments" | "post">("arguments");

  const debateConfig = room.liveDebate || {
    prompt: "To what extent does digital architecture shape human morality?",
    sideA: "Structure Dictates Norms",
    sideB: "Human Agency Primacy"
  };

  const currentStance = studentRecord.answers && studentRecord.answers[0];

  // 1. Subscribe to the live arguments stream
  useEffect(() => {
    const q = query(
      collection(db, "rooms", room.roomId, "debate_arguments"),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: DebateArgument[] = [];
      snap.forEach((d) => {
        const data = d.data();
        list.push({
          id: d.id,
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
      setArgumentsList(list);
    });

    return unsubscribe;
  }, [room.roomId]);

  // 2. Register/Change Stance dynamically
  const handleChangeStance = async (stance: "A" | "B") => {
    try {
      const pRef = doc(db, "rooms", room.roomId, "participants", studentRecord.id);
      await updateDoc(pRef, {
        answers: { 0: stance },
        completed: true
      });
    } catch (e) {
      console.error("Failed to commit stance", e);
    }
  };

  // 3. Submit argument claim
  const handlePostClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!argumentText.trim() || !currentStance || isSubmittingClaim) return;

    setIsSubmittingClaim(true);
    try {
      await addDoc(collection(db, "rooms", room.roomId, "debate_arguments"), {
        author: studentRecord.name,
        authorTeam: currentStance,
        avatar: studentRecord.avatar || "",
        content: argumentText.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        challenged: false,
        tags: []
      });

      setArgumentText("");
      setActiveTab("arguments");
    } catch (e) {
      console.error("Failed to post claim", e);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // 4. Like / Support argument
  const handleLikeArgument = async (argId: string, likedByList: string[], currentLikes: number) => {
    const studentId = studentRecord.id;
    const hasLiked = likedByList.includes(studentId);
    
    try {
      const docRef = doc(db, "rooms", room.roomId, "debate_arguments", argId);
      if (hasLiked) {
        await updateDoc(docRef, {
          likes: Math.max(0, currentLikes - 1),
          likedBy: arrayRemove(studentId)
        });
      } else {
        await updateDoc(docRef, {
          likes: currentLikes + 1,
          likedBy: arrayUnion(studentId)
        });
      }
    } catch (e) {
      console.error("Failed to toggle support", e);
    }
  };

  return (
    <div className="space-y-5" id="student-debate-container">
      
      {/* Title & Topic Display */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xs">
        <span className="text-[9px] font-mono tracking-widest text-[#fbbf24] font-black uppercase inline-flex items-center gap-1">
          <Flame size={10} className="text-rose-500" /> SSLive Challenge
        </span>
        <h3 className="text-sm font-display font-bold leading-relaxed text-slate-100">
          {debateConfig.prompt}
        </h3>
      </div>

      {/* Choose/Modify Stance Bar (Highly visual & interactive) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 space-y-3">
        <label className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wide">
          Your Stance alignment:
        </label>
        
        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => handleChangeStance("A")}
            className={`py-3.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 select-none cursor-pointer ${
              currentStance === "A"
                ? "bg-[#fbbc05]/10 border-[#fbbc05] text-yellow-900 shadow-2xs"
                : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100/60"
            }`}
            style={{ minHeight: "56px" }}
          >
            <span className="text-[9px] font-mono font-black text-[#fbbf24] uppercase">Side A</span>
            <span className="text-center truncate max-w-full text-[11px] leading-snug">{debateConfig.sideA}</span>
          </button>

          <button
            type="button"
            onClick={() => handleChangeStance("B")}
            className={`py-3.5 px-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 select-none cursor-pointer ${
              currentStance === "B"
                ? "bg-[#016a40]/10 border-[#016a40] text-[#016a40] shadow-2xs"
                : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100/60"
            }`}
            style={{ minHeight: "56px" }}
          >
            <span className="text-[9px] font-mono font-black text-[#016a40] uppercase">Side B</span>
            <span className="text-center truncate max-w-full text-[11px] leading-snug">{debateConfig.sideB}</span>
          </button>
        </div>

        {!currentStance && (
          <p className="text-[10.5px] text-rose-600 font-medium text-center animate-pulse pt-1">
            ⚠️ Tap either thesis to align your terminal and unlock post capabilities!
          </p>
        )}
      </div>

      {/* Sub tabs: Arguments Stream vs Post Stance Claim */}
      <div className="flex bg-slate-150 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("arguments")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === "arguments" ? "bg-white text-slate-900 font-bold shadow-3xs" : "text-slate-500"
          }`}
        >
          <MessageSquare size={13} />
          Arguments ({argumentsList.length})
        </button>
        <button
          disabled={!currentStance}
          onClick={() => setActiveTab("post")}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            !currentStance 
              ? "opacity-40 cursor-not-allowed text-slate-400" 
              : activeTab === "post" ? "bg-white text-slate-900 font-bold shadow-3xs cursor-pointer" : "text-slate-505 cursor-pointer"
          }`}
        >
          <Send size={13} />
          Post Claim
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        {activeTab === "arguments" && (
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {argumentsList.length === 0 ? (
              <div className="text-center py-10 bg-white border border-slate-150 rounded-2xl text-slate-400 space-y-1.5 px-4">
                <Vote size={24} className="mx-auto text-slate-300 animate-pulse" />
                <p className="text-xs font-serif italic text-slate-500">The Agora is silent.</p>
                <p className="text-[10px] leading-relaxed max-w-[240px] mx-auto">Align your stance above and tap <strong>Post Claim</strong> to introduce the first argument!</p>
              </div>
            ) : (
              argumentsList.map((arg) => {
                const isCatalyst = arg.tags && arg.tags.includes("#Catalyst");
                const hasLiked = arg.likedBy && arg.likedBy.includes(studentRecord.id);
                const stanceColor = arg.authorTeam === "A" ? "#fbbc05" : arg.authorTeam === "B" ? "#016a40" : "#64748b";

                return (
                  <div
                    key={arg.id}
                    className={`p-3.5 rounded-xl border relative transition-all ${
                      isCatalyst
                        ? "bg-indigo-50/50 border-indigo-200/60 shadow-3xs animate-pulse-once"
                        : arg.challenged
                        ? "bg-rose-50/45 border-rose-250 animate-pulse"
                        : "bg-white border-slate-150"
                    }`}
                  >
                    
                    {/* Socratic Challenge Indicator */}
                    {arg.challenged && (
                      <div className="mb-2 text-[9.5px] font-mono leading-relaxed font-bold uppercase tracking-wider text-rose-700 bg-rose-100 rounded-md py-1 px-1.5 border border-rose-200 flex items-center gap-1.5">
                        <ShieldAlert size={11} className="animate-bounce" /> 
                        Claim Challenged by Socrates AI
                      </div>
                    )}

                    {/* AI Catalyst Badge */}
                    {isCatalyst && (
                      <div className="mb-2 text-[9px] font-mono leading-normal font-black uppercase tracking-widest text-indigo-700 bg-indigo-100 rounded-md py-1 px-1.5 border border-indigo-200 flex items-center gap-1">
                        <Sparkles size={11} className="animate-spin text-indigo-600" />
                        AI Socratic Disruptor Inject
                      </div>
                    )}

                    <div className="space-y-1.5 leading-snug">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold font-mono">
                        <span className="font-bold text-slate-700 font-sans">{arg.author}</span>
                        {!isCatalyst && arg.authorTeam && (
                          <span 
                            className="text-[7.5px] px-1 py-0.2 rounded"
                            style={{ 
                              backgroundColor: arg.authorTeam === "A" ? "rgba(251,188,5,0.08)" : "rgba(1,106,64,0.08)",
                              color: stanceColor,
                              border: `1px solid ${arg.authorTeam === "A" ? "rgba(251,188,5,0.18)" : "rgba(1,106,64,0.18)"}`
                            }}
                          >
                            {arg.authorTeam === "A" ? "THESIS" : "ANTITHESIS"}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-705 leading-relaxed break-words font-sans">
                        {arg.content}
                      </p>

                      <div className="pt-1.5 flex justify-between items-center text-[10px] text-slate-450 font-semibold font-mono border-t border-slate-100">
                        {/* Support trigger */}
                        <button
                          onClick={() => handleLikeArgument(arg.id, arg.likedBy, arg.likes)}
                          className={`flex items-center gap-1 cursor-pointer py-1 px-2.5 rounded-lg border transition-all ${
                            hasLiked
                              ? "bg-indigo-600 border-indigo-600 text-white font-black"
                              : "bg-slate-50 hover:bg-indigo-50 border-slate-150 text-slate-500 hover:text-indigo-600"
                          }`}
                        >
                          <ThumbsUp size={10} className={hasLiked ? "text-white" : "text-indigo-550"} />
                          <span>Support {arg.likes > 0 ? `(${arg.likes})` : ""}</span>
                        </button>

                        <span>{isCatalyst ? "AI GENERATED" : "PEER CLAIM"}</span>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === "post" && currentStance && (
          <form onSubmit={handlePostClaim} className="bg-white p-5 rounded-2xl border border-slate-150 space-y-4 shadow-3xs">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 font-bold uppercase">
                <span>Your textual Argument:</span>
                <span>{argumentText.length} / 250</span>
              </div>
              
              <textarea
                value={argumentText}
                onChange={(e) => setArgumentText(e.target.value.substring(0, 250))}
                placeholder={`Defend your stance "${currentStance === "A" ? debateConfig.sideA : debateConfig.sideB}" with logical rigor...`}
                className="w-full p-3 border border-slate-205 rounded-xl text-xs font-medium focus:ring-1 focus:ring-indigo-550 focus:border-indigo-550 placeholder:text-slate-350 min-h-[96px] bg-slate-50/40 text-slate-800 leading-relaxed outline-hidden"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!argumentText.trim() || isSubmittingClaim}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Send size={12} />
              {isSubmittingClaim ? "Submitting argument claim..." : "Publish Claim to Agora"}
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
