export interface Question {
  text: string;
  type: "multiple-choice" | "true-false" | "short-answer" | "poll" | "scale" | "word-cloud" | "puzzle-order";
  options: string[];
  correctAnswer: string;
  correctOptionIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  teacherId: string;
  questions: Question[];
  createdAt: any;
}

export type ActivityType = "quiz" | "space-race" | "quick-question" | "live-debate" | null;

export interface QuickQuestionConfig {
  type: "multiple-choice" | "true-false" | "short-answer";
  choicesCount?: number; // e.g., 5 for A-E helper
  customText?: string;
}

export interface LiveDebateConfig {
  prompt: string;
  sideA: string;
  sideB: string;
  catalystInjected?: boolean;
}

export interface DebateArgument {
  id: string;
  author: string;
  authorTeam?: string | null;
  avatar?: string;
  content: string;
  timestamp: any;
  likes: number;
  likedBy: string[];
  challenged: boolean;
  tags: string[];
}

export interface Room {
  roomId: string;
  teacherId: string;
  activeActivity: ActivityType;
  activeQuizId: string | null;
  activeQuestionIndex: number;
  pacing: "student-paced-feedback" | "student-paced-nav" | "teacher-paced";
  quickQuestion: QuickQuestionConfig | null;
  liveDebate?: LiveDebateConfig | null;
  showFeedback: boolean;
  showResults: boolean;
  inquiryModeEnabled?: boolean;
  inquiryAiChallengerEnabled?: boolean;
  anonymousPeerForumEnabled?: boolean;
  maieuticDialogueEnabled?: boolean;
  allowedRoster?: string[];
  rosterEnabled?: boolean;
  /** Team mode: players choose a team on join; scores pool per team */
  teamModeEnabled?: boolean;
  createdAt: any;
}

export interface Participant {
  id: string;
  name: string;
  team: string | null;
  avatar?: string;
  score: number;
  progress: number;
  answers: Record<number, string>;
  completed: boolean;
  joinedAt: any;
  handRaised?: boolean;
  handRaisedAt?: any;
  offTaskCount?: number;
  needsHelp?: boolean;
  reactions?: Record<string, {
    strongPremise?: number;
    logicLeap?: number;
    nuanced?: number;
    voters?: string[];
  }>;
  // ─── Kahoot-style game enhancements ────────────────────────────────────
  /** Current consecutive-correct streak */
  currentStreak?: number;
  /** Highest streak achieved during this session */
  maxStreak?: number;
  /** Total bonus points earned from streaks */
  streakBonus?: number;
  /** Last reaction emoji submitted (for floating animation on teacher screen) */
  lastReactionEmoji?: string;
  /** ISO timestamp of last reaction (drives floating animation) */
  lastReactionAt?: string;
}
