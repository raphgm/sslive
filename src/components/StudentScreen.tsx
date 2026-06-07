import React, { useState, useEffect, useRef } from "react";
import { 
  Rocket, CheckCircle, AlertCircle, ArrowRight, ArrowLeft, User, CircleDot, 
  HelpCircle, Clock, Award, Compass, Shield, Check, X, Sparkles, Mail, Send,
  Shuffle, Flame, Lightbulb
} from "lucide-react";
import { playSound, generateNicknames, getRandomFact, streakBonus, REACTIONS } from "../lib/gameEnhancements";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, serverTimestamp } from "firebase/firestore";
import { motion } from "motion/react";
import confetti from "canvas-confetti";

import { db, handleFirestoreError, OperationType } from "../firebase";
import { Room, Question, Participant, QuickQuestionConfig } from "../types";
import { DialecticChallengeCard, MaieuticDialogueCard } from "./InquiryCoreComponents";
import { Doodles } from "./Doodles";
import StudentDebateInterface from "./StudentDebateInterface";

interface StudentScreenProps {
  initialRoomCode?: string;
  onExit?: () => void;
}

export default function StudentScreen({ initialRoomCode = "", onExit }: StudentScreenProps) {
  // Connection states
  const [roomCode, setRoomCode] = useState(initialRoomCode);
  const [studentName, setStudentName] = useState("");
  const [nicknameSuggestions, setNicknameSuggestions] = useState<string[]>(() => generateNicknames(3));
  const [selectedTeam, setSelectedTeam] = useState("Blue Nova");
  const [step, setStep] = useState<"enter-room" | "enter-name" | "active-session">("enter-room");
  const [didYouKnowFact] = useState<string>(() => getRandomFact());
  const [recentBonus, setRecentBonus] = useState<{ pts: number; streak: number } | null>(null);

  // Live Sync states
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [studentRecord, setStudentRecord] = useState<Participant | null>(null);
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connectionError, setConnectionError] = useState("");

  // Student Paging Local Navigation States (for Student-Paced quizzes)
  const [localQuestionIndex, setLocalQuestionIndex] = useState(0);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [immediateFeedbackData, setImmediateFeedbackData] = useState<{
    correct: boolean;
    chosen: string;
    answer: string;
    explanation: string;
  } | null>(null);

  // Autofill Room Code from url parameters e.g., `?room=MATH101`
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room") || params.get("r");
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
    } else if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  // Listen to Active Room changes once joined
  useEffect(() => {
    if (step !== "active-session" || !roomCode) return;

    const formattedCode = roomCode.trim().toUpperCase();
    const unsubscribe = onSnapshot(doc(db, "rooms", formattedCode), async (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.data() as Room;
        setActiveRoom(roomData);

        // Fetch quiz questions if room specifies an active quiz
        if (roomData.activeQuizId) {
          const quizSnap = await getDoc(doc(db, "quizzes", roomData.activeQuizId));
          if (quizSnap.exists()) {
            const quizQuestions = quizSnap.data().questions as Question[];
            setActiveQuizQuestions(quizQuestions);
          }
        } else {
          setActiveQuizQuestions([]);
        }
      } else {
        // Room closed or deleted
        setStep("enter-room");
        setConnectionError("This meeting room has been closed by the teacher.");
      }
    }, (err) => {
      console.error("Error listening to room:", err);
    });

    return unsubscribe;
  }, [step, roomCode]);

  // Listen to Student's own participant record in the db to keep synced
  useEffect(() => {
    if (step !== "active-session" || !roomCode || !studentName) return;

    const formattedCode = roomCode.trim().toUpperCase();
    const cleanId = studentName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

    const unsubscribe = onSnapshot(doc(db, "rooms", formattedCode, "participants", cleanId), (snap) => {
      if (snap.exists()) {
        setStudentRecord(snap.data() as Participant);
      }
    });

    return unsubscribe;
  }, [step, roomCode, studentName]);

  // Real-time listener for all participants to power Inquiry collaborative arenas
  useEffect(() => {
    if (step !== "active-session" || !roomCode) return;
    const formattedCode = roomCode.trim().toUpperCase();
    const unsubscribe = onSnapshot(collection(db, "rooms", formattedCode, "participants"), (snap) => {
      const list: Participant[] = [];
      snap.forEach((d) => {
        list.push(d.data() as Participant);
      });
      setAllParticipants(list);
    }, (err) => {
      console.error("Collaborative live-roster error:", err);
    });
    return unsubscribe;
  }, [step, roomCode]);

  // Focus Tracking (Off-task detection)
  useEffect(() => {
    if (step !== "active-session" || !studentRecord || !roomCode) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        try {
          const currentCount = studentRecord.offTaskCount || 0;
          const formattedCode = roomCode.trim().toUpperCase();
          const studentId = studentRecord.id;
          await updateDoc(doc(db, "rooms", formattedCode, "participants", studentId), {
            offTaskCount: currentCount + 1
          });
        } catch (e) {
          console.error("Failed to log off-task event", e);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [step, studentRecord, roomCode]);

  // Confetti on Complete
  const hasFiredConfetti = useRef(false);
  useEffect(() => {
    if (studentRecord?.completed && !hasFiredConfetti.current) {
      hasFiredConfetti.current = true;
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#a855f7', '#ec4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [studentRecord?.completed]);

  // Join Room validation handler
  const handleVerifyRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = roomCode.trim().toUpperCase();
    if (!formattedCode) {
      setConnectionError("Please write a valid room code!");
      return;
    }

    setConnectionError("");
    setIsSubmitting(true);

    try {
      const roomRef = doc(db, "rooms", formattedCode);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        setConnectionError(`Meeting "${formattedCode}" does not exist. Check with your teacher.`);
        setIsSubmitting(false);
        return;
      }

      const rData = roomSnap.data() as Room;
      setActiveRoom(rData);
      setStep("enter-name");
    } catch (err) {
      console.error(err);
      setConnectionError("Failed to communicate with meeting server. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Register Guest Student record
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCode = roomCode.trim().toUpperCase();
    const cleanName = studentName.trim();
    
    if (!cleanName) {
      setConnectionError("Please provide your name!");
      return;
    }

    setConnectionError("");
    setIsSubmitting(true);

    try {
      // Check if room roster is enabled and restrict access
      if (activeRoom && activeRoom.rosterEnabled && activeRoom.allowedRoster && activeRoom.allowedRoster.length > 0) {
        const isAllowed = activeRoom.allowedRoster.some(
          name => name.trim().toLowerCase() === cleanName.toLowerCase()
        );
        if (!isAllowed) {
          setConnectionError(`Access denied: "${cleanName}" is not registered on this room's roster.`);
          setIsSubmitting(false);
          return;
        }
      }

      // Use clean lowercase string as doc ID
      const studentId = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const participantRef = doc(db, "rooms", formattedCode, "participants", studentId);
      
      const participantSnap = await getDoc(participantRef);
      if (participantSnap.exists()) {
        // Name already taken, alert student or allow them to reconnect
        // For standard meeting, we allow them to reconnect to resume progress!
        const existingData = participantSnap.data() as Participant;
        setStudentRecord(existingData);
        setLocalQuestionIndex(existingData.progress);
        setStep("active-session");
        setIsSubmitting(false);
        return;
      }

      // Create new student participant
      const newParticipant: Participant = {
        id: studentId,
        name: cleanName,
        team: activeRoom?.activeActivity === "space-race" ? selectedTeam : null,
        score: 0,
        progress: 0,
        answers: {},
        completed: false,
        joinedAt: new Date().toISOString(),
        offTaskCount: 0,
      };

      await setDoc(participantRef, newParticipant).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `rooms/${formattedCode}/participants/${studentId}`);
      });

      setStudentRecord(newParticipant);
      setLocalQuestionIndex(0);
      setStep("active-session");
    } catch (err) {
      console.error(err);
      setConnectionError("Failed to join meeting terminal. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send a reaction emoji — writes to participant doc, teacher dashboard listens
  const handleSendReaction = async (emoji: string) => {
    if (!activeRoom || !studentRecord) return;
    playSound("reaction");
    try {
      const ref = doc(db, "rooms", activeRoom.roomId, "participants", studentRecord.id);
      await updateDoc(ref, {
        lastReactionEmoji: emoji,
        lastReactionAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn("Reaction send failed", e);
    }
  };

  // Student answer submits
  const handleSubmitAnswer = async (selectedAnswer: string) => {
    if (!activeRoom || !studentRecord || isSubmitting) return;

    setIsSubmitting(true);
    const formattedCode = activeRoom.roomId;
    const studentId = studentRecord.id;

    // Determine current index depending on standard pacing or local navigation pacing
    const isTeacherPaced = activeRoom.pacing === "teacher-paced";
    const currentQIdx = isTeacherPaced ? activeRoom.activeQuestionIndex : localQuestionIndex;
    const currentQ = activeQuizQuestions[currentQIdx];

    // Build updated answers map
    const updatedAnswers = {
      ...studentRecord.answers,
      [currentQIdx]: selectedAnswer
    };

    // Calculate score change w/ streak bonus
    // Word-cloud has no right answer — participation = +1 pt, doesn't affect streak
    // Puzzle-order — compare "|"-joined sequence to correctAnswer
    let isCorrect: boolean;
    let isParticipation = false;
    if (currentQ.type === "word-cloud" || currentQ.type === "poll" || currentQ.type === "scale") {
      isCorrect = false;
      isParticipation = true;
    } else if (currentQ.type === "puzzle-order") {
      const expected = (currentQ.correctAnswer || currentQ.options.join("|")).trim();
      isCorrect = String(selectedAnswer).trim() === expected;
    } else {
      isCorrect = String(selectedAnswer).trim().toLowerCase() === String(currentQ.correctAnswer).trim().toLowerCase();
    }
    const prevStreak = studentRecord.currentStreak || 0;
    const newStreak = isCorrect ? prevStreak + 1 : isParticipation ? prevStreak : 0;
    const bonus = isCorrect ? streakBonus(newStreak) : 0;
    const pointsEarned = isCorrect ? 1 + bonus : isParticipation ? 1 : 0;
    const newScore = studentRecord.score + pointsEarned;
    const newMaxStreak = Math.max(studentRecord.maxStreak || 0, newStreak);
    const newStreakBonusTotal = (studentRecord.streakBonus || 0) + bonus;
    const newProgress = Math.max(studentRecord.progress, currentQIdx + 1);

    // Play sound + flash bonus toast
    if (isCorrect) {
      playSound(bonus > 0 ? "streak" : "correct");
      if (bonus > 0) {
        setRecentBonus({ pts: bonus, streak: newStreak });
        setTimeout(() => setRecentBonus(null), 2400);
      }
    } else if (isParticipation) {
      playSound("submit");
    } else {
      playSound("wrong");
    }
    
    const isQuizFinished = newProgress >= activeQuizQuestions.length;

    try {
      const participantRef = doc(db, "rooms", formattedCode, "participants", studentId);
      
      // Update DB record
      await updateDoc(participantRef, {
        answers: updatedAnswers,
        score: newScore,
        progress: newProgress,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        streakBonus: newStreakBonusTotal,
        completed: !isTeacherPaced && isQuizFinished,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${formattedCode}/participants/${studentId}`);
      });

      // Update local state copy
      setStudentRecord(prev => prev ? {
        ...prev,
        answers: updatedAnswers,
        score: newScore,
        progress: newProgress,
        currentStreak: newStreak,
        maxStreak: newMaxStreak,
        streakBonus: newStreakBonusTotal,
        completed: !isTeacherPaced && isQuizFinished
      } : null);

      // Handle student Paced Immediate Feedback display pops!
      if (!isTeacherPaced && activeRoom.showFeedback && activeRoom.activeActivity === "quiz") {
        setImmediateFeedbackData({
          correct: isCorrect,
          chosen: selectedAnswer,
          answer: currentQ.correctAnswer,
          explanation: currentQ.explanation
        });
      } else {
        // Advance question directly if immediate feedback is off and not teacher paced
        if (!isTeacherPaced) {
          setLocalQuestionIndex(prev => prev + 1);
        }
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Quick Question answer directly
  const handleSubmitQuickAnswer = async (val: string) => {
    if (!activeRoom || !studentRecord || isSubmitting) return;

    setIsSubmitting(true);
    const formattedCode = activeRoom.roomId;
    const studentId = studentRecord.id;

    try {
      const participantRef = doc(db, "rooms", formattedCode, "participants", studentId);
      
      await updateDoc(participantRef, {
        answers: { 0: val }, // quick question answer is always index 0
        progress: 1,
        completed: true
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${formattedCode}/participants/${studentId}`);
      });

    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save peer reaction/stances for Peer Forum anonymously
  const handleVoteReaction = async (targetParticipantId: string, qIdxStr: string, reactionType: "strongPremise" | "logicLeap" | "nuanced") => {
    if (!activeRoom || !studentRecord) return;
    
    // Find target participant in current local array
    const targetP = allParticipants.find(p => p.id === targetParticipantId);
    if (!targetP) return;

    // Build the updated reactions object
    const currentReactions = targetP.reactions || {};
    const qReactions = currentReactions[qIdxStr] || { strongPremise: 0, logicLeap: 0, nuanced: 0, voters: [] };
    
    // Check if current user has already voted for this question for this classmate
    const votersList = qReactions.voters || [];
    if (votersList.includes(studentRecord.id)) {
      return;
    }

    const updatedVoters = [...votersList, studentRecord.id];
    const updatedQReactions = {
      ...qReactions,
      [reactionType]: (qReactions[reactionType] || 0) + 1,
      voters: updatedVoters
    };

    const updatedReactions = {
      ...currentReactions,
      [qIdxStr]: updatedQReactions
    };

    try {
      const pRef = doc(db, "rooms", activeRoom.roomId, "participants", targetParticipantId);
      await updateDoc(pRef, {
        reactions: updatedReactions
      });
    } catch (err) {
      console.error("Failed to save peer reaction:", err);
    }
  };

  // Close immediate feedback card to move forward
  const handleAcknowledgeFeedback = () => {
    setImmediateFeedbackData(null);
    setLocalQuestionIndex((prev) => prev + 1);
  };

  const handleToggleHandRaise = async () => {
    if (!activeRoom || !studentRecord) return;
    const isCurrentlyRaised = !!studentRecord.handRaised;
    try {
      await updateDoc(doc(db, "rooms", activeRoom.roomId, "participants", studentRecord.id), {
        handRaised: !isCurrentlyRaised,
        handRaisedAt: !isCurrentlyRaised ? serverTimestamp() : null
      });
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, `rooms/${activeRoom.roomId}/participants/${studentRecord.id}`);
    }
  };

  const handleToggleNeedHelp = async () => {
    if (!activeRoom || !studentRecord) return;
    const isCurrentlyNeedingHelp = !!studentRecord.needsHelp;
    try {
      await updateDoc(doc(db, "rooms", activeRoom.roomId, "participants", studentRecord.id), {
        needsHelp: !isCurrentlyNeedingHelp
      });
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, `rooms/${activeRoom.roomId}/participants/${studentRecord.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-between p-4 md:p-6 font-sans text-slate-800 relative z-0">
      <Doodles />
      
      {/* Top logo header */}
      <header className="max-w-[600px] mx-auto w-full pt-6 flex justify-between items-center bg-transparent gap-4 relative z-10">
        <div className="flex items-center gap-2">
          {onExit && (
            <button
              onClick={onExit}
              className="px-2.5 py-1.5 text-[11px] text-slate-500 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-sm font-semibold mr-1"
              title="Return to Home Screen"
              type="button"
            >
              <ArrowLeft size={12} className="text-slate-400" />
              <span>Home</span>
            </button>
          )}
          <div className="flex items-center gap-2 select-none touch-none ml-1">
            <div className="relative w-8 h-8 flex items-center justify-center overflow-visible">
              {/* Circle 1: Discover Yellow (Drifts Top-Left) */}
              <motion.div 
                className="absolute w-[14px] h-[14px] rounded-full bg-[#fbbf24] opacity-90 shadow-[0_1px_3px_rgba(251,191,36,0.3)]"
                animate={{ 
                  x: [0, -5, -5, 0], 
                  y: [0, -4, -4, 0], 
                  scale: [1, 1.05, 1.05, 1]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  times: [0, 0.35, 0.65, 1]
                }}
              />

              {/* Circle 2: Discover Green (Drifts Top-Right) */}
              <motion.div 
                className="absolute w-[14px] h-[14px] rounded-full bg-[#10b981] opacity-90 shadow-[0_1px_3px_rgba(16,185,129,0.3)]"
                animate={{ 
                  x: [0, 5, 5, 0], 
                  y: [0, -4, -4, 0],
                  scale: [1, 1.05, 1.05, 1]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  times: [0, 0.35, 0.65, 1],
                  delay: 0.1
                }}
              />

              {/* Circle 3: Discover Blue (Drifts Bottom-Center) */}
              <motion.div 
                className="absolute w-[14px] h-[14px] rounded-full bg-[#6366f1] opacity-90 shadow-[0_1px_3px_rgba(99,102,241,0.3)]"
                animate={{ 
                  x: [0, 0, 0, 0], 
                  y: [0, 5, 5, 0],
                  scale: [1, 1.05, 1.05, 1]
                }}
                transition={{ 
                  duration: 3.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  times: [0, 0.35, 0.65, 1],
                  delay: 0.2
                }}
              />
            </div>
            <div className="flex items-center gap-1 text-[15px] sm:text-[17px] font-display font-bold tracking-tight text-slate-800 leading-[1.15] ml-1">
              <span>SSlive</span>
              <span>Student</span>
            </div>
          </div>
        </div>

        {step === "active-session" && activeRoom && studentRecord && (
          <div className="flex items-center bg-white/60 backdrop-blur-xl p-1.5 rounded-[24px] border border-slate-200/60 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.1)] gap-1 shrink-0 ml-4 max-w-[280px]">
            <button
              onClick={handleToggleNeedHelp}
              className={`group px-3 py-1.5 rounded-[18px] text-[11px] sm:text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer flex-1 w-24 relative overflow-hidden ${
                studentRecord.needsHelp
                  ? "bg-rose-50 text-rose-700 shadow-inner ring-1 ring-rose-200"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
              title="Need Help"
            >
              {studentRecord.needsHelp && <div className="absolute inset-0 bg-rose-400/10 mix-blend-overlay pointer-events-none" />}
              <HelpCircle size={13} className={`transition-transform duration-300 group-hover:scale-110 group-active:scale-95 z-10 ${studentRecord.needsHelp ? "text-rose-500" : "text-slate-400"}`} /> 
              <span className="z-10 text-center leading-tight whitespace-nowrap">{studentRecord.needsHelp ? "Notified" : "Help?"}</span>
            </button>
            
            <div className="w-[1px] h-6 bg-slate-200/80 mx-0.5 shrink-0" />
            
            <button
              onClick={handleToggleHandRaise}
              className={`group px-3 py-1.5 rounded-[18px] text-[11px] sm:text-[12px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer flex-1 w-28 relative overflow-hidden ${
                studentRecord.handRaised
                  ? "bg-amber-50 text-amber-900 shadow-inner ring-1 ring-amber-200"
                  : "hover:bg-slate-100 text-slate-600"
              }`}
              title="Raise hand"
            >
              {studentRecord.handRaised && <div className="absolute inset-0 bg-amber-400/20 mix-blend-overlay pointer-events-none" />}
              <span className={`text-[13px] z-10 transition-transform duration-300 group-hover:-translate-y-0.5 origin-bottom group-active:scale-95 ${studentRecord.handRaised ? "animate-pulse" : ""}`}>✋</span>
              <span className="z-10 text-center leading-tight whitespace-nowrap">{studentRecord.handRaised ? "Raised" : "Raise"}</span>
            </button>
            
            <div className="w-[1px] h-6 bg-slate-200/80 mx-0.5 shrink-0" />
            
            <div className="flex-1 w-24 px-3 py-1.5 rounded-[18px] bg-emerald-50 text-[11px] sm:text-[12px] font-bold flex justify-center items-center gap-1.5 whitespace-nowrap shadow-inner border border-emerald-100/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-emerald-800 tracking-wide">{activeRoom.roomId}</span>
            </div>
          </div>
        )}
      </header>

      {/* Streak chip + Reactions launcher — only during active quiz */}
      {step === "active-session" && studentRecord && activeRoom?.activeActivity === "quiz" && (
        <div className="max-w-md mx-auto w-full px-4 pt-3 flex items-center justify-between gap-2">
          {/* Streak indicator */}
          {(studentRecord.currentStreak || 0) >= 2 ? (
            <motion.div
              key={studentRecord.currentStreak}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 border border-orange-200 rounded-full text-[11px] font-bold text-orange-700 shadow-sm"
            >
              <Flame size={13} className="text-orange-500" />
              <span>{studentRecord.currentStreak}x Streak</span>
            </motion.div>
          ) : <span />}

          {/* Reactions launcher */}
          <div className="flex items-center gap-1 px-1.5 py-1 bg-white/70 backdrop-blur border border-slate-200 rounded-full shadow-sm">
            {REACTIONS.map(emoji => (
              <button
                key={emoji}
                onClick={() => handleSendReaction(emoji)}
                className="w-7 h-7 flex items-center justify-center text-base hover:scale-125 active:scale-90 transition-transform"
                title={`React ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating streak bonus toast */}
      {recentBonus && (
        <motion.div
          initial={{ y: 30, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -30, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-2xl flex items-center gap-2.5"
          style={{ background: "linear-gradient(135deg, #f97316, #ef4444)", boxShadow: "0 20px 50px -10px rgba(239,68,68,0.5)" }}
        >
          <Flame size={18} className="text-yellow-200" />
          <div>
            <div className="font-black">+{recentBonus.pts} Streak Bonus!</div>
            <div className="text-[10px] opacity-90 font-mono">{recentBonus.streak} correct in a row</div>
          </div>
        </motion.div>
      )}

      {/* Main Container */}
      <main className="max-w-md mx-auto w-full py-8 flex-1 flex flex-col justify-center">

        {/* STEP 1: TYPING ROOM CODE */}
        {step === "enter-room" && (
          <form onSubmit={handleVerifyRoom} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-3xs space-y-6">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-slate-100 text-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-250/30">
                <Compass size={18} />
              </div>
              <h2 className="text-lg font-display font-semibold text-slate-900">Join Meeting</h2>
              <p className="text-xs text-slate-500">Please enter the room code provided by your teacher</p>
            </div>

            {connectionError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2.5 border border-rose-100 font-sans">
                <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <p>{connectionError}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Room Code</label>
              <input 
                type="text"
                placeholder="e.g. MATH15"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-slate-200 uppercase tracking-widest font-mono font-semibold text-center rounded-xl focus:border-slate-800 focus:outline-hidden text-slate-800 h-11 text-sm bg-neutral-50/40 focus:bg-white transition-colors"
                id="student-room-code-input"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-colors shadow-3xs flex items-center justify-center gap-2 h-11 select-none cursor-pointer"
              id="student-join-room-btn"
            >
              <span>Verify Room</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* STEP 2: TYPING NAME & TEAMS */}
        {step === "enter-name" && activeRoom && (
          <form onSubmit={handleRegisterStudent} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200/80 shadow-3xs space-y-6">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-slate-100 text-slate-850 rounded-xl flex items-center justify-center mx-auto mb-2 border border-slate-250/30">
                <User size={18} />
              </div>
              <h2 className="text-lg font-display font-semibold text-slate-905">Register Student</h2>
              <p className="text-xs text-slate-500">Provide your name to participate in meeting activities</p>
            </div>

            {connectionError && (
              <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs flex items-start gap-2.5 border border-rose-100" id="name-error-display">
                <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <p>{connectionError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">Your Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Marie Curie, Albert, etc."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-slate-800 focus:outline-hidden text-sm text-slate-800 bg-neutral-50/40 focus:bg-white h-11 transition-colors"
                  required
                  id="student-name-input"
                />
                {/* Nickname suggestions */}
                <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                  <span className="text-[10px] text-slate-400 font-medium mr-1">Or pick:</span>
                  {nicknameSuggestions.map(nick => (
                    <button
                      key={nick}
                      type="button"
                      onClick={() => setStudentName(nick)}
                      className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-full text-[11px] font-medium text-slate-700 hover:text-indigo-700 transition-colors"
                    >
                      {nick}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNicknameSuggestions(generateNicknames(3))}
                    className="px-2 py-1 text-slate-400 hover:text-slate-700 transition-colors"
                    title="Shuffle suggestions"
                  >
                    <Shuffle size={12} />
                  </button>
                </div>
              </div>

              {/* SPACE RACE TEAM SELECTION SECTION */}
              {activeRoom.activeActivity === "space-race" && (
                <div className="space-y-1.5 p-4 bg-slate-50 border border-slate-200/65 rounded-xl">
                  <label className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider">Select Rocket Flight Team</label>
                  <p className="text-[10px] text-slate-400">Launch alongside partners in a live performance track:</p>
                  <select 
                    value={selectedTeam}
                    onChange={(e) => setSelectedTeam(e.target.value)}
                    className="w-full mt-2 text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-slate-800"
                  >
                    <option value="Blue Nova">Blue Nova</option>
                    <option value="Magenta Comet">Magenta Comet</option>
                    <option value="Lime Nebula">Lime Nebula</option>
                    <option value="Peach Solar">Peach Solar</option>
                    <option value="Daffodil Ray">Daffodil Ray</option>
                  </select>
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-950 hover:bg-slate-800 text-white font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-2 h-11 cursor-pointer"
              id="student-enter-btn"
            >
              <span>Join Activity</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

        {/* STEP 3: SESSION CORE LOGIC QUEUE */}
        {step === "active-session" && activeRoom && (
          <div className="space-y-6">
            
            {/* 3A: WAITING TERMINALS FOR NO ACTIVITY */}
            {!activeRoom.activeActivity && (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto shrink-0 relative">
                  <Rocket size={24} className="text-slate-400 animate-pulse" />
                  <Clock size={14} className="absolute -bottom-1 -right-1 text-slate-500 bg-white rounded-full p-0.5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-800">Flight Dock Terminal</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    You've integrated successfully as <span className="font-semibold text-indigo-600 font-mono">{studentName}</span>. Please rest on this channel. Once the teacher launches a Quiz, Space Race, or Quick Question, it will trigger live instantly.
                  </p>
                </div>
                
                {studentRecord && Object.keys(studentRecord.answers || {}).length > 0 && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-4 mt-6">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if(emailAddress) setEmailSent(true);
                      }}
                      className="text-left"
                    >
                      {!emailSent ? (
                        <div className="space-y-3">
                          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 w-full">
                            <Mail size={12} /> Email previous activity report
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="email"
                              placeholder="student@example.com"
                              value={emailAddress}
                              onChange={(e) => setEmailAddress(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                            <button
                              type="submit"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                            >
                              <Send size={12} /> Send Report
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg flex justify-center items-center gap-1.5 border border-emerald-100">
                          <CheckCircle size={14} /> Score report generated and sent!
                        </div>
                      )}
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* 3B: MULTIPART STANDARDIZED QUIZ ENGINE */}
            {activeRoom.activeActivity === "quiz" && activeQuizQuestions.length > 0 && (
              <div className="space-y-6">
                {(() => {
                  const isTeacherPaced = activeRoom.pacing === "teacher-paced";
                  const currentQIdx = isTeacherPaced ? activeRoom.activeQuestionIndex : localQuestionIndex;
                  const totalQuestions = activeQuizQuestions.length;

                  // If student finished self-paced quiz
                  if (!isTeacherPaced && currentQIdx >= totalQuestions) {
                    return (
                      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle size={32} />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-semibold text-slate-800">Quiz Completed!</h3>
                          <p className="text-xs text-slate-400 mt-1">Excellent job submitting your answers. Results are synced live with the teacher dashboard.</p>
                        </div>
                        {studentRecord && (
                          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-4">
                            <div className="flex justify-between items-center text-xs font-mono">
                              <span className="text-slate-400">Total Score:</span>
                              <span className="font-bold text-slate-800">{studentRecord.score} / {totalQuestions}</span>
                            </div>
                            
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if(emailAddress) setEmailSent(true);
                              }}
                              className="pt-4 border-t border-slate-200 text-left"
                            >
                              {!emailSent ? (
                                <div className="space-y-3">
                                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 w-full">
                                    <Mail size={12} /> Email report to student
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="email"
                                      placeholder="student@example.com"
                                      value={emailAddress}
                                      onChange={(e) => setEmailAddress(e.target.value)}
                                      className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                      required
                                    />
                                    <button
                                      type="submit"
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                                    >
                                      <Send size={12} /> Send Report
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg flex justify-center items-center gap-1.5 border border-emerald-100">
                                  <CheckCircle size={14} /> Score report generated and sent!
                                </div>
                              )}
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const activeQuestion = activeQuizQuestions[currentQIdx];
                  const hasAnsweredThisQ = studentRecord?.answers?.[currentQIdx] !== undefined;

                  // Show immediate feedback overlay card if triggered!
                  if (immediateFeedbackData) {
                    return (
                      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-md space-y-6 animate-pulse-once">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                            immediateFeedbackData.correct ? "bg-emerald-500" : "bg-rose-500"
                          }`}>
                            {immediateFeedbackData.correct ? <Check size={18} /> : <X size={18} />}
                          </div>
                          <h3 className={`font-display text-base font-bold ${
                            immediateFeedbackData.correct ? "text-emerald-700" : "text-rose-700"
                          }`}>
                            {immediateFeedbackData.correct ? "Excellent! Correct Answer" : "Incorrect Concept"}
                          </h3>
                        </div>

                        <div className="space-y-4 text-xs">
                          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
                            <p className="text-slate-500 font-mono">Submitted: <span className="text-rose-600 font-bold">{immediateFeedbackData.chosen}</span></p>
                            <p className="text-slate-500 font-mono">Correct Answer: <span className="text-emerald-600 font-bold">{immediateFeedbackData.answer}</span></p>
                          </div>

                          {immediateFeedbackData.explanation && (
                            <div className="bg-amber-50/40 p-4 rounded-xl border border-dashed border-amber-100">
                              <p className="font-mono text-amber-700 font-bold uppercase text-[9px] mb-1">SSlive Insights:</p>
                              <p className="text-slate-600 italic leading-relaxed font-sans">{immediateFeedbackData.explanation}</p>
                            </div>
                          )}

                          {activeRoom?.inquiryModeEnabled !== false && activeRoom?.inquiryAiChallengerEnabled !== false && activeRoom && studentRecord && (
                            <div className="space-y-4 pt-1 border-t border-slate-100/50">
                              <DialecticChallengeCard
                                question={activeQuestion?.text || ""}
                                studentAnswer={immediateFeedbackData.chosen}
                                correctAnswer={immediateFeedbackData.answer}
                                roomId={activeRoom.roomId}
                                participantId={studentRecord.id}
                              />
                            </div>
                          )}
                          {activeRoom?.inquiryModeEnabled !== false && activeRoom?.maieuticDialogueEnabled !== false && activeRoom && studentRecord && !immediateFeedbackData.correct && (
                            <div className="space-y-4 pt-1 border-slate-100/50">
                                <MaieuticDialogueCard
                                  question={activeQuestion?.text || ""}
                                  studentAnswer={immediateFeedbackData.chosen}
                                  correctAnswer={immediateFeedbackData.answer}
                                />
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={handleAcknowledgeFeedback}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-colors"
                        >
                          Continue to Next Question
                        </button>
                      </div>
                    );
                  }

                  // If teacher paced and student has submitted, lock & wait
                  if (isTeacherPaced && hasAnsweredThisQ) {
                    return (
                      <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs text-center space-y-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                          <Clock size={20} />
                        </div>
                        <div>
                          <h3 className="font-display text-sm font-semibold text-slate-800">Answer Received!</h3>
                          <p className="text-xs text-slate-400 mt-2">Waiting for teacher pacing parameters to advance to next question...</p>
                        </div>
                        {/* Did you know? — keeps players engaged during wait */}
                        <div className="mt-4 p-3.5 bg-gradient-to-br from-yellow-50 to-amber-50 border border-amber-200/60 rounded-xl text-left flex items-start gap-2.5">
                          <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Did you know?</p>
                            <p className="text-xs text-amber-900 leading-relaxed">{didYouKnowFact}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Standard Question Answering Card
                  return (
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                      
                      {/* Q header */}
                      <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                        <span>Question {currentQIdx + 1} of {totalQuestions}</span>
                        {!isTeacherPaced && (
                          <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full" style={{ width: `${((currentQIdx) / totalQuestions) * 100}%` }} />
                          </div>
                        )}
                      </div>

                      {/* Question Text */}
                      <p className="text-base text-slate-800 font-medium leading-relaxed font-display" id="question-text-field">
                        {activeQuestion.text}
                      </p>

                      {/* Options */}
                      <div className="space-y-3">
                        {activeQuestion.type === "multiple-choice" && activeQuestion.options.map((option, oIdx) => {
                          const clickTargetOptionLetter = String.fromCharCode(65 + oIdx);
                          return (
                            <button 
                              key={oIdx}
                              onClick={() => handleSubmitAnswer(option)}
                              className="w-full py-4 px-4 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-400 text-left rounded-2xl border border-slate-105 transition-all text-xs font-medium text-slate-705 flex items-center gap-3 leading-snug cursor-pointer"
                              style={{ minHeight: "44px" }}
                            >
                              <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-mono font-bold text-xs shrink-0 group-hover:border-indigo-400">
                                {clickTargetOptionLetter}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}

                        {activeQuestion.type === "poll" && activeQuestion.options.map((option, oIdx) => {
                          const clickTargetOptionLetter = String.fromCharCode(65 + oIdx);
                          return (
                            <button 
                              key={oIdx}
                              onClick={() => handleSubmitAnswer(option)}
                              className="w-full py-4 px-4 bg-rose-50/30 hover:bg-rose-100/50 hover:border-rose-400 text-left rounded-2xl border border-rose-100 transition-all text-xs font-medium text-slate-705 flex items-center gap-3 leading-snug cursor-pointer"
                              style={{ minHeight: "44px" }}
                            >
                              <span className="w-7 h-7 rounded-xl bg-white border border-rose-200 text-rose-500 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                                {clickTargetOptionLetter}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}

                        {activeQuestion.type === "scale" && (
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between px-2">
                              {activeQuestion.options.map((opt) => (
                                <button 
                                  key={opt}
                                  onClick={() => handleSubmitAnswer(opt)}
                                  className="w-12 h-12 rounded-full border-2 border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 hover:border-cyan-400 flex items-center justify-center font-bold text-cyan-700 transition-all active:scale-95 shadow-xs cursor-pointer"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 px-4 font-medium uppercase tracking-wider">
                              <span>Low/Poor</span>
                              <span>High/Excellent</span>
                            </div>
                          </div>
                        )}

                        {activeQuestion.type === "true-false" && ["True", "False"].map((tfVal) => {
                          return (
                            <button 
                              key={tfVal}
                              onClick={() => handleSubmitAnswer(tfVal)}
                              className="w-full py-4 px-5 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-400 text-left rounded-2xl border border-slate-105 transition-all text-sm font-medium text-slate-705 cursor-pointer"
                              style={{ minHeight: "44px" }}
                            >
                              {tfVal}
                            </button>
                          );
                        })}

                        {activeQuestion.type === "short-answer" && (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formInput = (e.currentTarget.elements.namedItem("shortAnsText") as HTMLInputElement).value;
                              if (formInput.trim()) handleSubmitAnswer(formInput.trim());
                            }}
                            className="space-y-4"
                          >
                            <input 
                              type="text"
                              name="shortAnsText"
                              placeholder="Type your exact keyword answer..."
                              className="w-full px-4 py-3 border border-slate-250 rounded-2xl focus:border-indigo-500 focus:outline-hidden text-sm h-11 text-slate-700"
                              required
                              style={{ minHeight: "44px" }}
                            />
                            <button 
                              type="submit"
                              className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                            >
                              Submit Answer
                            </button>
                          </form>
                        )}

                        {/* Word Cloud — single word submission, no right answer */}
                        {activeQuestion.type === "word-cloud" && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = (e.currentTarget.elements.namedItem("wordCloudText") as HTMLInputElement).value;
                              const word = input.trim().split(/\s+/)[0]; // first word only
                              if (word) handleSubmitAnswer(word);
                            }}
                            className="space-y-4"
                          >
                            <div className="bg-violet-50/50 border border-violet-200/60 rounded-xl px-3 py-2 text-[11px] text-violet-700 flex items-center gap-2">
                              <span>☁️</span>
                              <span>Submit one word — duplicates grow larger on the live cloud.</span>
                            </div>
                            <input
                              type="text"
                              name="wordCloudText"
                              placeholder="One word..."
                              maxLength={24}
                              className="w-full px-4 py-3 border border-violet-200 rounded-2xl focus:border-violet-500 focus:outline-hidden text-sm h-11 text-slate-700"
                              required
                              autoComplete="off"
                            />
                            <button
                              type="submit"
                              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl transition-colors"
                            >
                              Add to Cloud
                            </button>
                          </form>
                        )}

                        {/* Puzzle / Order — re-order with Up/Down buttons */}
                        {activeQuestion.type === "puzzle-order" && (() => {
                          // Local state for ordering is encoded as an inline component
                          return <PuzzleOrderInput question={activeQuestion} onSubmit={handleSubmitAnswer} />;
                        })()}
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}

            {/* 3C: SPACE RACE ENGINE MODULES */}
            {activeRoom.activeActivity === "space-race" && activeQuizQuestions.length > 0 && (
              <div className="space-y-6">
                {(() => {
                  const currentQIdx = localQuestionIndex;
                  const totalQuestions = activeQuizQuestions.length;

                  // Finished Space Race
                  if (currentQIdx >= totalQuestions) {
                    return (
                      <div className="bg-slate-900 border border-slate-800 text-white p-6 md:p-8 rounded-3xl shadow-lg text-center space-y-4">
                        <div className="w-16 h-16 bg-orange-500/15 border border-orange-500/30 text-orange-400 rounded-full flex items-center justify-center mx-auto">
                          <Rocket size={32} className="animate-bounce" />
                        </div>
                        <div>
                          <h3 className="font-display text-base font-medium text-slate-100">Space Race Finished!</h3>
                          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            Excellent! SSlive rocket for <span className="font-bold text-orange-400">{studentRecord?.team || "Blue Nova"}</span> launched fully to orbits. Monitor the teacher's overhead projection cockpit for victory standings!
                          </p>
                        </div>
                      </div>
                    );
                  }

                  const activeQuestion = activeQuizQuestions[currentQIdx];
                  
                  return (
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                      
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                        <span className="uppercase text-orange-500 font-bold">Space Race Active Flight</span>
                        <span>Orbit Node {currentQIdx + 1}/{totalQuestions}</span>
                      </div>

                      {/* Question text */}
                      <p className="text-base text-slate-800 font-medium leading-relaxed font-display">
                        {activeQuestion.text}
                      </p>

                      {/* Options */}
                      <div className="space-y-3">
                        {activeQuestion.type === "multiple-choice" && activeQuestion.options.map((option, oIdx) => {
                          const clickTargetOptionLetter = String.fromCharCode(65 + oIdx);
                          return (
                            <button 
                              key={oIdx}
                              onClick={() => handleSubmitAnswer(option)}
                              className="w-full py-4 px-4 bg-slate-50 hover:bg-orange-50/50 hover:border-orange-400 text-left rounded-2xl border border-slate-105 transition-all text-xs font-medium text-slate-705 flex items-center gap-3 leading-snug cursor-pointer"
                              style={{ minHeight: "44px" }}
                            >
                              <span className="w-7 h-7 rounded-xl bg-white border border-slate-200 text-slate-500 flex items-center justify-center font-mono font-bold text-xs shrink-0 shrink-0">
                                {clickTargetOptionLetter}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}

                        {activeQuestion.type === "true-false" && ["True", "False"].map((tfVal) => {
                          return (
                            <button 
                              key={tfVal}
                              onClick={() => handleSubmitAnswer(tfVal)}
                              className="w-full py-4 px-5 bg-slate-50 hover:bg-orange-50/50 hover:border-orange-400 text-left rounded-2xl border border-slate-105 transition-all text-sm font-medium text-slate-705 cursor-pointer"
                              style={{ minHeight: "44px" }}
                            >
                              {tfVal}
                            </button>
                          );
                        })}

                        {activeQuestion.type === "short-answer" && (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const formInput = (e.currentTarget.elements.namedItem("spaceAnsText") as HTMLInputElement).value;
                              if (formInput.trim()) handleSubmitAnswer(formInput.trim());
                            }}
                            className="space-y-4"
                          >
                            <input 
                              type="text"
                              name="spaceAnsText"
                              placeholder="Launch keyword exact answer..."
                              className="w-full px-4 py-3 border border-slate-250 rounded-2xl focus:border-orange-400 focus:outline-hidden text-sm h-11 text-slate-700"
                              required
                              style={{ minHeight: "44px" }}
                            />
                            <button 
                              type="submit"
                              className="w-full py-3 bg-orange-500 text-white font-bold text-xs rounded-xl"
                            >
                              Ignite Booster Solves
                            </button>
                          </form>
                        )}
                      </div>

                    </div>
                  );
                })()}
              </div>
            )}

            {/* 3E: LIVE DEBATE ARENA */}
            {activeRoom.activeActivity === "live-debate" && studentRecord && (
              <StudentDebateInterface 
                room={activeRoom}
                studentRecord={studentRecord}
              />
            )}

            {/* 3D: QUICK QUESTION INTERFACES */}
            {activeRoom.activeActivity === "quick-question" && activeRoom.quickQuestion && (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
                
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-mono text-indigo-600 uppercase font-bold tracking-widest bg-indigo-50 px-2 py-0.5 rounded-sm">Quick question payload</span>
                  <h3 className="text-base font-display font-semibold text-slate-800 pt-1">Record Your Quick Response</h3>
                  <p className="text-xs text-slate-400 leading-normal">Submit one direct response to your teacher's verbal query:</p>
                </div>

                {studentRecord && studentRecord.completed ? (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl text-xs flex items-start gap-2 border border-emerald-100">
                      <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Answer successfully submitted!</p>
                        <p className="text-[10px] text-emerald-750/80 mt-1">Your response is safely recorded on the teacher's active dashboard.</p>
                      </div>
                    </div>

                    {activeRoom.inquiryModeEnabled !== false && activeRoom.anonymousPeerForumEnabled !== false && activeRoom.quickQuestion.type === "short-answer" && (
                      <div className="space-y-4 pt-4 border-t border-slate-100 fade-in-up">
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                            🧠 Inquiry Peer Dialogue Arena
                          </h4>
                          <span className="text-[8px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-sm font-bold border border-indigo-100 uppercase tracking-widest leading-none">SSlive Exclusive</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          Read classmates' open-ended arguments anonymously and help cultivate critical thinking by tapping dynamic tags! Rote testing keeps meetings silent; SSlive sparks reasoning.
                        </p>

                        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                          {allParticipants.filter(p => p.answers[0] && p.id !== studentRecord.id).length === 0 ? (
                            <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 space-y-1">
                              <p className="text-xs font-medium">Awaiting classmates' arguments...</p>
                              <p className="text-[9px] text-slate-405">As soon as others submit their thesis, they will appear anonymous here.</p>
                            </div>
                          ) : (
                            allParticipants.filter(p => p.answers[0] && p.id !== studentRecord.id).map((p, pIdx) => {
                              const qIdxStr = "0"; // activeRoom.quickQuestion answer is index 0
                              const pReactions = p.reactions?.[qIdxStr] || { strongPremise: 0, logicLeap: 0, nuanced: 0, voters: [] };
                              const hasVoted = pReactions.voters?.includes(studentRecord.id);

                              return (
                                <div key={p.id || pIdx} className="p-3.5 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-150 text-xs space-y-3 transition-colors">
                                  <div className="font-medium text-slate-800 leading-relaxed italic">
                                    "{p.answers[0]}"
                                  </div>
                                  
                                  <div className="flex gap-1.5 flex-wrap items-center pt-1 animate-fade-in">
                                    <span className="text-[9px] font-mono text-slate-400 font-bold mr-1 uppercase">Stance:</span>
                                    <button 
                                      type="button"
                                      disabled={hasVoted}
                                      className={`text-[9px] py-1 px-2 rounded-lg font-semibold border flex items-center gap-1 transition-all duration-200 ${
                                        hasVoted 
                                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100 cursor-pointer hover:scale-105 active:scale-95"
                                      }`}
                                      onClick={() => handleVoteReaction(p.id, qIdxStr, "strongPremise")}
                                    >
                                      💡 Strong Premise {pReactions.strongPremise ? `(${pReactions.strongPremise})` : ""}
                                    </button>
                                    <button 
                                      type="button"
                                      disabled={hasVoted}
                                      className={`text-[9px] py-1 px-2 rounded-lg font-semibold border flex items-center gap-1 transition-all duration-200 ${
                                        hasVoted 
                                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                          : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-100 cursor-pointer hover:scale-105 active:scale-95"
                                      }`}
                                      onClick={() => handleVoteReaction(p.id, qIdxStr, "logicLeap")}
                                    >
                                      ⚠️ Logic Leap {pReactions.logicLeap ? `(${pReactions.logicLeap})` : ""}
                                    </button>
                                    <button 
                                      type="button"
                                      disabled={hasVoted}
                                      className={`text-[9px] py-1 px-2 rounded-lg font-semibold border flex items-center gap-1 transition-all duration-200 ${
                                        hasVoted 
                                          ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" 
                                          : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-100 cursor-pointer hover:scale-105 active:scale-95"
                                      }`}
                                      onClick={() => handleVoteReaction(p.id, qIdxStr, "nuanced")}
                                    >
                                      💭 Nuanced {pReactions.nuanced ? `(${pReactions.nuanced})` : ""}
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    
                    {/* TYPE: MULTIPLE CHOICE (A-E layout) */}
                    {activeRoom.quickQuestion.type === "multiple-choice" && (
                      <div className="grid grid-cols-1 gap-2.5">
                        {["A", "B", "C", "D", "E"].map((opt) => (
                          <button 
                            key={opt}
                            onClick={() => handleSubmitQuickAnswer(opt)}
                            className="py-3 px-4 bg-slate-50 hover:bg-indigo-50 border border-slate-150 rounded-2xl font-mono font-bold text-xs text-slate-700 transition-all flex items-center gap-3 hover:border-indigo-400 cursor-pointer"
                            style={{ minHeight: "44px" }}
                          >
                            <span className="w-6 h-6 bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center text-xs">
                              {opt}
                            </span>
                            <span>Option {opt}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* TYPE: TRUE FALSE */}
                    {activeRoom.quickQuestion.type === "true-false" && (
                      <div className="flex gap-3">
                        {["True", "False"].map((opt) => (
                          <button 
                            key={opt}
                            onClick={() => handleSubmitQuickAnswer(opt)}
                            className="flex-1 py-4 text-center bg-slate-50 hover:bg-indigo-50 border border-slate-150 rounded-2xl font-semibold text-sm text-slate-700 transition-all cursor-pointer"
                            style={{ minHeight: "44px" }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* TYPE: SHORT ANSWER */}
                    {activeRoom.quickQuestion.type === "short-answer" && (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          const inputVal = (e.currentTarget.elements.namedItem("quickText") as HTMLInputElement).value;
                          if (inputVal.trim()) handleSubmitQuickAnswer(inputVal.trim());
                        }}
                        className="space-y-4"
                      >
                        <input 
                          type="text"
                          name="quickText"
                          placeholder="Type your spontaneous response..."
                          className="w-full px-4 py-3 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:outline-hidden text-sm h-11"
                          required
                          style={{ minHeight: "44px" }}
                        />
                        <button 
                          type="submit"
                          className="w-full py-3 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                        >
                          Send Answer
                        </button>
                      </form>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>
        )}

      </main>

      {/* SSlive Wisdom Footer */}
      <footer className="max-w-md mx-auto w-full pb-4 text-center text-[10px] font-sans text-slate-400 tracking-wide">
        Powered by SSlive | Interactive Meeting Forums
      </footer>

    </div>
  );
}


// ── PuzzleOrderInput — Re-order steps with up/down buttons ───────────────────
function PuzzleOrderInput({ question, onSubmit }: { question: Question; onSubmit: (a: string) => void }) {
  // Shuffle once on mount, then student can reorder via arrows
  const [items, setItems] = React.useState<string[]>(() => {
    const opts = [...question.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  });

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next);
  };

  return (
    <div className="space-y-3">
      <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl px-3 py-2 text-[11px] text-amber-700 flex items-center gap-2">
        <span>🧩</span>
        <span>Re-order the steps. Use the arrows to move items up or down.</span>
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={`${item}-${idx}`} className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl p-2.5 shadow-3xs">
            <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
              {idx + 1}
            </span>
            <span className="flex-1 text-xs text-slate-800 font-medium truncate">{item}</span>
            <button
              type="button"
              onClick={() => move(idx, -1)}
              disabled={idx === 0}
              className="p-1.5 rounded-md hover:bg-amber-50 disabled:opacity-30 transition-colors"
              title="Move up"
            >
              <ArrowLeft size={12} className="rotate-90 text-amber-700" />
            </button>
            <button
              type="button"
              onClick={() => move(idx, 1)}
              disabled={idx === items.length - 1}
              className="p-1.5 rounded-md hover:bg-amber-50 disabled:opacity-30 transition-colors"
              title="Move down"
            >
              <ArrowLeft size={12} className="-rotate-90 text-amber-700" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onSubmit(items.join("|"))}
        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition-colors"
      >
        Submit Order
      </button>
    </div>
  );
}
