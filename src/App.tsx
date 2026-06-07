import React, { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { 
  Rocket, BookOpen, GraduationCap, Compass, Shield, 
  HelpCircle, ChevronRight, LogIn, Sparkles, AlertCircle,
  ArrowRight, Users, BarChart3, Heart, X, Lock, Mail, FileText, CheckCircle2
} from "lucide-react";
import { motion } from "motion/react";

import { auth, googleProvider, signInWithPopup } from "./firebase";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentScreen from "./components/StudentScreen";
import TeacherLoginScreen from "./components/TeacherLoginScreen";
import { Doodles } from "./components/Doodles";

// Reusable branded animated logo
function SSLiveLogo({ size = "md", textColor = "text-slate-950", hideText = false }: { size?: "sm" | "md" | "lg"; textColor?: string; hideText?: boolean }) {
  const containerSize = size === "sm" ? "w-7 h-7" : size === "lg" ? "w-11 h-11" : "w-10 h-10";
  const circleSize = size === "sm" ? "w-[13px] h-[13px]" : size === "lg" ? "w-[21px] h-[21px]" : "w-[17px] h-[17px]";
  const pivotSize = size === "sm" ? "w-[15px] h-[15px]" : size === "lg" ? "w-[23px] h-[23px]" : "w-[19px] h-[19px]";
  const driftX = size === "sm" ? 4 : size === "lg" ? 7 : 5;
  const driftY = size === "sm" ? 3 : size === "lg" ? 6 : 4;
  const textClass = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className={`flex items-center ${hideText ? 'gap-0' : 'gap-2.5'} shrink-0 select-none hover:opacity-95 transition-opacity`}>
      <div className={`relative ${containerSize} flex items-center justify-center overflow-visible`}>
        {/* Circle 1: Drifts Top-Left */}
        <motion.div 
          className={`absolute ${circleSize} rounded-full bg-[#fbbf24] opacity-90 shadow-[0_1.5px_4px_rgba(251,191,36,0.3)]`}
          animate={{ 
            x: [0, -driftX, -driftX, 0], 
            y: [0, -driftY, -driftY, 0], 
            scale: [1, 1.05, 1.05, 1]
          }}
          transition={{ 
            duration: 3.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            times: [0, 0.35, 0.65, 1]
          }}
        />

        {/* Circle 2: Drifts Top-Right */}
        <motion.div 
          className={`absolute ${circleSize} rounded-full bg-[#10b981] opacity-90 shadow-[0_1.5px_4px_rgba(16,185,129,0.3)]`}
          animate={{ 
            x: [0, driftX, driftX, 0], 
            y: [0, -driftY, -driftY, 0],
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

        {/* Circle 3: Blue Pivot Circle */}
        <motion.div 
          className={`absolute ${pivotSize} rounded-full bg-[#4648d4] opacity-95 shadow-[0_2px_6px_rgba(70,72,212,0.4)]`}
          animate={{ 
            y: [0, driftY, driftY, 0],
            scale: [1, 0.95, 0.95, 1]
          }}
          transition={{ 
            duration: 3.5, 
            repeat: Infinity, 
            ease: "easeInOut",
            times: [0, 0.30, 0.70, 1],
            delay: 0.05
          }}
        />
      </div>
      {!hideText && (
        <span className={`font-display font-black tracking-tight uppercase ${textClass} ${textColor}`}>
          SS<span className="text-secondary">live</span>
        </span>
      )}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState("");

  // Role routing: "landing" | "teacher" | "student" | "login"
  const [portalMode, setPortalMode] = useState<"landing" | "teacher" | "student" | "login">("landing");
  
  // Dynamic live forums count simulation
  const [liveForumsCount, setLiveForumsCount] = useState(1420);

  useEffect(() => {
    const interval = setInterval(() => {
      // Trend slowly upward to simulate real-time activity
      setLiveForumsCount(prev => prev + (Math.random() > 0.4 ? 1 : 0));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Content Modals States
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  
  // States for student joining from landing page
  const [landingRoomInput, setLandingRoomInput] = useState("");
  const [studentInitialRoom, setStudentInitialRoom] = useState("");
  // Wave 7 — skill.sch deep link
  const [skillSchTopic, setSkillSchTopic] = useState<{ topic: string; course?: string } | null>(null);

  // Simulator States to drive interactive playground
  const [simTab, setSimTab] = useState<"quiz" | "spacerace" | "poll">("quiz");
  
  // Real-time Poll simulation state
  const [simQuizVotes, setSimQuizVotes] = useState({ A: 12, B: 3, C: 6, D: 1 });
  const [simQuizUserSelection, setSimQuizUserSelection] = useState<string | null>(null);

  // Space Race simulation progression
  const [simRaceProgress, setSimRaceProgress] = useState({ Red: 55, Blue: 40, Orange: 75 });
  const [hasBoosted, setHasBoosted] = useState(false);

  // Pulse Poll responses
  const [simPollVotes, setSimPollVotes] = useState({ yes: 28, total: 32 });
  const [simPollUserSelection, setSimPollUserSelection] = useState<boolean | null>(null);

  // SSlive Cockpit Cover Simulated States
  const [propCount, setPropCount] = useState(58);
  const [oppCount, setOppCount] = useState(42);
  const [catalystInjected, setCatalystInjected] = useState(false);
  const [customCommentText, setCustomCommentText] = useState("");
  const [hasVotedProp, setHasVotedProp] = useState(false);
  const [hasVotedOpp, setHasVotedOpp] = useState(false);

  // Real Dynamic Student Participants State
  interface Participant {
    id: string;
    name: string;
    img?: string;
    iconText?: string;
    color?: string;
    activity: "Proposing" | "Typing..." | "Submitted" | "Reflecting" | "Listening";
    contributionsCount: number;
    score: number;
    team: "Red Nova" | "Blue Nebula" | "Orange Pulsar";
    debateContent?: string;
  }

  const [participants, setParticipants] = useState<Participant[]>([
    { 
      id: "felix", 
      name: "Felix Arvid", 
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdYbXuvGqbvH_0PS5Y2dEnCgykh5cniYChzlCalGmORlkXMJXCPlglu61AErnyrOwMrhYCuBupKoRArmg2HKBROubZvftXnSFW2X2Ij-XcbRYOBrESlDU8NFWZxRwNo5cFJDf-a49sCEXVez73_36_sBtq7596LmBrtsPm98SURHyKzUQTl6QcnjVG5ZoTHOrQf3gWywl7mYbY132dpYQ5pSnTzE7Ipy-uGzsiz7goCKnb1wIfsQKODil5x6-6nfHFSwTOEV6xv2c", 
      activity: "Proposing",
      contributionsCount: 3,
      score: 85,
      team: "Red Nova",
      debateContent: "Platform designs that maximize engagement as a proxy for truth strip the user of genuine cognitive agency."
    },
    { 
      id: "jane", 
      name: "Jane Doe", 
      iconText: "JD", 
      color: "from-indigo-500 to-purple-500", 
      activity: "Typing...",
      contributionsCount: 1,
      score: 45,
      team: "Blue Nebula",
      debateContent: "Design isn't fully deterministic. Interface affordances aren't laws of physics; users can practice conscious digital restraint."
    },
    { 
      id: "marcus", 
      name: "Marcus Smith", 
      iconText: "MS", 
      color: "from-emerald-500 to-teal-500", 
      activity: "Submitted",
      contributionsCount: 4,
      score: 110,
      team: "Orange Pulsar",
      debateContent: "If platforms optimize metrics for continuous outrage, then moral polarization is an active business design, not an accident."
    },
    { 
      id: "elena", 
      name: "Elena Rossi", 
      img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp68UxTNRrTrGId8B-tgbEFy2C7VgQW4Wsz6aXHHnvqbM4VH8aYoZMKGw8E7tPawjkKUPoLbEViDjBUh23h3Pb0a2fqNZhSYRV4PRuMllznwBNWzVYdIilxAkYMJpn0Cmz-VncpNeQhyT9ElUXfpQqRTio4kAqggXvBmHAH_JN6THSA4oVe_D5dQtmd7bHEVnQe-OYidW56h3dVTtEjC26crRWQPkqj_SmUOhxLosSTx97ZEMrzV5u3cI8rylSQFq1t8ciuFuZAIk", 
      activity: "Reflecting",
      contributionsCount: 2,
      score: 70,
      team: "Orange Pulsar",
      debateContent: "We need structured, real-time diagnostic platforms (like SSlive) to counter the echo chambers of generic passive timelines."
    }
  ]);

  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [newStudentName, setNewStudentName] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // SSlive AI Assistant States
  const [aiTopic, setAiTopic] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratedQuiz, setAiGeneratedQuiz] = useState<{
    title: string;
    questions: Array<{
      text: string;
      type: string;
      options: string[];
      correctAnswer: string;
      correctOptionIndex: number;
      explanation: string;
    }>;
  } | null>(null);
  const [aiSelectedAnswers, setAiSelectedAnswers] = useState<Record<number, number>>({});
  const [aiErrorMessage, setAiErrorMessage] = useState("");

  interface FeedItem {
    id: number;
    author: string;
    avatar: string;
    content: string;
    time: string;
    likes: number;
    isQuote?: boolean;
    tags: string[];
    challenged?: boolean;
    hasLiked?: boolean;
  }

  const [feed, setFeed] = useState<FeedItem[]>([
    {
      id: 1,
      author: "Felix Arvid",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdYbXuvGqbvH_0PS5Y2dEnCgykh5cniYChzlCalGmORlkXMJXCPlglu61AErnyrOwMrhYCuBupKoRArmg2HKBROubZvftXnSFW2X2Ij-XcbRYOBrESlDU8NFWZxRwNo5cFJDf-a49sCEXVez73_36_sBtq7596LmBrtsPm98SURHyKzUQTl6QcnjVG5ZoTHOrQf3gWywl7mYbY132dpYQ5pSnTzE7Ipy-uGzsiz7goCKnb1wIfsQKODil5x6-6nfHFSwTOEV6xv2c",
      content: `"If the platform architect defines the 'Good' as high engagement, does the user not inevitably prioritize shock over truth?"`,
      time: "2 mins ago",
      likes: 12,
      isQuote: true,
      tags: ["#PlatformAffordance", "#DigitalEthics"],
      challenged: false
    },
    {
      id: 2,
      author: "Elena Rossi",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp68UxTNRrTrGId8B-tgbEFy2C7VgQW4Wsz6aXHHnvqbM4VH8aYoZMKGw8E7tPawjkKUPoLbEViDjBUh23h3Pb0a2fqNZhSYRV4PRuMllznwBNWzVYdIilxAkYMJpn0Cmz-VncpNeQhyT9ElUXfpQqRTio4kAqggXvBmHAH_JN6THSA4oVe_D5dQtmd7bHEVnQe-OYidW56h3dVTtEjC26crRWQPkqj_SmUOhxLosSTx97ZEMrzV5u3cI8rylSQFq1t8ciuFuZAIk",
      content: "Felix, you assume morality is passive. Could we not argue that digital architecture simply reveals existing moral fractures rather than creating them?",
      time: "Just now",
      likes: 5,
      isQuote: false,
      tags: ["#RevealTheory", "#HumanAgency"],
      challenged: false
    }
  ]);

  const handleSSliveVote = (type: "prop" | "opp") => {
    if (type === "prop") {
      if (hasVotedProp) return;
      setPropCount(prev => prev + 1);
      setHasVotedProp(true);
      if (hasVotedOpp) {
        setOppCount(prev => Math.max(0, prev - 1));
        setHasVotedOpp(false);
      }
    } else {
      if (hasVotedOpp) return;
      setOppCount(prev => prev + 1);
      setHasVotedOpp(true);
      if (hasVotedProp) {
        setPropCount(prev => Math.max(0, prev - 1));
        setHasVotedProp(false);
      }
    }
  };

  const handleInjectAIChallenge = () => {
    if (catalystInjected) return;
    setFeed(prev => [
      {
        id: 99,
        author: "SSlive AI",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdYbXuvGqbvH_0PS5Y2dEnCgykh5cniYChzlCalGmORlkXMJXCPlglu61AErnyrOwMrhYCuBupKoRArmg2HKBROubZvftXnSFW2X2Ij-XcbRYOBrESlDU8NFWZxRwNo5cFJDf-a49sCEXVez73_36_sBtq7596LmBrtsPm98SURHyKzUQTl6QcnjVG5ZoTHOrQf3gWywl7mYbY132dpYQ5pSnTzE7Ipy-uGzsiz7goCKnb1wIfsQKODil5x6-6nfHFSwTOEV6xv2c",
        content: `"Consider the 'invisible' architect. If the algorithm is opaque, can the user ever be morally responsible for the choices it facilitates?"`,
        time: "Just now",
        likes: 18,
        isQuote: true,
        tags: ["#AI_Catalyst", "#OpaqueAlgorithms"],
        challenged: false
      },
      ...prev
    ]);
    setCatalystInjected(true);
  };

  const handleLikeItem = (id: number) => {
    setFeed(prev => prev.map(item => {
      if (item.id === id) {
        const hasLiked = item.hasLiked;
        return {
          ...item,
          likes: hasLiked ? item.likes - 1 : item.likes + 1,
          hasLiked: !hasLiked
        };
      }
      return item;
    }));
  };

  const handleChallengeItem = (id: number) => {
    setFeed(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          challenged: !item.challenged
        };
      }
      return item;
    }));
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommentText.trim()) return;
    setFeed(prev => [
      ...prev,
      {
        id: Date.now(),
        author: "Anonymous Sage",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA7xB6bethuIxfVQ5XwuOrKPbThOOcvr502smUS4y-q8tCHuVY8_-BwbkHel_ZIZobDQQusZ-f0PGyQc8QEevwY0TUjzWuLjuNjcbhGs3o0jlGy4UC-_ixGFhxyh33ehybKqnMD6fzhtwp8Q-60Y70k96xgYVLlSeVtBzuKixiWUnZbKutWXVbCj8sHQcZ9oKZ_QFUe5FAx-iaoPK_ictGvvjS6Su8AQqVSdIOhU3xiOSFkLa0gh2E9u_sWsE3cCKjYWfNqDuGD4QY",
        content: customCommentText.trim(),
        time: "Just now",
        likes: 1,
        tags: ["#MyContribution", "#MoralDialectic"],
        challenged: false
      }
    ]);
    setCustomCommentText("");
  };

  const handleGenerateAIQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setAiGenerating(true);
    setAiErrorMessage("");
    setAiGeneratedQuiz(null);
    setAiSelectedAnswers({});
    try {
      const response = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: aiTopic.trim(),
          gradeLevel: "Undergraduate",
          questionCount: 3,
          quizType: "Inquiry Discussion Path"
        })
      });
      if (!response.ok) {
        // Fallback gracefully so the app remains 100% functional even if the AI key is not configured locally
        const fallbackQuizzes: Record<string, any> = {
          "ethics": {
            title: "Ethics of Algorithmic Moderation",
            questions: [
              {
                text: "Is an opaque algorithm that maximizes click-through rates morally responsible for high outrage?",
                type: "multiple-choice",
                options: [
                  "Yes, because outrage is explicitly coded into its optimization objectives.",
                  "No, it simply mirrors user actions without intent.",
                  "Partially, but only if the developers explicitly meant to hurt society.",
                  "Opaque algorithms cannot possess or be assigned agency or responsibility."
                ],
                correctOptionIndex: 0,
                explanation: "SSlive Insights: Correct! When we optimize purely for continuous engagement metrics, outrage is treated as high-priority signal. This designs polarization directly into the core space feedback loop."
              },
              {
                text: "True or False: Design affordances shape human digital restraint just as physics determines physical coordinates.",
                type: "true-false",
                options: ["True", "False"],
                correctOptionIndex: 1,
                explanation: "SSlive Insights: Spot on! Design affordances dictate patterns of friction, but they are not laws of physics. Users have conscious agency, although platforms can significantly drain their focus reserve."
              }
            ]
          },
          "democracy": {
            title: "Athenian Political SSlive",
            questions: [
              {
                text: "Which core principle of classical Athenian democracy prioritized direct community dialogue over representative voting?",
                type: "multiple-choice",
                options: [
                  "Isegoria (Equal right to speak publicly)",
                  "Ostracism (Exile of dominant politicians)",
                  "Kleroterion (Random lottery machine selection)",
                  "Demarch (Local municipal leadership)"
                ],
                correctOptionIndex: 0,
                explanation: "SSlive Insights: Excellent! Isegoria was the equal right to present arguments to the assembly directly, defining dialogue as the absolute bedrock of consensus."
              }
            ]
          }
        };

        const lowerTopic = aiTopic.toLowerCase();
        let fallbackKey = "ethics";
        if (lowerTopic.includes("demo") || lowerTopic.includes("gree") || lowerTopic.includes("history") || lowerTopic.includes("politics") || lowerTopic.includes("athen")) {
          fallbackKey = "democracy";
        }
        
        const quizData = fallbackQuizzes[fallbackKey] || {
          title: `SSlive Dialectics: "${aiTopic.trim()}"`,
          questions: [
            {
              text: `How do classical inquiry frameworks best resolve modern disagreements regarding "${aiTopic.trim()}"?`,
              type: "multiple-choice",
              options: [
                "Through persistent, structured dialogue and transparent inquiry platforms.",
                "Through passive passive filter feeds that isolate groups.",
                "By avoiding debate altogether and letting metrics dictate actions.",
                "By relying purely on traditional lecture models."
              ],
              correctOptionIndex: 0,
              explanation: `SSlive Insights: Correct! To address "${aiTopic.trim()}" effectively, educators recommend active dialogue and structured response synthesis rather than generic timelines.`
            }
          ]
        };

        await new Promise((resolve) => setTimeout(resolve, 800));
        setAiGeneratedQuiz(quizData);
        return;
      }
      const data = await response.json();
      if (!data || !data.questions) {
        throw new Error("Invalid response received from the ai integration.");
      }
      setAiGeneratedQuiz(data);
    } catch (err: any) {
      console.error(err);
      setAiErrorMessage(err.message || "An unexpected error occurred while communicating with our ai integration.");
    } finally {
      setAiGenerating(false);
    }
  };

  useEffect(() => {
    // Check if the student joined via direct room link (e.g. ?room=MATH15)
    const params = new URLSearchParams(window.location.search);
    if (params.has("room") || params.has("r")) {
      const directCode = params.get("room") || params.get("r") || "";
      setStudentInitialRoom(directCode);
      setPortalMode("student");
    }

    // Wave 7 — skill.sch sent a topic to quiz on
    if (params.get("from") === "skillsch" && params.has("topic")) {
      const topic = params.get("topic") || "";
      const course = params.get("course") || undefined;
      setSkillSchTopic({ topic, course });
      // Persist for teacher mode so the AI generator can auto-fill
      try {
        sessionStorage.setItem("sslive_skillsch_topic", JSON.stringify({ topic, course }));
      } catch {}
    }
    
    // Check for Paystack payment success callback
    if (params.has("payment_success")) {
      localStorage.setItem("sslive-pro-licensed", "true");
      alert("Success! Payment verified. Your SSlive PRO account is now fully active.");
      const url = new URL(window.location.href);
      url.searchParams.delete("payment_success");
      window.history.replaceState({}, '', url);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      const searchParams = new URLSearchParams(window.location.search);
      const isRoomInvite = searchParams.has("room") || searchParams.has("r");
      
      if (user && !isRoomInvite) {
        setPortalMode("teacher");
      }
      setAuthChecking(false);
    });

    return unsubscribe;
  }, []);

  const handleTeacherLogin = async () => {
    setAuthError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes("cancelled-by-user") || err.code?.includes("cancelled-by-user")) {
        // User closed popup
        return;
      }
      setAuthError("Failed to authenticate with Google. Ensure popups are allowed.");
    }
  };

  const handleLandingStudentJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!landingRoomInput.trim()) return;
    setStudentInitialRoom(landingRoomInput.toUpperCase());
    setPortalMode("student");
  };

  const handleCastSimQuiz = (option: "A" | "B" | "C" | "D") => {
    if (simQuizUserSelection) return; // Only allow one vote in mock
    setSimQuizUserSelection(option);
    setSimQuizVotes(prev => ({
      ...prev,
      [option]: prev[option] + 1
    }));
  };

  const handleBoostRace = () => {
    const boostAmounts = {
      Red: Math.min(100, simRaceProgress.Red + Math.floor(Math.random() * 15) + 10),
      Blue: Math.min(100, simRaceProgress.Blue + Math.floor(Math.random() * 20) + 10),
      Orange: Math.min(100, simRaceProgress.Orange + Math.floor(Math.random() * 12) + 5),
    };
    setSimRaceProgress(boostAmounts);
    setHasBoosted(true);
  };

  const handleResetRace = () => {
    setSimRaceProgress({ Red: 35, Blue: 45, Orange: 55 });
    setHasBoosted(false);
  };

  const handleCastSimPoll = (val: boolean) => {
    if (simPollUserSelection !== null) return;
    setSimPollUserSelection(val);
    if (val) {
      setSimPollVotes(prev => ({ yes: prev.yes + 1, total: prev.total + 1 }));
    } else {
      setSimPollVotes(prev => ({ ...prev, total: prev.total + 1 }));
    }
  };

  if (authChecking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs text-slate-500 font-mono tracking-wider">Loading meeting portal...</p>
      </div>
    );
  }

  // Route to student dashboard screen
  if (portalMode === "student") {
    return (
      <StudentScreen 
        initialRoomCode={studentInitialRoom} 
        onExit={() => setPortalMode("landing")} 
      />
    );
  }

  // Route to teacher dashboard once validated with Google Account auth
  if (portalMode === "teacher" && currentUser) {
    return (
      <TeacherDashboard 
        teacherUid={currentUser.uid} 
        teacherEmail={currentUser.email} 
      />
    );
  }

  // Route to custom teacher sign in page
  if (portalMode === "login") {
    return (
      <TeacherLoginScreen 
        onBackToHome={() => setPortalMode("landing")}
        onLoginSuccess={(simUser) => {
          setCurrentUser(simUser);
          setPortalMode("teacher");
        }}
        onGoogleLogin={handleTeacherLogin}
        authError={authError}
        setAuthError={setAuthError}
      />
    );
  }

  // Detailed totals for reactive progress bars
  const totalQuizVotes = simQuizVotes.A + simQuizVotes.B + simQuizVotes.C + simQuizVotes.D;
  const quizPercent = (opt: "A" | "B" | "C" | "D") => Math.round((simQuizVotes[opt] / totalQuizVotes) * 100);

  const pollYesPercent = Math.round((simPollVotes.yes / simPollVotes.total) * 100);
  const pollNoPercent = 100 - pollYesPercent;

  return (
    <div className="bg-surface-bright text-on-surface font-sans min-h-screen dot-grid flex flex-col justify-between overflow-x-hidden">
      
      {/* TopNavBar */}
      <nav className="w-full top-0 sticky z-50 bg-white/60 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-6 sm:px-12 py-3">
          <div className="flex items-center gap-8">
            <div className="cursor-pointer" onClick={() => setPortalMode("landing")}>
              <SSLiveLogo size="sm" />
            </div>
            <div className="hidden md:flex gap-6 text-sm font-medium">
              <a className="text-secondary font-semibold hover:text-black transition-colors" href="#" onClick={(e) => { e.preventDefault(); setPortalMode("landing"); }}>Home</a>
              <a className="text-on-surface-variant hover:text-black transition-colors cursor-pointer" onClick={() => setPortalMode("student")}>Student Entrance</a>
              <a className="text-on-surface-variant hover:text-black transition-colors cursor-pointer" onClick={() => setPortalMode("login")}>Educator Console</a>
              <a className="text-on-surface-variant hover:text-black transition-colors cursor-pointer" onClick={() => setShowGuideModal(true)}>Educator Guide</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant hidden sm:block">
              {Intl.NumberFormat('en-US').format(liveForumsCount)} FORUMS LIVE TODAY
            </span>
            <button 
              onClick={() => setPortalMode("login")}
              className="px-5 py-2 bg-primary text-white hover:bg-neutral-800 rounded-lg text-xs font-bold transition-transform active:scale-95 duration-150 cursor-pointer shadow-sm"
            >
              Educator Login
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {/* Hero & Join Forum Section */}
        <section className="relative max-w-7xl mx-auto px-6 sm:px-12 pt-20 pb-20 overflow-visible">
          <Doodles />
          {/* Ambient Modern Lights */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-[1000px] h-[450px] bg-gradient-to-b from-indigo-100/30 to-transparent blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-blue-150/10 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="absolute top-1/4 right-10 w-72 h-72 bg-purple-150/10 rounded-full blur-3xl pointer-events-none -z-10" />
          
          {/* Removed Animated Ambient Particles/Cursors */}

          <div className="text-center mb-16 relative z-10">
            {/* Elegant Modern Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 hover:bg-white backdrop-blur-md shadow-[0_2px_18px_rgba(70,72,212,0.06)] border border-indigo-100/80 px-3.5 py-1.5 rounded-full mb-6 transition-all duration-300 hover:scale-[1.02]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
              </span>
              <span className="text-[10px] font-bold text-slate-700 tracking-widest uppercase flex items-center gap-1.5 font-mono">
                <Sparkles size={11} className="text-secondary shrink-0" />
                Re-Imagining Audience Synergy
              </span>
            </div>
            
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl tracking-tight text-slate-900 leading-[1.12] mb-6">
              Master the Meeting <br />
              <motion.span 
                animate={{ color: ["#fbbf24", "#10b981", "#4648d4", "#fbbf24"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="sm:whitespace-nowrap"
              >
                with Quizzes and Polls
              </motion.span>
            </h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-base md:text-[17px] text-slate-500 mb-10 leading-relaxed font-normal">
              SSlive fuses conversational dialectical reasoning and AI-powered diagnostic quiz rails to turn dry meetings into responsive arenas of live debate, interactive review, and active learning.
            </p>

            {/* Wave 7 — skill.sch course quiz invite banner */}
            {skillSchTopic && (
              <div className="max-w-md mx-auto mb-5">
                <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50/60 to-rose-50/40 p-5 shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500" />
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-100/80 text-amber-700 border border-amber-200 font-mono font-bold text-[10px] px-2.5 py-1 rounded-full tracking-wider uppercase">
                      🎯 From SKILL.SCH
                    </span>
                    {skillSchTopic.course && (
                      <span className="text-[10px] font-mono text-slate-500 truncate">{skillSchTopic.course}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-1">Generate a quiz on:</p>
                  <h3 className="text-lg font-display font-black text-slate-900 mb-3 leading-tight">
                    {skillSchTopic.topic}
                  </h3>
                  <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
                    Sign in as a teacher to AI-generate a quiz on this topic, or enter a room code below to join as a student.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (currentUser) {
                          setPortalMode("teacher");
                        } else {
                          setPortalMode("login");
                        }
                      }}
                      className="flex-1 px-3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm"
                    >
                      🚀 Generate Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setSkillSchTopic(null)}
                      className="px-3 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-xl transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="max-w-md mx-auto relative">
              <form 
                onSubmit={handleLandingStudentJoin} 
                className="flex p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.03)] focus-within:border-secondary focus-within:shadow-[0_8px_30px_rgba(70,72,212,0.12)] focus-within:ring-4 focus-within:ring-secondary/5 transition-all duration-300"
              >
                <div className="flex-grow relative flex items-center pl-3">
                  <span className="text-secondary/40 font-mono text-sm font-bold pointer-events-none select-none">#</span>
                  <input 
                    type="text"
                    placeholder="Enter Room Code (e.g. CLASS101)"
                    value={landingRoomInput}
                    onChange={(e) => setLandingRoomInput(e.target.value.toUpperCase())}
                    className="w-full pl-1.5 pr-4 py-3 bg-transparent border-none text-slate-800 placeholder-slate-400 focus:outline-hidden text-sm uppercase tracking-wider font-mono font-bold"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={!landingRoomInput.trim()}
                  className="bg-secondary hover:bg-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 text-white px-7 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0 hover:shadow-sm active:scale-98"
                >
                  Join Stage
                  <ArrowRight size={13} strokeWidth={2.5} />
                </button>
              </form>

              {authError && (
                <div className="mt-4 bg-error-container text-on-error-container p-3.5 rounded-2xl text-xs flex items-start gap-2.5 border border-red-200 text-left">
                  <AlertCircle size={14} className="text-error mt-0.5 shrink-0" />
                  <p className="font-mono">{authError}</p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-5">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white/60 backdrop-blur-sm px-3.5 pl-1.5 py-1.5 rounded-full border border-slate-250/30 shadow-sm">
                  <div className="flex -space-x-1.5 mr-1">
                    <img src="https://i.pravatar.cc/100?img=1" alt="User" className="w-5 h-5 rounded-full border-2 border-white relative z-30" />
                    <img src="https://i.pravatar.cc/100?img=2" alt="User" className="w-5 h-5 rounded-full border-2 border-white relative z-20" />
                    <img src="https://i.pravatar.cc/100?img=3" alt="User" className="w-5 h-5 rounded-full border-2 border-white relative z-10" />
                  </div>
                  <strong className="text-slate-900 font-semibold">45k+</strong> Daily Sessions
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-white/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full border border-slate-250/30 shadow-sm transition-all hover:border-emerald-200">
                  <BookOpen size={13} className="text-emerald-500" />
                  <strong className="text-slate-900 font-semibold">Academic Standard</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Central Simulator Cockpit (The "Hero Object") */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative max-w-5xl mx-auto mt-20 perspective-1000"
          >
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-secondary/20 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-emerald-100/10 to-amber-100/10 rounded-2xl blur-xl pointer-events-none -z-10" />
            
            <motion.div 
              whileHover={{ rotateX: 1, rotateY: -1, scale: 1.01 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="bg-[#0F172A] rounded-2xl overflow-hidden cockpit-glow border-2 border-white/10 shadow-[0_30px_80px_rgba(30,10,60,0.15)] relative transform-gpu"
            >
              
              {/* Console Dashboard Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-white/40 text-[10px] font-mono tracking-widest uppercase">SSlive Console v2.4</span>
                </div>

                {/* Simulated Tab Selector inside Header */}
                <div className="flex bg-white/10 p-1 rounded-xl self-center gap-1">
                  <button 
                    onClick={() => setSimTab("poll")}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      simTab === "poll" ? "bg-white text-slate-900 shadow-xs" : "text-white/60 hover:text-white"
                    }`}
                  >
                    Live Debate
                  </button>
                  <button 
                    onClick={() => setSimTab("quiz")}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      simTab === "quiz" ? "bg-white text-slate-900 shadow-xs" : "text-white/60 hover:text-white"
                    }`}
                  >
                    Pulse Quiz
                  </button>
                  <button 
                    onClick={() => setSimTab("spacerace")}
                    className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                      simTab === "spacerace" ? "bg-white text-slate-900 shadow-xs" : "text-white/60 hover:text-white"
                    }`}
                  >
                    Space Race
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-green-400 font-mono text-[11px] font-bold">
                      LIVE: {simPollVotes.total + 110} STUDENTS
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Console Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                
                {/* Left Sidebar: Live Participants Stream inside Cockpit */}
                <div className="col-span-12 lg:col-span-3 border-r border-white/10 p-4 bg-white/[0.01] flex flex-col justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-white/50 font-mono text-[10px] tracking-wider uppercase font-bold">ACTIVE PARTICIPANTS</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-white/40 font-mono">Click to test</span>
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {participants.map((p) => {
                        const isSelected = selectedPartId === p.id;
                        return (
                          <div 
                            key={p.id} 
                            onClick={() => setSelectedPartId(isSelected ? null : p.id)}
                            className={`flex items-center justify-between p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                              isSelected 
                                ? "bg-white/15 border-white/30 text-white" 
                                : "bg-white/5 border-white/5 hover:border-white/10 hover:bg-white/10 text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {p.img ? (
                                <img 
                                  src={p.img} 
                                  alt={p.name}
                                  referrerPolicy="no-referrer"
                                  className="w-8 h-8 rounded-full border border-white/10 shrink-0" 
                                />
                              ) : (
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${p.color || "from-indigo-500 to-purple-500"} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
                                  {p.iconText || p.name.substring(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="text-white text-xs font-semibold truncate flex items-center justify-between gap-1">
                                  <span className="truncate">{p.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono shrink-0">🏆{p.score}</span>
                                </div>
                                <div className="text-white/40 text-[9px] font-mono flex items-center gap-1 mt-0.5">
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400" />
                                  <span className="truncate">{p.activity}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Participant Stage Control Panel */}
                  {selectedPartId !== null ? (
                    (() => {
                      const activePart = participants.find(p => p.id === selectedPartId);
                      if (!activePart) return null;
                      return (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-3 text-left">
                          <div className="flex justify-between items-center text-[9px] text-white/60 font-mono tracking-wider font-bold">
                            <span className="flex items-center gap-1 text-green-400">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                              SANDBOX CONTROLLER
                            </span>
                            <button 
                              onClick={() => setSelectedPartId(null)}
                              className="text-white/40 hover:text-white cursor-pointer px-1 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                          
                          <div className="border-b border-white/10 pb-2">
                            <p className="text-white font-bold text-xs">{activePart.name}</p>
                            <p className="text-[9px] text-white/40 font-mono mt-0.5">Team: {activePart.team} • Score: {activePart.score}</p>
                          </div>

                          {/* 1. Status Activity Selection */}
                          <div className="space-y-1">
                            <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono font-bold block">Inject State change</label>
                            <div className="grid grid-cols-2 gap-1">
                              {(["Proposing", "Typing...", "Submitted", "Reflecting", "Listening"] as const).map((act) => (
                                <button
                                  key={act}
                                  onClick={() => {
                                    setParticipants(prev => prev.map(p => {
                                      if (p.id === activePart.id) {
                                        return { ...p, activity: act };
                                      }
                                      return p;
                                    }));
                                  }}
                                  className={`px-1 py-1 rounded text-[8px] font-bold text-center truncate cursor-pointer transition-all ${
                                    activePart.activity === act 
                                      ? "bg-secondary text-white border border-secondary" 
                                      : "bg-white/5 text-white/60 border border-white/5 hover:bg-white/10 hover:text-white"
                                  }`}
                                >
                                  {act}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* 2. Topic/Tab Specific Simulated Action */}
                          <div className="space-y-1 pt-1.5 border-t border-white/10">
                            <label className="text-[8px] text-white/40 uppercase tracking-widest font-mono font-bold block">Simulator Action ({simTab.toUpperCase()})</label>
                            
                            {simTab === "poll" && (
                              <button
                                onClick={() => {
                                  // Post comment matching their stance
                                  setFeed(prev => [
                                    {
                                      id: Date.now(),
                                      author: activePart.name,
                                      avatar: activePart.img || "https://lh3.googleusercontent.com/aida-public/AB6AXuA7xB6bethuIxfVQ5XwuOrKPbThOOcvr502smUS4y-q8tCHuVY8_-BwbkHel_ZIZobDQQusZ-f0PGyQc8QEevwY0TUjzWuLjuNjcbhGs3o0jlGy4UC-_ixGFhxyh33ehybKqnMD6fzhtwp8Q-60Y70k96xgYVLlSeVtBzuKixiWUnZbKutWXVbCj8sHQcZ9oKZ_QFUe5FAx-iaoPK_ictGvvjS6Su8AQqVSdIOhU3xiOSFkLa0gh2E9u_sWsE3cCKjYWfNqDuGD4QY",
                                      content: activePart.debateContent || "Completely agree with SSlive dialogue logic!",
                                      time: "Just now",
                                      likes: 1,
                                      tags: ["#SSliveForum", "#SimulatedInput"],
                                      challenged: false
                                    },
                                    ...prev
                                  ]);
                                  // Set activity to Completed and boost score
                                  setParticipants(prev => prev.map(p => {
                                    if (p.id === activePart.id) {
                                      return { 
                                        ...p, 
                                        activity: "Submitted", 
                                        score: p.score + 15,
                                        contributionsCount: p.contributionsCount + 1
                                      };
                                    }
                                    return p;
                                  }));
                                }}
                                className="w-full py-1.5 bg-white text-slate-150 rounded-lg text-[10px] font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-1 cursor-pointer text-slate-900 border border-transparent"
                              >
                                Submit Live Debate Post
                              </button>
                            )}

                            {simTab === "quiz" && (
                              <div className="space-y-1 bg-white/[0.02] p-1.5 rounded border border-white/5">
                                <span className="text-[8px] text-white/50 block font-mono">Cast Option on behalf of {activePart.name.split(" ")[0]}</span>
                                <div className="grid grid-cols-4 gap-1">
                                  {(["A", "B", "C", "D"] as const).map(opt => (
                                    <button
                                      key={opt}
                                      onClick={() => {
                                        // Vote quiz count
                                        setSimQuizVotes(prev => ({ ...prev, [opt]: prev[opt] + 1 }));
                                        // Update scoring and completion status
                                        setParticipants(prev => prev.map(p => {
                                          if (p.id === activePart.id) {
                                            return { ...p, activity: "Submitted", score: p.score + 10 };
                                          }
                                          return p;
                                        }));
                                      }}
                                      className="py-1 bg-white/[0.08] hover:bg-white/20 border border-white/5 rounded font-mono font-bold text-[10px] text-white text-center cursor-pointer transition-colors"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {simTab === "spacerace" && (
                              <button
                                onClick={() => {
                                  // Update simulator race parameters depending on student team
                                  const targetTeam = activePart.team === "Red Nova" ? "Red" : activePart.team === "Blue Nebula" ? "Blue" : "Orange";
                                  setSimRaceProgress(prev => ({
                                    ...prev,
                                    [targetTeam]: Math.min(100, prev[targetTeam] + 12)
                                  }));
                                  setParticipants(prev => prev.map(p => {
                                    if (p.id === activePart.id) {
                                      return { ...p, activity: "Submitted", score: p.score + 20 };
                                    }
                                    return p;
                                  }));
                                }}
                                className="w-full py-1.5 bg-yellow-450 hover:bg-yellow-500 text-slate-900 font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer border border-transparent"
                              >
                                <Rocket size={10} className="rotate-45 shrink-0" />
                                Boost Team {activePart.team.split(" ")[0]} 🚀
                              </button>
                            )}
                          </div>

                          {/* 3. Direct Score Controls */}
                          <div className="flex justify-between items-center pt-2 border-t border-white/10 gap-2">
                            <span className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Score adjustments</span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setParticipants(prev => prev.map(p => {
                                    if (p.id === activePart.id) {
                                      return { ...p, score: Math.max(0, p.score - 5) };
                                    }
                                    return p;
                                  }));
                                }}
                                className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded font-mono font-bold text-[9px] text-white/60 hover:text-white cursor-pointer"
                              >
                                -5
                              </button>
                              <button
                                onClick={() => {
                                  setParticipants(prev => prev.map(p => {
                                    if (p.id === activePart.id) {
                                      return { ...p, score: p.score + 10 };
                                    }
                                    return p;
                                  }));
                                }}
                                className="px-1.5 py-0.5 bg-white/5 hover:bg-white/10 rounded font-mono font-bold text-[9px] text-white/60 hover:text-white cursor-pointer"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="space-y-3">
                      {/* Invite / Register Custom Student */}
                      {!isAddingStudent ? (
                        <button
                          onClick={() => setIsAddingStudent(true)}
                          className="w-full py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white rounded-lg text-[9px] font-bold font-mono tracking-wider uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                        >
                          + Add Active Student Simulator
                        </button>
                      ) : (
                        <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2 text-left">
                          <div className="flex justify-between items-center text-[8px] text-white/40 tracking-wider font-mono font-bold">
                            <span>ADD STUDENT DESIGNER</span>
                            <button onClick={() => setIsAddingStudent(false)} className="text-white/40 hover:text-white font-bold p-0.5 text-xs">✕</button>
                          </div>
                          <input
                            type="text"
                            placeholder="Enter Name (e.g. Linus)"
                            value={newStudentName}
                            onChange={(e) => setNewStudentName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                              }
                            }}
                            className="w-full bg-white/5 border border-white/15 text-white rounded px-2 py-1 text-xs focus:ring-1 focus:ring-secondary focus:outline-hidden placeholder-white/20"
                          />
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                if (!newStudentName.trim()) return;
                                const initials = newStudentName.trim().substring(0, 2).toUpperCase();
                                const colors = ["from-sky-500 to-indigo-500", "from-pink-500 to-rose-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500"];
                                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                                const teams: ("Red Nova" | "Blue Nebula" | "Orange Pulsar")[] = ["Red Nova", "Blue Nebula", "Orange Pulsar"];
                                const randomTeam = teams[Math.floor(Math.random() * teams.length)];
                                const newId = `custom_${Date.now()}`;
                                
                                setParticipants(prev => [
                                  ...prev,
                                  {
                                    id: newId,
                                    name: newStudentName.trim(),
                                    iconText: initials,
                                    color: randomColor,
                                    activity: "Proposing",
                                    contributionsCount: 0,
                                    score: 0,
                                    team: randomTeam,
                                    debateContent: "SSlive inquiry-based systems require proactive student dialogue to realize their true learning benefits!"
                                  }
                                ]);
                                
                                setNewStudentName("");
                                setIsAddingStudent(false);
                                setSelectedPartId(newId);
                              }}
                              className="px-3 py-1 bg-secondary text-white font-bold rounded text-[10px] cursor-pointer"
                            >
                              Add
                            </button>
                            <button
                              onClick={() => setIsAddingStudent(false)}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-white/60 rounded text-[10px] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="pt-3 border-t border-white/10">
                        <button 
                          onClick={() => setPortalMode("student")}
                          className="w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <LogIn size={11} />
                          Enter Student Portal
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Simulator Area */}
                <div className="col-span-12 lg:col-span-9 p-6 sm:p-8 flex flex-col justify-between bg-[#0F172A] relative overflow-hidden">
                  
                  {/* Decorative background grid elements */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
                  </div>

                  <div className="w-full relative z-10 flex-1 flex flex-col justify-between gap-6">
                    
                    {/* SIMULATOR TAB 1: LIVE DEBATE */}
                    {simTab === "poll" && (
                      <div className="space-y-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="text-center mb-5">
                            <span className="px-2.5 py-0.5 bg-secondary/20 text-secondary-fixed-dim text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block font-mono">Live Debate Room</span>
                            <h2 className="text-white font-display font-medium text-lg sm:text-xl leading-relaxed max-w-xl mx-auto">
                              "To what extent does digital architecture shape human morality?"
                            </h2>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {/* Proponents Card */}
                            <button 
                              onClick={() => handleSSliveVote("prop")}
                              className={`p-4 rounded-xl text-left border transition-all duration-300 relative overflow-hidden ${
                                hasVotedProp 
                                  ? "border-secondary bg-secondary/10" 
                                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-secondary/40"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-white text-xs font-semibold">Structure Dictates Norms</span>
                                <span className="text-secondary font-display font-bold text-sm">{propCount}%</span>
                              </div>
                              <p className="text-[10px] text-white/50 leading-relaxed">
                                Social spaces reward immediate moral outrage and feedback loops.
                              </p>
                              {hasVotedProp && (
                                <span className="absolute top-1 right-1 text-[8px] bg-secondary text-white px-1 rounded-sm uppercase font-bold font-mono">Cast</span>
                              )}
                            </button>

                            {/* Opponents Card */}
                            <button 
                              onClick={() => handleSSliveVote("opp")}
                              className={`p-4 rounded-xl text-left border transition-all duration-300 relative overflow-hidden ${
                                hasVotedOpp 
                                  ? "border-amber-500 bg-amber-500/10" 
                                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-amber-500/40"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-white text-xs font-semibold">Human Agency Primacy</span>
                                <span className="text-amber-400 font-display font-bold text-sm">{oppCount}%</span>
                              </div>
                              <p className="text-[10px] text-white/50 leading-relaxed">
                                Pre-existing moral frameworks operate independently of algorithms.
                              </p>
                              {hasVotedOpp && (
                                <span className="absolute top-1 right-1 text-[8px] bg-amber-500 text-white px-1 rounded-sm uppercase font-bold font-mono">Cast</span>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Middle panel showing dialectic activity feed */}
                        <div className="bg-slate-900/65 rounded-xl border border-white/5 p-4 space-y-3.5">
                          <div className="flex justify-between items-center pb-2 border-b border-white/5 text-[10px] text-white/30 font-mono tracking-wider">
                            <span>DIALECTICAL STREAM INSIGHTS</span>
                            <span>{feed.length} SUBMISSIONS</span>
                          </div>
                          
                          <div className="space-y-3 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                            {feed.map((post) => (
                              <div key={post.id} className="flex gap-2.5 text-left text-xs">
                                <img src={post.avatar} referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-white/10 mt-0.5 shrink-0" alt="" />
                                <div className="flex-grow min-w-0 bg-white/[0.04] p-3 rounded-xl border border-white/5">
                                  <div className="flex justify-between text-[10px] text-white/40 mb-1">
                                    <span className="font-bold text-white/80">{post.author}</span>
                                    <span>{post.time}</span>
                                  </div>
                                  <p className="text-white/70 text-[11px] leading-relaxed italic">{post.content}</p>
                                  <div className="mt-2 flex items-center justify-between text-[9px] text-white/40">
                                    <div className="flex gap-3">
                                      <button onClick={() => handleLikeItem(post.id)} className="hover:text-white flex items-center gap-1 cursor-pointer">
                                        <span className="material-symbols-outlined text-[12px]">thumb_up</span> {post.likes}
                                      </button>
                                      <button onClick={() => handleChallengeItem(post.id)} className={`hover:text-white flex items-center gap-1 cursor-pointer ${post.challenged ? "text-red-400" : ""}`}>
                                        <span className="material-symbols-outlined text-[12px]">psychology</span> {post.challenged ? "Challenged" : "Challenge"}
                                      </button>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                      {post.tags.map(t => (
                                        <span key={t} className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] text-white/50">{t}</span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Quick Post Prompt Inside simulated debate */}
                          <form onSubmit={handlePostComment} className="flex gap-1.5 pt-1">
                            <input 
                              type="text"
                              value={customCommentText}
                              onChange={(e) => setCustomCommentText(e.target.value)}
                              placeholder="Add your argument (e.g. Technology acts as cognitive extensions...)"
                              className="flex-1 bg-white/5 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-secondary focus:outline-hidden placeholder-white/30"
                            />
                            <button 
                              type="submit" 
                              disabled={!customCommentText.trim()}
                              className="bg-secondary text-white hover:bg-secondary/90 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-30 flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              Post <span className="material-symbols-outlined text-xs">send</span>
                            </button>
                          </form>
                        </div>

                        {/* Interactive Catalyst AI button under debate */}
                        <div className="flex items-center justify-between gap-4 pt-1 border-t border-white/5">
                          <p className="text-[10px] text-white/40 italic leading-none">
                            💡 Click "Inject Catalyst" to simulate a real-time prompt inject event on teacher boards.
                          </p>
                          <button 
                            type="button"
                            onClick={handleInjectAIChallenge}
                            disabled={catalystInjected}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                              catalystInjected 
                                ? "bg-white/5 text-white/30 border border-white/5 cursor-not-allowed" 
                                : "bg-white text-slate-950 border border-transparent hover:bg-white/90 active:scale-95 duration-100 cursor-pointer"
                            }`}
                          >
                            <Sparkles size={10} />
                            <span>{catalystInjected ? "Catalyst Injected" : "Inject Catalyst"}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* SIMULATOR TAB 2: LIVE QUIZ */}
                    {simTab === "quiz" && (
                      <div className="space-y-4 flex flex-col justify-center h-full">
                        <div className="text-center mb-2">
                          <span className="px-2.5 py-0.5 bg-purple-500/20 text-[#ddb7ff] text-[10px] font-bold uppercase tracking-widest rounded-full mb-2 inline-block font-mono">Pulse Quiz Sandbox</span>
                          <h2 className="text-white font-display font-medium text-lg leading-relaxed max-w-xl mx-auto">
                            "Which cellular respiratory cycle generates the highest ratio of ATP molecules within biological systems?"
                          </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono">
                          {[
                            { key: "A" as const, label: "Glycolysis Pathway" },
                            { key: "B" as const, label: "Krebs / Tricarboxylic Acid Cycle" },
                            { key: "C" as const, label: "Electron Transport Chain" },
                            { key: "D" as const, label: "Lactic Acid Anaerobic Fermentation" },
                          ].map((opt) => {
                            const selected = simQuizUserSelection === opt.key;
                            const hasVoted = simQuizUserSelection !== null;
                            return (
                              <button 
                                key={opt.key}
                                onClick={() => handleCastSimQuiz(opt.key)}
                                disabled={hasVoted}
                                className={`p-3.5 rounded-xl border transition-all text-left text-xs flex flex-col justify-between relative overflow-hidden h-16 group cursor-pointer ${
                                  selected 
                                    ? "border-emerald-500 bg-emerald-500/10 text-white" 
                                    : hasVoted 
                                      ? "border-white/5 bg-white/5 opacity-55 text-white/70" 
                                      : "border-white/10 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10"
                                }`}
                              >
                                {hasVoted && (
                                  <div 
                                    style={{ width: `${quizPercent(opt.key)}%` }}
                                    className={`absolute inset-y-0 left-0 ${selected ? "bg-emerald-500/15" : "bg-white/5"} z-0 transition-all duration-1000`}
                                  />
                                )}

                                <div className="flex justify-between w-full items-center z-10 relative">
                                  <span className={`font-mono font-bold uppercase ${selected ? "text-emerald-400" : "text-white/60"}`}>
                                    {opt.key}. {opt.label}
                                  </span>
                                  {selected && (
                                    <span className="text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-md font-bold font-mono">
                                      COMPLETED
                                    </span>
                                  )}
                                </div>

                                {hasVoted && (
                                  <div className="flex justify-between items-center text-[10px] text-white/40 font-mono mt-1 z-10 relative">
                                    <span>{simQuizVotes[opt.key]} submits</span>
                                    <span className="font-bold text-white/70">{quizPercent(opt.key)}%</span>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {simQuizUserSelection && (
                          <div className="bg-white/5 p-3 rounded-xl border border-white/10 text-white/70 text-[11px] leading-relaxed flex items-start gap-2">
                            <Sparkles size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p>
                              <strong>SSlive Guide Advice:</strong> Great work! The Electron Transport Chain (Option C) produces ~28 to 32 ATP molecules. Our active meeting's current accuracy rate stands at {quizPercent("C")}%!
                            </p>
                          </div>
                        )}

                        {!simQuizUserSelection && (
                          <p className="text-center text-[10px] text-white/30 font-mono italic">
                            💡 Click one of the multiple-choice options above to cast your test vote in real-time.
                          </p>
                        )}
                      </div>
                    )}

                    {/* SIMULATOR TAB 3: SPACE RACE */}
                    {simTab === "spacerace" && (
                      <div className="space-y-4 flex flex-col justify-center h-full">
                        <div className="flex justify-between items-center bg-white/5 px-4 py-2 border border-white/10 rounded-xl">
                          <span className="text-xs font-semibold text-white/50 font-mono">LIVE SPACE RACE TRACKER</span>
                          <div className="flex gap-2">
                            <button 
                              onClick={handleBoostRace}
                              className="px-2.5 py-1 bg-yellow-450 hover:bg-yellow-500 text-slate-900 border border-yellow-300 font-bold rounded-lg text-[10px] transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Rocket size={11} className="rotate-45" /> Boost Speeds
                            </button>
                            {hasBoosted && (
                              <button 
                                onClick={handleResetRace}
                                className="px-2 py-1 text-white/40 hover:text-white rounded-lg text-[10px] transition-colors cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3.5 bg-slate-950/80 p-5 rounded-xl border border-white/5 relative">
                          {[
                            { team: "Red Nova", color: "bg-red-500", text: "text-red-400 font-bold font-mono", amount: simRaceProgress.Red },
                            { team: "Blue Nebula", color: "bg-sky-500", text: "text-sky-400 font-bold font-mono", amount: simRaceProgress.Blue },
                            { team: "Orange Pulsar", color: "bg-amber-500", text: "text-amber-400 font-bold font-mono", amount: simRaceProgress.Orange },
                          ].map((t) => (
                            <div key={t.team} className="space-y-1 text-left">
                              <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className={t.text}>{t.team}</span>
                                <span className="text-white/40">{t.amount}% completed</span>
                              </div>
                              
                              {/* Space Racetrack lane */}
                              <div className="w-full h-8 bg-slate-900 rounded-lg border border-white/5 relative overflow-hidden flex items-center px-1.5">
                                {/* Grid reference lines */}
                                <div className="absolute inset-y-0 left-1/4 w-[1px] bg-white/5" />
                                <div className="absolute inset-y-0 left-2/4 w-[1px] bg-white/5" />
                                <div className="absolute inset-y-0 left-3/4 w-[1px] bg-white/5" />
                                
                                {/* Progress visual trail */}
                                <div 
                                  style={{ width: `${t.amount}%` }}
                                  className={`h-0.5 ${t.color}/20 rounded-full transition-all duration-700 ease-out z-0`}
                                />

                                {/* Flame particle exhaust trail */}
                                {hasBoosted && t.amount < 100 && (
                                  <div 
                                    style={{ left: `calc(${t.amount}% - 40px)` }}
                                    className="absolute w-8 h-1 bg-gradient-to-r from-transparent to-orange-500 opacity-60 blur-xs transition-all duration-700 ease-out animate-pulse"
                                  />
                                )}

                                {/* Floating rocket indicator */}
                                <div 
                                  style={{ left: `calc(${t.amount}% - 22px)` }}
                                  className={`absolute text-white transition-all duration-700 ease-out z-10 flex items-center justify-center p-1 rounded-md ${t.color} shadow-lg`}
                                >
                                  <Rocket size={11} className="rotate-45" />
                                </div>

                                {t.amount >= 100 && (
                                  <div className="absolute right-2 text-[8px] bg-emerald-500 text-white px-2 rounded-md font-bold font-mono py-0.5 z-20">
                                    VICTORY
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-center text-[10px] text-white/30 font-mono">
                          🏆 Divide participants into teams and watch rocket engines fuel up with correct answers.
                        </p>
                      </div>
                    )}

                  </div>

                  <div className="mt-4 flex flex-wrap justify-between items-center px-1 z-10 relative text-[10px] text-white/40 font-mono pt-3 border-t border-white/5">
                    <span>STATUS: ACTIVE PLAYGROUND DEMO</span>
                    <span className="italic">Sandbox updates live automatically</span>
                  </div>
                </div>

              </div>

            </motion.div>
          </motion.div>
        </section>

        {/* Live Engagement Marquee */}
        <div className="w-full bg-slate-900 py-3 relative overflow-hidden flex items-center border-y border-slate-800">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-slate-900 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-900 to-transparent z-10" />
          
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 25, ease: "linear", repeat: Infinity }}
            className="flex flex-nowrap whitespace-nowrap items-center gap-12 font-mono text-xs uppercase tracking-wider text-slate-400 font-bold"
          >
            {[...Array(2)].fill([
              "🚀 45,000+ Daily Space Races",
              "<span class='text-slate-600'>|</span>",
              "🧠 1.2M Questions Answered",
              "<span class='text-slate-600'>|</span>",
              "LIVE NOW: Harvard Business Model Debate",
              "<span class='text-slate-600'>|</span>",
              "⚡️ 220ms Sync Speed",
              "<span class='text-slate-600'>|</span>",
              "🏆 Teacher of the Year Toolkit",
              "<span class='text-slate-600'>|</span>"
            ]).flat().map((item, i) => (
              <span key={i} dangerouslySetInnerHTML={{ __html: item }} />
            ))}
          </motion.div>
        </div>

        {/* SSlive PRO Feature Cards Section */}
        <section className="max-w-7xl mx-auto px-6 sm:px-12 py-20 border-t border-slate-100 bg-white">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block py-1 px-3 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold tracking-widest uppercase font-mono mb-4">SSlive Premium</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-900 mb-5 tracking-tight">
              Upgrade to SSlive <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">PRO</span>
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Unlock advanced student analytics, automated doc-to-quiz generators, and robust whitelisted meeting rooms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative">
            
            {/* Dynamic Documents Question Extraction [PRO] - Big Card */}
            <div className="md:col-span-12 lg:col-span-8 lg:row-span-2 bg-[#FAFAFA] border border-slate-200/50 rounded-[32px] p-8 sm:p-12 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.15)] hover:border-indigo-200/50 flex flex-col">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none transition-transform duration-1000 group-hover:scale-110 translate-x-1/4 -translate-y-1/4" />
              
              {/* Floating Docs Addictive Visual */}
              <div className="absolute right-0 top-0 lg:bottom-0 translate-x-12 translate-y-16 lg:translate-x-4 lg:translate-y-8 flex items-center justify-center pointer-events-none group-hover:translate-x-0 group-hover:-translate-y-4 transition-all duration-700">
                <div className="relative w-[300px] h-[280px] hidden sm:block">
                  {/* Background File Upload Box */}
                  <div className="absolute right-12 bottom-4 w-56 h-64 bg-white/90 rounded-[24px] shadow-xl border border-indigo-100/50 rotate-6 transition-all duration-700 group-hover:rotate-3 group-hover:-translate-y-4 flex flex-col p-5 backdrop-blur-md z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-indigo-400 text-sm">picture_as_pdf</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <div className="w-20 h-2 bg-slate-200 rounded-full" />
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
                      </div>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full mb-3" />
                    <div className="w-3/4 h-3 bg-slate-100 rounded-full mb-3" />
                    <div className="w-5/6 h-3 bg-slate-100 rounded-full mb-3" />
                    <div className="w-full h-3 bg-slate-100 rounded-full mb-4" />
                    <div className="mt-auto border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">Processing...</span>
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-100" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-200" />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-300" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Foreground Extracted Quiz Box */}
                  <div className="absolute right-24 bottom-12 w-64 h-[280px] bg-white rounded-[24px] shadow-2xl border border-indigo-100 -rotate-3 transition-all duration-700 group-hover:-rotate-6 group-hover:-translate-y-8 flex flex-col overflow-hidden z-20">
                    {/* Header */}
                    <div className="bg-indigo-500/5 border-b border-indigo-100/50 p-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-inner shadow-indigo-400/20">
                          <span className="material-symbols-outlined text-white text-[16px]">bolt</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Extracted Quiz</span>
                          <span className="text-[9px] text-emerald-500 font-medium">3 Questions Found</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Q1 */}
                    <div className="p-3 border-b border-slate-50">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold text-indigo-400">Q1.</span>
                        <div className="flex-1 space-y-2 pt-0.5">
                          <div className="w-full h-2.5 bg-slate-200 rounded-full" />
                          <div className="w-2/3 h-2.5 bg-slate-200 rounded-full" />
                          <div className="flex gap-2 mt-2">
                            <span className="flex-1 h-5 bg-emerald-50 border border-emerald-100 rounded flex items-center px-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /></span>
                            <span className="flex-1 h-5 bg-slate-50 border border-slate-100 rounded" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Q2 */}
                    <div className="p-3 border-b border-slate-50">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold text-indigo-400">Q2.</span>
                        <div className="flex-1 flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg p-2">
                           <span className="text-[9px] text-slate-500 font-medium">True / False</span>
                           <span className="w-10 h-4 bg-indigo-100 rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Q3 */}
                    <div className="p-3">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold text-indigo-400">Q3.</span>
                        <div className="flex-1 space-y-1.5">
                          <div className="w-full h-2 bg-slate-200 rounded-full" />
                          <div className="w-1/2 h-2 bg-slate-200 rounded-full" />
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>

              <div className="relative z-10 max-w-sm flex-1 flex flex-col">
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 mb-8"
                >
                  <span className="material-symbols-outlined font-semibold text-2xl text-indigo-600">document_scanner</span>
                </motion.div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="font-display font-medium text-2xl text-slate-900 leading-tight tracking-tight">Dynamic Docs Extraction</h3>
                </div>
                <p className="text-slate-500 text-[15px] leading-relaxed mb-10 font-normal">
                  Drop PDFs, spreadsheets, or raw camera shots is all it takes. SSlive parses the questions instantly into your repository.
                </p>
                <div className="mt-auto flex items-center gap-2 font-mono text-[11px] font-bold tracking-widest uppercase mb-2">
                   <span className="bg-indigo-600 text-white px-2 py-1 rounded-md shadow-xs">PRO</span>
                   <span className="text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">&lt; 2s per page</span>
                </div>
              </div>
            </div>

            {/* Active Handraise Queues - Small Card */}
            <div className="md:col-span-6 lg:col-span-4 bg-white border border-slate-200/50 rounded-[32px] p-8 sm:p-10 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)] hover:border-amber-200 flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-200 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1, y: -5 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                  className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-6 border border-amber-100/50"
                >
                  <span className="material-symbols-outlined font-semibold text-xl text-amber-500">front_hand</span>
                </motion.div>
                <h3 className="font-display font-medium text-[19px] text-slate-900 leading-tight mb-3 tracking-tight">Active Handraise Queues</h3>
                <p className="text-slate-500 text-[14px] leading-relaxed mb-6 font-normal">
                  Empower student interfaces with a single-tap ✋ alert indicator, bringing feedback loops into ultra-high speed.
                </p>
              </div>
              <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] bg-amber-50 border border-amber-100/50 px-3.5 py-2 rounded-xl self-start group-hover:bg-amber-100 transition-colors duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
                <span className="font-mono tracking-widest uppercase">Ultra-High Speed</span>
              </div>
            </div>

            {/* Sealed Room Whitelists - Small Card */}
            <div className="md:col-span-6 lg:col-span-4 bg-white border border-slate-200/50 rounded-[32px] p-8 sm:p-10 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] hover:border-emerald-200 flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-200 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1, rotateY: 180 }}
                  transition={{ duration: 0.4 }}
                  className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100/50"
                >
                  <span className="material-symbols-outlined font-semibold text-xl text-emerald-600">admin_panel_settings</span>
                </motion.div>
                <h3 className="font-display font-medium text-[19px] text-slate-900 leading-tight mb-3 tracking-tight">Sealed Room Rosters</h3>
                <p className="text-slate-500 text-[14px] leading-relaxed mb-6 font-normal">
                  Maintain access filtration effortlessly. Allow only registered student candidates to enter inquiry evaluations.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 font-mono mt-auto">
                {["#SECURE", "#VERIFIED"].map((tag) => (
                  <span key={tag} className="px-2.5 py-1.5 bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-700 font-bold text-[9px] uppercase tracking-wider rounded-lg border border-slate-100 group-hover:border-emerald-200/50 transition-colors duration-300">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Co-pilot for Live Sessions - Wide Card */}
            <div className="md:col-span-12 lg:col-span-7 bg-[#FFF5F7] border border-rose-100/80 rounded-[32px] p-8 sm:p-10 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(244,63,94,0.15)] flex flex-col sm:flex-row gap-8 justify-between">
              <div className="absolute right-0 top-0 w-64 h-64 bg-white/40 blur-3xl rounded-full mix-blend-overlay" />
              <div className="relative z-10 flex-1 flex flex-col justify-center">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 180 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-rose-500 mb-6 shadow-sm border border-rose-100/60"
                >
                  <span className="material-symbols-outlined font-semibold text-2xl text-rose-500">psychology</span>
                </motion.div>
                <h3 className="font-display font-medium text-2xl text-slate-900 leading-tight mb-4 tracking-tight flex items-center gap-3">
                  AI Live Co-pilot 
                  <span className="bg-rose-500 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded shadow-xs">PRO</span>
                </h3>
                <p className="text-slate-600 text-[15px] leading-relaxed max-w-sm mb-6">
                  Real-time AI suggestions for follow-up questions and automated identification of students needing personalized help.
                </p>
                <div className="flex flex-wrap gap-2 font-mono mt-auto">
                   <span className="px-3 py-1.5 bg-white text-rose-600 font-bold text-[9px] uppercase tracking-wider rounded-xl border border-rose-100 shadow-3xs">
                     #SMART-ALERTS
                   </span>
                   <span className="px-3 py-1.5 bg-white text-rose-600 font-bold text-[9px] uppercase tracking-wider rounded-xl border border-rose-100 shadow-3xs">
                     #AI-POWERED
                   </span>
                </div>
              </div>
              
              {/* Decorative Visual */}
              <div className="hidden sm:flex flex-col gap-3 relative z-10 w-48 shrink-0 justify-center">
                 <div className="bg-white/80 backdrop-blur border border-rose-100 p-4 rounded-2xl shadow-sm transform transition-all duration-500 group-hover:-translate-y-2 group-hover:scale-105 group-hover:rotate-2">
                    <div className="flex items-center gap-2 mb-2">
                       <span className="material-symbols-outlined text-[14px] text-amber-500">lightbulb</span>
                       <span className="text-[10px] font-bold text-slate-700 font-mono">AI Suggestion</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full mb-1.5" />
                    <div className="h-1.5 w-3/4 bg-slate-100 rounded-full" />
                 </div>
                 <div className="bg-white/60 backdrop-blur border border-rose-50 p-4 rounded-2xl shadow-3xs transform transition-all duration-500 group-hover:translate-x-4 opacity-70 group-hover:opacity-100">
                    <div className="flex items-center gap-2 mb-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                       <span className="text-[10px] font-bold text-slate-700 font-mono">Alert: Student A</span>
                    </div>
                    <div className="h-1.5 w-5/6 bg-slate-100 rounded-full mb-1.5" />
                 </div>
              </div>
            </div>

            {/* Simultaneous Multi-Room Control */}
            <div className="md:col-span-12 lg:col-span-5 bg-white border border-slate-200/50 rounded-[32px] p-8 sm:p-10 relative overflow-hidden group transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(14,165,233,0.15)] hover:border-sky-200 flex flex-col justify-between">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-300 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div>
                <motion.div 
                  whileHover={{ scale: 1.1, x: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-6 border border-sky-100/50"
                >
                  <span className="material-symbols-outlined font-semibold text-xl text-sky-600">dashboard_customize</span>
                </motion.div>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-display font-medium text-[19px] text-slate-900 leading-tight tracking-tight">Simultaneous Multi-Room</h3>
                </div>
                <p className="text-slate-500 text-[14px] leading-relaxed mb-8">
                  Launch multiple differentiated activities concurrently for breakout groups or staggered pacing.
                </p>
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl border border-sky-200 bg-sky-50/50 flex flex-wrap gap-0.5 p-1.5 transition-transform duration-300 group-hover:-translate-y-1">
                   <div className="w-2 h-2 rounded-sm bg-sky-400" />
                   <div className="w-2 h-2 rounded-sm bg-sky-200" />
                   <div className="w-2 h-2 rounded-sm bg-sky-200" />
                   <div className="w-2 h-2 rounded-sm bg-sky-400" />
                </div>
                <div className="h-8 w-8 rounded-xl border border-indigo-200 bg-indigo-50/50 flex flex-wrap gap-0.5 p-1.5 transition-transform duration-300 group-hover:-translate-y-1 delay-75">
                   <div className="w-2 h-2 rounded-sm bg-indigo-200" />
                   <div className="w-2 h-2 rounded-sm bg-indigo-500" />
                   <div className="w-2 h-2 rounded-sm bg-indigo-500" />
                   <div className="w-2 h-2 rounded-sm bg-indigo-200" />
                </div>
                <div className="h-8 w-8 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-wrap gap-0.5 p-1.5 transition-transform duration-300 group-hover:-translate-y-1 delay-150">
                   <div className="w-full h-2 rounded-sm bg-emerald-400" />
                   <div className="w-full h-2 rounded-sm bg-emerald-200" />
                </div>
              </div>
            </div>

            {/* Historical Analytics & Export - Full Width Base Card */}
            <div className="md:col-span-12 bg-white rounded-[32px] p-8 sm:p-12 relative overflow-hidden group transition-all duration-700 hover:shadow-[0_20px_50px_-10px_rgba(139,92,246,0.1)] flex flex-col sm:flex-row items-center gap-8 lg:gap-16 border border-slate-200/50 hover:border-violet-200">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-50/50 via-fuchsia-50/30 to-transparent opacity-50" />
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-100 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2 pointer-events-none group-hover:bg-violet-200/60 transition-colors duration-1000" />
              
              <div className="relative z-10 max-w-lg flex-1">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                   <motion.div 
                     whileHover={{ scale: 1.1, y: -5 }}
                     transition={{ duration: 0.3 }}
                     className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-600 border border-violet-100 shadow-sm"
                   >
                     <span className="material-symbols-outlined font-semibold text-2xl text-violet-600">analytics</span>
                   </motion.div>
                   
                   <div className="flex gap-2">
                     <span className="bg-violet-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg shadow-xs">PRO FEATURE</span>
                     <span className="bg-white text-violet-600 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-violet-200">#DATA-DRIVEN</span>
                   </div>
                </div>
                
                <h3 className="font-display font-medium text-2xl sm:text-3xl text-slate-900 leading-tight mb-4 tracking-tight">Historical Analytics & Reports</h3>
                <p className="text-slate-500 text-[15px] sm:text-[16px] leading-relaxed mb-8">
                  Detailed progression tracking across multiple terms. Instantly download extensive PDF and CSV assessment reports to chart organizational growth accurately.
                </p>
                
                <div className="flex flex-wrap gap-2.5 font-mono">
                  {["#CSV-EXPORT", "#PDF-REPORTS", "#LONG-TERM"].map((tag) => (
                    <span key={tag} className="px-3 py-1.5 bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider rounded-xl border border-slate-200 transition-colors group-hover:bg-violet-50 group-hover:border-violet-200 group-hover:text-violet-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="relative z-10 sm:w-[350px] w-full shrink-0 h-[280px] hidden sm:block">
                 {/* Main Chart Card */}
                 <div className="absolute inset-x-2 top-0 bottom-12 bg-white rounded-2xl shadow-[0_15px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-200/60 p-5 flex flex-col z-20 group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_-12px_rgba(139,92,246,0.1)] transition-all duration-500">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                             <span className="material-symbols-outlined text-violet-500 text-[18px]">monitoring</span>
                          </div>
                          <div className="space-y-1.5">
                             <div className="w-20 h-2.5 bg-slate-200 rounded-full" />
                             <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
                          </div>
                       </div>
                    </div>
                    {/* Line Chart approximation */}
                    <div className="flex-1 relative flex items-end ml-1">
                       <svg className="w-full h-[60px] overflow-visible" viewBox="0 0 200 60" preserveAspectRatio="none">
                          <defs>
                             <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="rgb(139, 92, 246)" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="rgb(139, 92, 246)" stopOpacity="0" />
                             </linearGradient>
                          </defs>
                          <path d="M0,50 Q20,30 50,40 T100,20 T150,30 T200,10 L200,60 L0,60 Z" fill="url(#chart-grad)" />
                          <path d="M0,50 Q20,30 50,40 T100,20 T150,30 T200,10" fill="none" stroke="rgb(139, 92, 246)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          
                          {/* Data Points */}
                          <circle cx="50" cy="40" r="3.5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="2" />
                          <circle cx="100" cy="20" r="3.5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="2" className="group-hover:r-[5px] transition-all duration-300" />
                          <circle cx="150" cy="30" r="3.5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="2" />
                          <circle cx="200" cy="10" r="3.5" fill="white" stroke="rgb(139, 92, 246)" strokeWidth="2" />
                       </svg>
                    </div>
                 </div>
                 
                 {/* Export Floating UI 1 (CSV) */}
                 <div className="absolute right-0 bottom-6 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-emerald-100 shadow-xl z-30 flex items-center gap-3 transition-all duration-500 group-hover:translate-x-4 group-hover:-translate-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                       <span className="material-symbols-outlined text-[16px]">file_download</span>
                    </div>
                    <div className="flex flex-col gap-1.5 w-24">
                       <div className="w-16 h-2 bg-emerald-100 rounded-full" />
                       <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
                    </div>
                 </div>

                 {/* Export Floating UI 2 (Table) */}
                 <div className="absolute left-8 bottom-0 bg-white/95 backdrop-blur-md rounded-xl p-3 border border-sky-100 shadow-xl z-10 flex items-center gap-3 transition-all duration-500 group-hover:-translate-x-2 group-hover:translate-y-2">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-500">
                       <span className="material-symbols-outlined text-[16px]">table_chart</span>
                    </div>
                    <div className="flex flex-col gap-1.5 w-24">
                       <div className="w-14 h-2 bg-sky-100 rounded-full" />
                       <div className="w-10 h-1.5 bg-slate-100 rounded-full" />
                    </div>
                 </div>
              </div>
            </div>

          </div>
        </section>

        {/* Dynamic Bento Grid Section */}
        <section className="max-w-7xl mx-auto px-6 sm:px-12 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 h-auto">
            
            <div className="md:col-span-7 rounded-[32px] p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden group transition-all duration-500 bg-[#FAFAFA] border border-slate-200/50 hover:border-slate-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl opacity-60 -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform duration-700 group-hover:scale-110" />
              
              <div className="relative z-10 space-y-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="bg-white rounded-[18px] shadow-sm border border-slate-100 flex items-center justify-center px-3.5 py-2 shrink-0">
                    <SSLiveLogo size="sm" />
                  </div>
                  <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full ring-1 ring-indigo-200">
                    <span className="material-symbols-outlined text-[14px]">school</span>
                    EDUCATOR PORTAL
                  </div>
                </div>
                
                <div className="space-y-6 max-w-lg">
                  <h2 className="font-display font-medium text-4xl sm:text-5xl text-slate-900 leading-[1.1] tracking-tight">
                    Bridging the gaps in <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-bold">Digital Education</span>
                  </h2>
                  <p className="text-[15px] sm:text-base text-slate-500 leading-relaxed font-sans max-w-md">
                    Traditional web lectures are entirely passive. SSLive turns every attendee into an active driver of synthesis through real-time feedback gauges, quick question prompts, and gamified debates.
                  </p>
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={handleTeacherLogin}
                    className="group/btn relative inline-flex items-center justify-center bg-slate-900 text-white px-8 py-4 rounded-2xl text-[12px] font-bold tracking-wider uppercase transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/10 active:scale-[0.98] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Meeting Session
                      <svg className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="md:col-span-5 flex flex-col gap-6 md:gap-8">
              
              {/* Card 1: Academic Partners */}
              <div className="relative rounded-[32px] p-8 text-white overflow-hidden group transition-all duration-500 bg-slate-900 hover:shadow-[0_20px_40px_-15px_rgba(15,23,42,0.3)]">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none transition-transform duration-700 group-hover:scale-150" />
                
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm border border-white/10">
                    <span className="material-symbols-outlined text-2xl text-indigo-300">school</span>
                  </div>
                  <h4 className="font-display font-semibold text-xl text-white mb-3 tracking-tight">Academic Partnerships</h4>
                  <p className="text-slate-400 text-[13px] sm:text-sm leading-relaxed max-w-xs font-sans">
                    Redefined collaborative feedback modules trusted globally by academic educators.
                  </p>
                  <div className="mt-8 flex items-center gap-2 text-[10px] tracking-widest font-bold text-slate-500 font-mono uppercase">
                    <span className="h-px w-8 bg-slate-700" />
                    Trusted Academia
                  </div>
                </div>
              </div>

              {/* Card 2: Experimental labs */}
              <div className="flex-grow rounded-[32px] p-8 transition-all duration-500 relative overflow-hidden bg-white border border-slate-200/60 hover:border-emerald-200 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.08)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none opacity-50 transition-opacity duration-500 group-hover:opacity-100" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                      <span className="material-symbols-outlined text-xl text-emerald-600">psychology</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50/50 px-3 py-1.5 rounded-full ring-1 ring-emerald-100/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Innovation Labs
                    </span>
                  </div>
                  
                  <h4 className="font-display font-semibold text-xl text-slate-900 mb-2 tracking-tight">SSlive AI Assistant</h4>
                  <p className="text-slate-500 text-[13px] sm:text-sm leading-relaxed font-sans mb-6">
                    Generate instant discussion questionnaires from any title prompt using our ai integration.
                  </p>

                  <div className="mt-auto">
                    {!aiGeneratedQuiz ? (
                      <form onSubmit={handleGenerateAIQuestions} className="space-y-4 relative z-10">
                        <div className="relative">
                          <input 
                            type="text"
                            required
                            placeholder="Enter topic (e.g., Athenian Ethics)"
                            value={aiTopic}
                            onChange={(e) => setAiTopic(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl px-5 py-4 text-[13px] focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 focus:outline-hidden placeholder-slate-400 font-medium transition-all"
                          />
                        </div>
                        {aiErrorMessage && (
                          <p className="text-[11px] text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">
                            {aiErrorMessage}
                          </p>
                        )}
                        <button
                          type="submit"
                          disabled={aiGenerating || !aiTopic.trim()}
                          className="w-full group/aibtn bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-100 disabled:text-emerald-400 text-white py-4 px-5 rounded-2xl text-[12px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                          {aiGenerating ? (
                            <>
                              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px] transition-transform group-hover/aibtn:scale-110">psychology</span>
                              <span>Generate Quiz</span>
                            </>
                          )}
                        </button>
                        {!aiGenerating && (
                          <div className="flex justify-center gap-2 text-[10px] text-slate-400 font-mono">
                            <span>Preloaded: "ethics", "democracy"</span>
                          </div>
                        )}
                      </form>
                    ) : (
                      <div className="space-y-4 pt-2 border-t border-emerald-100 relative z-10">
                        <div className="flex justify-between items-center bg-emerald-50 text-emerald-900 border border-emerald-200/50 rounded-2xl px-4 py-3 text-xs font-bold leading-normal shadow-sm">
                          <span className="truncate flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-emerald-600">task_alt</span> {aiGeneratedQuiz.title}</span>
                          <button 
                            onClick={() => {
                              setAiGeneratedQuiz(null);
                              setAiTopic("");
                            }}
                            className="text-[9px] bg-white hover:bg-emerald-100 px-2.5 py-1 rounded-md ml-2 shrink-0 cursor-pointer text-emerald-700 font-bold uppercase tracking-wider transition-colors border border-emerald-200"
                          >
                            Reset
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2 custom-scrollbar">
                          {aiGeneratedQuiz.questions.map((q, qIndex) => {
                            const selectedOptionIndex = aiSelectedAnswers[qIndex];
                            const isAnswered = selectedOptionIndex !== undefined;
                            const isCorrect = isAnswered && selectedOptionIndex === q.correctOptionIndex;

                            return (
                              <div key={qIndex} className="p-4 bg-[#FCFCFD] border border-slate-200/60 rounded-2xl space-y-3 text-left">
                                <p className="text-[13px] font-semibold text-slate-800 leading-snug font-sans">
                                  {qIndex + 1}. {q.text}
                                </p>

                                <div className="grid grid-cols-1 gap-2">
                                  {q.options.map((opt, optIdx) => {
                                    const isOptionSelected = selectedOptionIndex === optIdx;
                                    const isThisCorrectOption = optIdx === q.correctOptionIndex;

                                    let btnClass = "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:border-emerald-300";
                                    if (isAnswered) {
                                      if (isOptionSelected) {
                                        btnClass = isCorrect 
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-400 font-medium" 
                                          : "bg-red-50 text-red-800 border-red-300 font-medium";
                                      } else if (isThisCorrectOption) {
                                        btnClass = "bg-emerald-50/50 text-emerald-700 border-emerald-300 border-dashed font-medium";
                                      } else {
                                        btnClass = "bg-slate-50/50 opacity-50 border-slate-100 cursor-not-allowed text-slate-400";
                                      }
                                    }

                                    return (
                                      <button
                                        key={optIdx}
                                        type="button"
                                        disabled={isAnswered}
                                        onClick={() => {
                                          setAiSelectedAnswers(prev => ({
                                            ...prev,
                                            [qIndex]: optIdx
                                          }));
                                        }}
                                        className={`p-3 rounded-xl border text-left text-[12px] leading-relaxed transition-all cursor-pointer font-sans ${btnClass}`}
                                      >
                                        <div className="flex items-start gap-2">
                                          <span className="font-bold opacity-50 font-mono text-[10px] uppercase mt-[1px]">{String.fromCharCode(65 + optIdx)}.</span>
                                          <span>{opt}</span>
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>

                                {isAnswered && (
                                  <div className={`p-4 rounded-xl text-[12px] leading-relaxed font-sans border mt-3 ${
                                    isCorrect 
                                      ? "bg-emerald-50 border-emerald-100 text-emerald-900" 
                                      : "bg-amber-50 border-amber-100 text-amber-900"
                                  }`}>
                                    <div className="flex items-center gap-1.5 font-bold mb-1.5 font-sans">
                                      <span className="material-symbols-outlined text-[16px]">
                                        {isCorrect ? "check_circle" : "info"}
                                      </span>
                                      <span>{isCorrect ? "Classical Insight" : "Dialectical Refinement"}</span>
                                    </div>
                                    <p className="opacity-90">{q.explanation}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Form / Actions block */}
        <section className="max-w-7xl mx-auto px-6 sm:px-12 py-20 text-center relative overflow-hidden border-t border-slate-100">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-50/20 rounded-full blur-[130px] pointer-events-none" />
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-4 text-slate-900 leading-tight">
            Ready to elevate your meeting?
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mb-10 max-w-lg mx-auto leading-relaxed">
            Redefine digital lecture spaces with advanced gamified debates, quiz projection boards, and auto-diagnosis reports.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 font-sans">
            <button 
              onClick={() => setPortalMode("student")}
              className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all hover:scale-[1.01] active:scale-98 shadow-sm cursor-pointer"
            >
              Enter a Room as Student
            </button>
            <button 
              onClick={() => setPortalMode("login")}
              className="px-8 py-3.5 border border-slate-200/80 bg-white/50 hover:bg-slate-50 text-slate-700 hover:border-slate-300 rounded-2xl font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer"
            >
              Educator Portal
            </button>
          </div>
        </section>

      </main>

      {/* Footer Area */}
      <footer className="bg-slate-50/60 border-t border-slate-100 py-10 px-6 sm:px-12 backdrop-blur-md shrink-0">
        <div className="flex flex-col items-center gap-5 max-w-7xl mx-auto text-center">
          <SSLiveLogo size="md" />
          <div className="flex flex-wrap justify-center gap-6 text-[11px] font-mono tracking-wider font-bold text-slate-500 uppercase">
            <button 
              onClick={() => setShowPrivacyModal(true)} 
              className="hover:text-slate-950 transition-colors cursor-pointer bg-transparent border-none font-semibold font-mono tracking-wider"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setShowTermsModal(true)} 
              className="hover:text-slate-950 transition-colors cursor-pointer bg-transparent border-none font-semibold font-mono tracking-wider"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => setShowGuideModal(true)} 
              className="hover:text-slate-950 transition-colors cursor-pointer bg-transparent border-none font-semibold font-mono tracking-wider"
            >
              Educator Guide
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-mono tracking-tight leading-relaxed mt-2 max-w-lg inline-flex items-center justify-center gap-1 flex-wrap">
            © 2026 SSLive, a SKILL.SCH company. Made with <Heart size={10} className="text-rose-500 fill-rose-500 animate-pulse inline-block" /> by SSLabs. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ==================== PRIVACY POLICY MODAL ==================== */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-slate-100"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-150 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-indigo-600">
                <Shield size={18} />
                <h3 className="font-display font-black text-lg text-slate-900 uppercase tracking-tight">Privacy Policy</h3>
              </div>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-left text-slate-650 text-xs sm:text-sm leading-relaxed">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 font-medium font-sans">
                  <strong>Last Updated: June 2026.</strong> SSlive Systems under the SKILL.SCH initiative guarantees supreme security of student and educator credentials.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">1. Information We Collect</h4>
                <p className="font-sans font-normal">
                  To power our interactive dialogue boards and real-time dashboard engines, we handle two specific clusters of user data:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 font-sans font-normal text-xs sm:text-sm">
                  <li><strong>Educator Profile Data:</strong> Name, Email, and Avatar photo assets fetched during authenticated Google transitions.</li>
                  <li><strong>Classroom Session States:</strong> Student session nicknames, active room join parameters, cumulative question-answers, and space race coordinates.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">2. PII Isolation & Secure Boundaries</h4>
                <p className="font-sans font-normal">
                  We adopt a zero-leak philosophy for Personally Identifiable Information (PII). All educator files and profiles are secured behind server-enforced firestore protection layers that prevent arbitrary student scraping or document injection. No commercial third-party trackers are listed or integrated.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">3. Data Retention & Erasure</h4>
                <p className="font-sans font-normal">
                  Live room states, workspace logs, and diagnostics lists are treated as volatile elements. Educators retain full controls to instantly prune previous room history, discard reports, or trigger secure accounts termination natively through their dashboards.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">4. Compliance & Contact</h4>
                <p className="font-sans font-normal">
                  We comply strictly with student privacy preservation acts (COPPA/GDPR schemas). For further inquiries regarding database safety or payload transfers, reach out to our team at <strong>info@skill-sch.com</strong>.
                </p>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-colors cursor-pointer"
              >
                Acknowledge
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==================== TERMS OF SERVICE MODAL ==================== */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-slate-100"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-150 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-indigo-600">
                <FileText size={18} />
                <h3 className="font-display font-black text-lg text-slate-900 uppercase tracking-tight">Terms of Service</h3>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-left text-slate-650 text-xs sm:text-sm leading-relaxed">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 font-medium font-sans">
                  <strong>Last Updated: June 2026.</strong> By launching active classrooms or inputting credentials, you bind legally to these systemic terms.
                </p>
              </div>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">1. Acceptable Classroom Use</h4>
                <p className="font-sans font-normal">
                  Our platform tools, specifically including the Student debate portals, live polls, response boards, and space race panels, are formulated for standard educational inquiry. Educators are responsible for preserving respectful, academic dialogues within the bounds of their spawned Rooms.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">2. Anti-Abuse & Scraping Bans</h4>
                <p className="font-sans font-normal">
                  Users are strictly forbidden from attempting flood write executions, executing database crawler scripts, bypassing access roles, or manually triggering invalid coordinate updates on our interactive gamification grids. Malicious room overrides will result in immediate API endpoint bans.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">3. Intellectual Property Rights</h4>
                <p className="font-sans font-normal">
                  All underlying source configurations, brand styles (including the SKILL.SCH design), interactive graphics, custom animations, and automated prompt rails are the sole intellectual asset of SSlab. Real-time test papers uploaded by instructors remain the exclusive property of their respective creators.
                </p>
              </section>

              <section className="space-y-2">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base">4. System Scope & Limitation</h4>
                <p className="font-sans font-normal">
                  Services are provided on an "as-is" basis under standard developer quotas. We do not guarantee continuous uptime in high-density school testing events where server traffic margins are exceeded, although we maintain continuous load optimizations. Users waive all claims related to data loss resulting from network interrupts.
                </p>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
              <button 
                onClick={() => setShowTermsModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-colors cursor-pointer"
              >
                Accept Terms
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ==================== EDUCATOR GUIDE MODAL ==================== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-slate-100"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 bg-slate-50 border-b border-slate-150 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-indigo-650">
                <GraduationCap size={20} className="text-indigo-600" />
                <h3 className="font-display font-black text-lg text-slate-900 uppercase tracking-tight">
                  Educator Guide & <span className="text-emerald-600">SSLive</span> Manual
                </h3>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200/50 hover:bg-slate-200/80 flex items-center justify-center text-slate-500 hover:text-slate-950 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 text-left text-slate-650 text-xs sm:text-sm leading-relaxed">
              <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-indigo-100/50 rounded-2xl p-5 flex gap-3.5 shadow-2xs">
                <Sparkles size={18} className="text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-xs text-indigo-950 font-bold font-sans">
                    SKILL.SCH is an SSLive-owned Educational Platform.
                  </p>
                  <p className="text-[11px] text-slate-600 font-sans mt-0.5">
                    This active portal delivers fully integrated student assessment, gamification parameters, sandbox student simulations, and automated lesson plans with modern design standards.
                  </p>
                </div>
              </div>

              {/* Step by Step Setup */}
              <section className="space-y-3">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">1</span>
                  Activating Your Portal Console
                </h4>
                <div className="pl-7 text-slate-600 space-y-2">
                  <p className="font-sans font-normal">
                    Educator roles have administrative capabilities to build quiz sheets, configure team-based races, and track students.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <strong className="text-slate-800">Dynamic Educator Access:</strong>
                    </div>
                    <p className="text-slate-600 font-sans leading-relaxed">
                      Simply hit the <span className="font-semibold text-indigo-600">Educator Portal</span> button and sign in with any custom email and password of your choice to automatically instantiate your secure console:
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono">
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[10px]">Email: <strong className="text-slate-900">Your Email</strong></span>
                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[10px]">Password: <strong className="text-slate-900">Your Chosen Password</strong></span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Core Features Overview */}
              <section className="space-y-3">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">2</span>
                  Core SSLive Curricular Engines
                </h4>
                <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-150 hover:bg-slate-50 transition-colors">
                    <h5 className="font-display font-bold text-indigo-600 text-xs sm:text-sm mb-1">📋 Live Diagnostic Qui-Papers</h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans font-normal">
                      Formulate detailed multi-choice testing blocks. Run quizzes in step-by-step controller mode, allowing you to gauge performance before unlocking subsequent questions.
                    </p>
                  </div>

                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-150 hover:bg-slate-50 transition-colors">
                    <h5 className="font-display font-bold text-emerald-600 text-xs sm:text-sm mb-1">🚀 Space Race Gamification</h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans font-normal">
                      Divide classrooms into competitor fleets: <span className="text-rose-600 font-bold">Red Nova</span>, <span className="text-[#3b82f6] font-bold">Blue Nebula</span>, or <span className="text-amber-605 font-bold">Orange Pulsar</span> to fuel active group study sprints.
                    </p>
                  </div>

                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-150 hover:bg-slate-50 transition-colors">
                    <h5 className="font-display font-bold text-amber-500 text-xs sm:text-sm mb-1">🔮 SSLive Prompt Rails (AI Drafting)</h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans font-normal">
                      Simply type references (e.g. "Quantum Entanglement", "Ancient Athenian Assemblies") into our prompt writer. Our AI instantly compiles precise questions, valid options, and detailed takeaways.
                    </p>
                  </div>

                  <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-150 hover:bg-slate-50 transition-colors">
                    <h5 className="font-display font-bold text-rose-500 text-xs sm:text-sm mb-1">📊 Student Peer Debate Portals</h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans font-normal">
                      Enable real-time debate dialogues on questions where consensus is split. Students present points directly to the collective, fostering inquiry and collaborative reasoning.
                    </p>
                  </div>
                </div>
              </section>

              {/* Best Practices */}
              <section className="space-y-3">
                <h4 className="font-display font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center">3</span>
                  Classroom Best Practices
                </h4>
                <div className="pl-7">
                  <ul className="space-y-2.5 font-sans font-normal text-xs text-slate-650">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 text-white shrink-0 mt-2" />
                      <div>
                        <strong>Keep Boards Projected:</strong> Project the "Live Results Display" on the front board. Watching competitor space hulls launch ahead or responses fluctuate creates immense student drive.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 text-white shrink-0 mt-2" />
                      <div>
                        <strong>Seed Classroom Simulators:</strong> If you are testing or preparing offline, our platform allows you to boot a dynamic block of simulated students to evaluate flows before publishing room codes.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 text-white shrink-0 mt-2" />
                      <div>
                        <strong>Address Content Needs Immediately:</strong> Spot critical knowledge gaps through live response summaries and trigger spontaneous peer discussions to bridge student comprehension.
                      </div>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
              <button 
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-colors cursor-pointer"
              >
                Launch SSLive-Owned Console
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

