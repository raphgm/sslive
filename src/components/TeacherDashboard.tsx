import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, Play, Rocket, CircleHelp, Users, Copy, Check, LogOut, 
  Settings, BookOpen, Trash, Sparkles, Award, BarChart3, ChevronRight, HelpCircle, 
  ArrowRight, ShieldCheck, Zap, Layers, Info, ClipboardCheck, Share2, FileSpreadsheet, FileText, Search, X, Pencil, FileUp,
  ChevronDown, Lock, Unlock, UserPlus, Trash2, Shield, Sparkle, Cpu, MessageSquare, Flame, EyeOff, Clock, ShieldAlert, Download
} from "lucide-react";
import QRCode from "react-qr-code";
import { 
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc, 
  onSnapshot, query, where, serverTimestamp, getDoc 
} from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

import { db, auth, handleFirestoreError, OperationType, signOut } from "../firebase";
import { Quiz, Room, Participant, ActivityType, QuickQuestionConfig } from "../types";
import QuizCreator from "./QuizCreator";
import DiscoverView from "./DiscoverView";
import RoomsView from "./RoomsView";
import ReportsView from "./ReportsView";
import LiveResultsView from "./LiveResultsView";
import SpaceRaceView from "./SpaceRaceView";
import LiveReportView from "./LiveReportView";

interface TeacherDashboardProps {
  teacherUid: string;
  teacherEmail: string | null;
}

export default function TeacherDashboard({ teacherUid, teacherEmail }: TeacherDashboardProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  // View States
  const [currentView, setCurrentView] = useState<"launchpad" | "quizzes" | "discover" | "rooms" | "reports" | "live-results" | "creator">("launchpad");
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isAddQuizModalOpen, setIsAddQuizModalOpen] = useState(false);
  const [creatorInitialMode, setCreatorInitialMode] = useState<"manual" | "ai" | "import-paste" | "import-pro" | "import-excel">("manual");

  // Launcher configurations
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [dashboardLayoutOption, setDashboardLayoutOption] = useState<"bento" | "tactile-console">("tactile-console");
  const [selectedPacing, setSelectedPacing] = useState<"student-paced-feedback" | "student-paced-nav" | "teacher-paced">("student-paced-feedback");
  const [spaceRaceLanesCount, setSpaceRaceLanesCount] = useState<number>(3);

  // Copy success indicator
  const [copiedLink, setCopiedLink] = useState(false);

  // Editable room code state
  const [editableRoomCode, setEditableRoomCode] = useState("");
  const [isUpdatingRoomCode, setIsUpdatingRoomCode] = useState(false);

  // Quick Question States
  const [selectedQqType, setSelectedQqType] = useState<"multiple-choice" | "true-false" | "short-answer">("multiple-choice");

  // Active Launch sub-tab state (quiz | space-race | quick-question | exit-ticket | live-debate)
  const [activeLaunchTab, setActiveLaunchTab] = useState<"quiz" | "space-race" | "quick-question" | "exit-ticket" | "live-debate">("quiz");

  // Live Debate Configuration States
  const [debatePrompt, setDebatePrompt] = useState("To what extent does digital architecture shape human morality?");
  const [debateSideA, setDebateSideA] = useState("Structure Dictates Norms");
  const [debateSideB, setDebateSideB] = useState("Human Agency Primacy");

  // Multi-room, Reports History and Discover Marketplace States
  const [activeRoomId, setActiveRoomId] = useState<string>("");
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [reportsHistory, setReportsHistory] = useState<any[]>([]);
  
  // Custom Roster States
  const [isRosterMenuOpen, setIsRosterMenuOpen] = useState(false);
  const [isRoomListOpen, setIsRoomListOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterModalTab, setRosterModalTab] = useState<"import" | "manual" | "pro-info">("import");
  const [pastedRosterText, setPastedRosterText] = useState("");
  const [manualStudentInput, setManualStudentInput] = useState("");
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [handsRaisedQueue, setHandsRaisedQueue] = useState<string[]>([]);
  const [isProLicensed, setIsProLicensed] = useState(localStorage.getItem("sslive-pro-licensed") === "true");
  const [selectedHistoricalReport, setSelectedHistoricalReport] = useState<any | null>(null);
  const [showProTipRoom, setShowProTipRoom] = useState(localStorage.getItem("dismiss-rooms-protip") !== "true");
  const [renamingRoomId, setRenamingRoomId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState("");

  const activeHandRaises = participants.filter(p => p.handRaised);
  const activeNeedsHelp = participants.filter(p => p.needsHelp);
  const offTaskStudents = participants.filter(p => (p.offTaskCount || 0) > 0);
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState("");
  const [selectedDiscoverCategory, setSelectedDiscoverCategory] = useState("All");
  const [importingQuizId, setImportingQuizId] = useState<string | null>(null);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);

  const [isRoomSettingsModalOpen, setIsRoomSettingsModalOpen] = useState(false);

  // Socrative-style online/offline status banners states
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [showOnlineStatusBanner, setShowOnlineStatusBanner] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineStatusBanner(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineStatusBanner(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Real-time synchronization of all teacher rooms & quizzes
  useEffect(() => {
    if (!teacherUid) return;

    let unsubscribeQuizzes: (() => void) | null = null;
    let unsubscribeRoomsList: (() => void) | null = null;
    let unsubscribeReportsHistory: (() => void) | null = null;

    const loadTeacherData = async () => {
      try {
        // 1. Fetch Teacher's Quizzes
        const quizzesRef = collection(db, "quizzes");
        const quizzesQuery = query(quizzesRef, where("teacherId", "==", teacherUid));
        
        unsubscribeQuizzes = onSnapshot(quizzesQuery, (snapshot) => {
          const loadedQuizzes: Quiz[] = [];
          snapshot.forEach((doc) => {
            loadedQuizzes.push({ id: doc.id, ...doc.data() } as Quiz);
          });
          setQuizzes(loadedQuizzes);
          if (loadedQuizzes.length > 0 && !selectedQuizId) {
            setSelectedQuizId(loadedQuizzes[0].id);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, "quizzes");
        });

        // 2. Fetch All Teacher's Rooms in Real-time to maintain allRooms state
        const roomsRef = collection(db, "rooms");
        const teacherRoomsQuery = query(roomsRef, where("teacherId", "==", teacherUid));
        
        unsubscribeRoomsList = onSnapshot(teacherRoomsQuery, async (snapshot) => {
          const loadedRooms: Room[] = [];
          snapshot.forEach((doc) => {
            loadedRooms.push(doc.data() as Room);
          });
          
          setAllRooms(loadedRooms);

          if (loadedRooms.length > 0) {
            // Find if current activeRoomId is valid, otherwise set to first
            const matched = loadedRooms.find(r => r.roomId === activeRoomId);
            if (!matched && !activeRoomId) {
              setActiveRoomId(loadedRooms[0].roomId);
            }
          } else {
            // If no rooms exist at all, initialize the default room
            const emailPrefix = teacherEmail 
              ? teacherEmail.split("@")[0].toUpperCase().replace(/[^A-Z0-9]/g, "") 
              : "CLASS";
            const defaultRoomCode = `${emailPrefix}_${teacherUid.substring(0, 4).toUpperCase()}`;
            
            const newRoom: Room = {
              roomId: defaultRoomCode,
              teacherId: teacherUid,
              activeActivity: null,
              activeQuizId: null,
              activeQuestionIndex: 0,
              pacing: "student-paced-feedback",
              quickQuestion: null,
              showFeedback: true,
              showResults: true,
              createdAt: new Date().toISOString(),
            };

            await setDoc(doc(db, "rooms", defaultRoomCode), newRoom).catch((err) => {
              handleFirestoreError(err, OperationType.CREATE, `rooms/${defaultRoomCode}`);
            });
            setActiveRoomId(defaultRoomCode);
          }
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, "rooms");
        });

        // 3. Fetch Reports History
        const reportsRef = collection(db, "reports_history");
        const reportsQuery = query(reportsRef, where("teacherId", "==", teacherUid));
        
        unsubscribeReportsHistory = onSnapshot(reportsQuery, (snapshot) => {
          const loadedReports: any[] = [];
          snapshot.forEach((doc) => {
            loadedReports.push({ id: doc.id, ...doc.data() });
          });
          // Sort reports descending by date
          loadedReports.sort((a, b) => new Date(b.endedAt).getTime() - new Date(a.endedAt).getTime());
          setReportsHistory(loadedReports);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, "reports_history");
        });

        setLoading(false);
      } catch (e) {
        console.error("Error booting teacher snapshot bindings:", e);
        setLoading(false);
      }
    };

    loadTeacherData();

    return () => {
      if (unsubscribeQuizzes) unsubscribeQuizzes();
      if (unsubscribeRoomsList) unsubscribeRoomsList();
      if (unsubscribeReportsHistory) unsubscribeReportsHistory();
    };
  }, [teacherUid, teacherEmail]);

  // Real-time synchronization of currently selected active Room (handles room switching or updates)
  useEffect(() => {
    if (!activeRoomId) return;

    let unsubscribeRoom: (() => void) | null = null;
    let unsubscribeParticipants: (() => void) | null = null;

    unsubscribeRoom = onSnapshot(doc(db, "rooms", activeRoomId), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const currentRoomData = docSnapshot.data() as Room;
        setRoom(currentRoomData);
        setEditableRoomCode(currentRoomData.roomId);

        // Sub-subscribe to active room participants
        if (unsubscribeParticipants) {
          unsubscribeParticipants();
          unsubscribeParticipants = null;
        }

        const participantsRef = collection(db, "rooms", currentRoomData.roomId, "participants");
        unsubscribeParticipants = onSnapshot(participantsRef, (pSnapshot) => {
          const loadedParticipants: Participant[] = [];
          pSnapshot.forEach((pDoc) => {
            loadedParticipants.push({ id: pDoc.id, ...pDoc.data() } as Participant);
          });
          setParticipants(loadedParticipants);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, `rooms/${currentRoomData.roomId}/participants`);
        });
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `rooms/${activeRoomId}`);
    });

    return () => {
      if (unsubscribeRoom) unsubscribeRoom();
      if (unsubscribeParticipants) unsubscribeParticipants();
    };
  }, [activeRoomId]);

  // Copy Room Link to clipboard
  const copyJoinLink = () => {
    const targetCode = activeRoomId || (room?.roomId || "");
    if (!targetCode) return;
    const clickUrl = `${window.location.origin}?room=${targetCode}`;
    navigator.clipboard.writeText(clickUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Launch a standard Quiz Activity
  const handleLaunchQuiz = async () => {
    const quizId = selectedQuizId || (quizzes[0]?.id || "");
    if (!room || !quizId) return;
    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        activeActivity: "quiz",
        activeQuizId: quizId,
        activeQuestionIndex: 0,
        pacing: selectedPacing,
        quickQuestion: null,
        showFeedback: true,
        showResults: true,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${room.roomId}`);
      });
      // Clear previous participants before starting anew
      await clearParticipants();
      setCurrentView("live-results");
    } catch (e) {
      console.error(e);
    }
  };

  // Launch a classic Space Race Game Activity
  const handleLaunchSpaceRace = async () => {
    const quizId = selectedQuizId || (quizzes[0]?.id || "");
    if (!room || !quizId) return;
    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        activeActivity: "space-race",
        activeQuizId: quizId,
        activeQuestionIndex: 0,
        pacing: "student-paced-feedback", // space races are always student self-paced!
        quickQuestion: null,
        showFeedback: false, // keep excitement and hide direct feedback!
        showResults: true,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${room.roomId}`);
      });
      await clearParticipants();
      setCurrentView("live-results");
    } catch (e) {
      console.error(e);
    }
  };

  // Launch a standard formative Exit Ticket response survey
  const handleLaunchExitTicket = async () => {
    if (!room) return;
    try {
      let exitTicketId = "";
      // Look for any existing exit ticket saved in local memory
      const existing = quizzes.find(q => q.title === "Class Exit Ticket");
      if (existing) {
        exitTicketId = existing.id;
      } else {
        // Build a dynamic high-fidelity Exit Ticket Quiz blueprint
        const quizRef = doc(collection(db, "quizzes"));
        const newId = quizRef.id;
        const defaultExitTicket: Quiz = {
          id: newId,
          teacherId: teacherUid,
          title: "Class Exit Ticket",
          createdAt: new Date().toISOString(),
          questions: [
            {
              text: "How well did you understand today's digital lesson/lecture?",
              type: "multiple-choice",
              options: [
                "A. I fully understand & can teach others",
                "B. I understand most of the core concepts",
                "C. I only have a basic superficial understanding",
                "D. I am confused and need additional support"
              ],
              correctAnswer: "A",
              correctOptionIndex: 0,
              explanation: ""
            },
            {
              text: "What major concept/takeaway stood out the most today?",
              type: "short-answer",
              options: [],
              correctOptionIndex: -1,
              correctAnswer: "",
              explanation: ""
            },
            {
              text: "What part of today's lesson is still confusing or needs clarification?",
              type: "short-answer",
              options: [],
              correctOptionIndex: -1,
              correctAnswer: "",
              explanation: ""
            }
          ]
        };
        await setDoc(quizRef, defaultExitTicket);
        exitTicketId = newId;
      }

      await updateDoc(doc(db, "rooms", room.roomId), {
        activeActivity: "quiz",
        activeQuizId: exitTicketId,
        activeQuestionIndex: 0,
        pacing: "student-paced-feedback", // exit tickets are student-paced!
        quickQuestion: null,
        showFeedback: true,
        showResults: true,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${room.roomId}`);
      });
      await clearParticipants();
      setCurrentView("live-results");
    } catch (e) {
      console.error("Error launching class exit ticket:", e);
    }
  };

  // Launch quick question response fields
  const handleLaunchQuickQuestion = async () => {
    if (!room) return;
    try {
      const config: QuickQuestionConfig = {
        type: selectedQqType,
        choicesCount: selectedQqType === "multiple-choice" ? 5 : undefined,
      };

      await updateDoc(doc(db, "rooms", room.roomId), {
        activeActivity: "quick-question",
        activeQuizId: null,
        activeQuestionIndex: 0,
        pacing: "student-paced-feedback",
        quickQuestion: config,
        showFeedback: false,
        showResults: true,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${room.roomId}`);
      });
      await clearParticipants();
      setCurrentView("live-results");
    } catch (e) {
      console.error(e);
    }
  };

  // Launch live debate fields
  const handleLaunchLiveDebate = async (prompt: string, sideA: string, sideB: string) => {
    if (!room) return;
    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        activeActivity: "live-debate",
        activeQuizId: null,
        activeQuestionIndex: 0,
        pacing: "student-paced-feedback",
        quickQuestion: null,
        liveDebate: {
          prompt,
          sideA,
          sideB,
          catalystInjected: false,
        },
        showFeedback: false,
        showResults: true,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${room.roomId}`);
      });
      await clearParticipants();

      // Clean up previous debate subcollection arguments for the room if any
      // In firestore, deleting a subcollection is normally done via cloud function or individual deletes,
      // but we can just let arguments be filtered/queried by current debate_timestamp to be safe, or direct delete if possible.
      // SSlive uses fresh timestamping for arguments anyway!

      setCurrentView("live-results");
    } catch (e) {
      console.error(e);
    }
  };

  // Terminate any ongoing activity and showcase overall results matrix
  const handleEndActivity = async () => {
    if (!room) return;
    try {
      // 1. If we have active responses, archive a static Report session snapshot in Firestore
      if (room.activeActivity && participants.length > 0) {
        const reportId = doc(collection(db, "reports_history")).id;
        const currentQuizObj = quizzes.find(q => q.id === room.activeQuizId);
        const nameOfActivity = room.activeActivity;
        
        let reportTitle = "Formative Session";
        if (nameOfActivity === "quiz") {
          reportTitle = currentQuizObj?.title || "Class Evaluation";
        } else if (nameOfActivity === "space-race") {
          reportTitle = `🚀 Space Race: ${currentQuizObj?.title || "Cosmic Challenge"}`;
        } else if (nameOfActivity === "quick-question") {
          reportTitle = `📡 Poll: ${room.quickQuestion?.type === "multiple-choice" ? "Multiple Choice" : room.quickQuestion?.type === "true-false" ? "True / False" : "Short Answer"}`;
        } else if (nameOfActivity === "live-debate") {
          reportTitle = `🗣️ Live Debate: ${room.liveDebate?.prompt.substring(0, 30)}...`;
        }

        const totalQuestionsCount = currentQuizObj?.questions.length || 1;
        const computedAvg = Math.round(
          (participants.reduce((acc, curr) => acc + curr.score, 0) / (participants.length * totalQuestionsCount)) * 100
        ) || 0;

        const reportObj = {
          id: reportId,
          teacherId: teacherUid,
          roomCode: room.roomId,
          quizTitle: reportTitle,
          activityType: nameOfActivity,
          pacing: room.pacing || "N/A",
          endedAt: new Date().toISOString(),
          participantCount: participants.length,
          averageScore: nameOfActivity === "quiz" ? computedAvg : 100,
          participants: participants.map(p => ({
            name: p.name,
            score: p.score,
            completed: p.completed,
            answers: p.answers || {}
          })),
          questions: currentQuizObj?.questions || []
        };

        await setDoc(doc(db, "reports_history", reportId), reportObj);
      }

      // 2. Clear activity reference from room
      await updateDoc(doc(db, "rooms", room.roomId), {
        activeActivity: null,
        activeQuizId: null,
        quickQuestion: null,
        liveDebate: null,
      }).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `rooms/${room.roomId}`);
      });

      // Forward them straight to the Reports tab so they can audit what was completed!
      setCurrentView("reports");
    } catch (e) {
      console.error(e);
    }
  };

  // Advance Teacher paced question index forward
  const handleAdvanceTeacherPaced = async (amount: number) => {
    if (!room) return;
    const currentQuiz = quizzes.find(q => q.id === room.activeQuizId);
    if (!currentQuiz) return;

    const nextIndex = room.activeQuestionIndex + amount;
    if (nextIndex < 0 || nextIndex >= currentQuiz.questions.length) return;

    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        activeQuestionIndex: nextIndex
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Create a brand new rostered room
  const handleAddNewRoom = async () => {
    const rawCode = prompt("Enter a unique Room Code (alphanumeric, 3+ characters):");
    if (!rawCode) return;
    const formattedCode = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (formattedCode.length < 3) {
      alert("Room Code must be at least 3 characters.");
      return;
    }

    try {
      const docSnap = await getDoc(doc(db, "rooms", formattedCode));
      if (docSnap.exists()) {
        alert(`Room Code "${formattedCode}" is already taken.`);
        return;
      }

      const newRoom: Room = {
        roomId: formattedCode,
        teacherId: teacherUid,
        activeActivity: null,
        activeQuizId: null,
        activeQuestionIndex: 0,
        pacing: "student-paced-feedback",
        quickQuestion: null,
        showFeedback: true,
        showResults: true,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "rooms", formattedCode), newRoom);
      setActiveRoomId(formattedCode);
      alert(`Room "${formattedCode}" created and selected as active!`);
    } catch (e) {
      console.error(e);
      alert("Failed to create room.");
    }
  };

  // Kick all active participants to reset state
  const clearParticipants = async () => {
    if (!room) return;
    try {
      const participantsRef = collection(db, "rooms", room.roomId, "participants");
      const snapshot = await getDocs(participantsRef);
      const batchPromises = snapshot.docs.map((pDoc) => {
        return deleteDoc(doc(db, "rooms", room.roomId, "participants", pDoc.id));
      });
      await Promise.all(batchPromises);
    } catch (e) {
      console.error("Failed to reset participants:", e);
    }
  };

  // Save imported roster roster
  const handleSavePastedRoster = async () => {
    if (!room) return;
    const names = pastedRosterText
      .split(/,|\n/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    if (names.length === 0) {
      alert("Please paste or type at least one valid student name.");
      return;
    }

    try {
      const updatedList = Array.from(new Set([...(room.allowedRoster || []), ...names]));
      await updateDoc(doc(db, "rooms", room.roomId), {
        allowedRoster: updatedList,
        rosterEnabled: true
      });
      setPastedRosterText("");
      alert(`Success! Successfully added ${names.length} students to the allowed roster.`);
    } catch (err) {
      console.error(err);
      alert("Failed to save room roster. Check your permissions.");
    }
  };

  // Toggle roster enforcement
  const handleToggleRosterEnforcement = async () => {
    if (!room) return;
    const val = room.rosterEnabled === true;
    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        rosterEnabled: !val
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Add individual student manually
  const handleAddManualStudent = async () => {
    if (!room || !manualStudentInput.trim()) return;
    const newStudent = manualStudentInput.trim();
    const currentList = room.allowedRoster || [];
    
    if (currentList.some(n => n.toLowerCase() === newStudent.toLowerCase())) {
      alert(`"${newStudent}" is already listed on your room's roster.`);
      return;
    }

    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        allowedRoster: [...currentList, newStudent],
        rosterEnabled: true
      });
      setManualStudentInput("");
    } catch (err) {
      console.error(err);
    }
  };

  // Remove individual student from roster list
  const handleRemoveRosterStudent = async (studentToRemove: string) => {
    if (!room) return;
    const currentList = room.allowedRoster || [];
    const updatedList = currentList.filter(n => n !== studentToRemove);
    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        allowedRoster: updatedList
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Set SSlive Inquiry Dialogue Facilitation Mode
  const handleSetInquiryMode = async (enabled: boolean) => {
    if (!room) return;
    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        inquiryModeEnabled: enabled,
        socraticModeEnabled: enabled
      });
    } catch (e) {
      console.error("Could not set Inquiry mode:", e);
    }
  };

  const handleSetOverlay = async (key: string, enabled: boolean) => {
    if (!room) return;
    try {
      await updateDoc(doc(db, "rooms", room.roomId), {
        [key]: enabled
      });
    } catch (e) {
      console.error(`Could not set ${key}:`, e);
    }
  };

  // Customize teacher Room Code uniquely
  const handleUpdateRoomCode = async () => {
    if (!room || !editableRoomCode.trim()) return;
    
    const formattedCode = editableRoomCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (formattedCode.length < 3) {
      alert("Room Code must be at least 3 letters/numbers.");
      return;
    }

    if (formattedCode === room.roomId) return;

    setIsUpdatingRoomCode(true);
    try {
      // Check if room code is already taken in the db
      const docRef = doc(db, "rooms", formattedCode);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        alert(`Room Code "${formattedCode}" is already taken. Please choose another unique meeting name.`);
        setIsUpdatingRoomCode(false);
        return;
      }

      // Read current state
      const oldRoomId = room.roomId;
      
      // Delete old room and set new one
      const updatedRoom: Room = {
        ...room,
        roomId: formattedCode
      };

      await setDoc(doc(db, "rooms", formattedCode), updatedRoom).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `rooms/${formattedCode}`);
      });
      await deleteDoc(doc(db, "rooms", oldRoomId)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `rooms/${oldRoomId}`);
      });

      // Restart page or wait for snapshot
      setRoom(updatedRoom);
      alert(`Room Code successfully updated to: ${formattedCode}! Students must now join using this code.`);
    } catch (e) {
      console.error(e);
      alert("Something went wrong while updating Room Code.");
    } finally {
      setIsUpdatingRoomCode(false);
    }
  };

  // Save Quiz Handler (Manual + AI Generated)
  const handleSaveQuiz = async (quizFields: Partial<Quiz>) => {
    try {
      const id = editingQuiz?.id || doc(collection(db, "quizzes")).id;
      const newQuiz: Quiz = {
        id,
        title: quizFields.title || "Untitled Quiz",
        teacherId: teacherUid,
        questions: quizFields.questions || [],
        createdAt: editingQuiz?.createdAt || new Date().toISOString(),
      };

      await setDoc(doc(db, "quizzes", id), newQuiz).catch((err) => {
        handleFirestoreError(err, OperationType.CREATE, `quizzes/${id}`);
      });

      setEditingQuiz(null);
      setCurrentView("quizzes");
    } catch (e) {
      console.error(e);
      alert("Failed to save quiz. Please inspect security rules.");
    }
  };

  // Remove a Quiz
  const handleDeleteQuiz = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Instead of using the iframe-blocked window.confirm, we require a double confirmation click
    if (quizToDelete !== id) {
      setQuizToDelete(id);
      
      // Auto-reset confirmation state after 3 seconds
      setTimeout(() => {
        setQuizToDelete(null);
      }, 3000);
      return;
    }

    try {
      await deleteDoc(doc(db, "quizzes", id)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `quizzes/${id}`);
      });
      setQuizToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Helpers for Quick Questions Live Counts
  const qqStats = useMemo(() => {
    if (!room || room.activeActivity !== "quick-question" || !room.quickQuestion) return { breakdown: {}, total: 0 };
    
    const breakdown: Record<string, number> = {};
    let total = 0;

    participants.forEach((p) => {
      // Quick question responses are stored at answers[0]
      const responseValue = p.answers[0];
      if (responseValue) {
        total += 1;
        breakdown[responseValue] = (breakdown[responseValue] || 0) + 1;
      }
    });

    return { breakdown, total };
  }, [participants, room]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 font-sans">
        <div className="w-8 h-8 border-2 border-slate-800 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs text-slate-500 font-mono tracking-wider">Loading teacher dashboard...</p>
      </div>
    );
  }

  // Render Custom Creator Sub-View
  if (editingQuiz || currentView === "creator") {
    return (
      <QuizCreator 
        onSave={handleSaveQuiz} 
        onCancel={() => {
          setEditingQuiz(null);
          setCurrentView("quizzes");
        }} 
        existingQuiz={editingQuiz}
        initialMode={editingQuiz ? "manual" : creatorInitialMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/60 text-slate-800 font-sans" id="teacher-dashboard-main">
      
      {/* Socrative-style Unified Upper Navigation Frame */}
      <nav className="bg-white text-slate-800 shadow-3xs border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-0 flex flex-col md:flex-row justify-between items-center gap-3">
          
          <div className="flex items-center justify-between w-full md:w-auto gap-4 lg:gap-8">
            {/* Logo Cluster: 3 Interactive quiz circles that merge into 1 using Discover colors */}
            <div className="flex items-center gap-2.5 shrink-0 py-2.5 select-none hover:opacity-95 transition-opacity">
              <div className="relative w-9 h-9 flex items-center justify-center overflow-visible">
                {/* Circle 1: Discover Yellow (Drifts Top-Left) */}
                <motion.div 
                  className="absolute w-[18px] h-[18px] rounded-full bg-[#fbbf24] opacity-90 shadow-[0_1.5px_4px_rgba(251,191,36,0.3)]"
                  animate={{ 
                    x: [0, -6, -6, 0], 
                    y: [0, -5, -5, 0], 
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
                  className="absolute w-[18px] h-[18px] rounded-full bg-[#10b981] opacity-90 shadow-[0_1.5px_4px_rgba(16,185,129,0.3)]"
                  animate={{ 
                    x: [0, 6, 6, 0], 
                    y: [0, -5, -5, 0],
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
                  className="absolute w-[18px] h-[18px] rounded-full bg-[#6366f1] opacity-90 shadow-[0_1.5px_4px_rgba(99,102,241,0.3)]"
                  animate={{ 
                    x: [0, 0, 0, 0], 
                    y: [0, 6, 6, 0],
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
              <span className="font-display font-black text-slate-900 tracking-tight text-lg ml-0.5">
                SSlive
              </span>
            </div>

            {/* Desktop Navigation Tabs - Beautiful, clean material-style underlined active states */}
            <div className="hidden md:flex items-center self-stretch">
              {[
                { id: "launchpad", label: "Launch" },
                { id: "quizzes", label: "Library" },
                { id: "discover", label: "Discover" },
                { id: "rooms", label: "Rooms" },
                { id: "reports", label: "Reports" },
                ...(room && room.activeActivity ? [{ id: "live-results", label: "Live Results" }] : [])
              ].map((tab) => {
                const isSelected = currentView === tab.id;
                const isLiveResultsActive = tab.id === "live-results" && room && room.activeActivity;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id as any)}
                    className={`relative px-4 self-stretch flex items-center gap-1.5 text-xs lg:text-sm font-bold transition-all cursor-pointer h-14 border-b-[3px] ${
                      isSelected 
                        ? "border-[#0284c7] text-[#0284c7] font-extrabold bg-slate-50/20" 
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/40"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {/* Live indicator dot next to Live Results tab */}
                    {tab.id === "live-results" && (
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 border border-white ${
                        room && room.activeActivity 
                          ? "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]" 
                          : "bg-emerald-500"
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
            
            {/* Mobile / Tablet status indicator dot fallback */}
            {room && room.activeActivity && (
              <div className="md:hidden flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Right Action Row: Active Participants, Room Switcher with Roster Control, Get PRO orange Badge, and user avatar initials */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto md:ml-0 pb-1.5 md:pb-0">
            
            {/* Mobile Tab View helper banner */}
            <div className="flex md:hidden overflow-x-auto no-scrollbar gap-1 max-w-[120px] sm:max-w-[200px] -my-1 py-1 mr-2 pr-2 border-r border-slate-200">
              {[
                { id: "launchpad", label: "Launch" },
                { id: "quizzes", label: "Library" },
                { id: "discover", label: "Promo" },
                { id: "rooms", label: "Rooms" },
                { id: "reports", label: "Reports" },
                ...(room && room.activeActivity ? [{ id: "live-results", label: "Live" }] : [])
              ].map((tab) => {
                const isSelected = currentView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id as any)}
                    className={`text-[9px] font-bold px-2 py-1 rounded-lg shrink-0 whitespace-nowrap border ${
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white"
                        : "bg-white border-slate-205 text-slate-500"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 1. Connected Students Count (Interactive Roster Controls Popover Trigger - Image 2) */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsRosterMenuOpen(!isRosterMenuOpen);
                  setIsRoomListOpen(false);
                }}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-280 text-slate-800 font-sans text-xs font-bold rounded-full flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-3xs"
                title="Roster controls and active students"
              >
                <Users size={14} className="text-slate-400" />
                <span className="font-bold text-slate-800">{participants.length}</span>
              </button>

              <AnimatePresence>
                {isRosterMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsRosterMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200/85 py-2.5 z-40 text-left overflow-hidden origin-top-right text-slate-800"
                    >
                      <button
                        onClick={async () => {
                          setIsRosterMenuOpen(false);
                          if (confirm("Are you sure you want to clear all active students from this room? This resets their live progress.")) {
                            await clearParticipants();
                            alert("Meeting room participants successfully cleared!");
                          }
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer text-slate-700"
                      >
                        Clear Students from Room
                      </button>

                      <div className="border-t border-slate-100 my-1.5" />

                      <button
                        onClick={() => {
                          setIsRosterMenuOpen(false);
                          setRosterModalTab("pro-info");
                          setIsRosterModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col gap-0.5"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-extrabold text-slate-800 tracking-wider">ROSTER</span>
                          <span className="text-[8px] bg-orange-500 text-white font-mono font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide leading-none">PRO</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                          Manage and restrict access to your room and enable hand raising.
                        </span>
                      </button>

                      <div className="border-t border-slate-100 my-1.5" />

                      <button
                        onClick={() => {
                          setIsRosterMenuOpen(false);
                          setRosterModalTab("import");
                          setIsRosterModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Import Roster
                      </button>

                      <button
                        onClick={() => {
                          setIsRosterMenuOpen(false);
                          setRosterModalTab("manual");
                          setIsRosterModalOpen(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                      >
                        Manual (Type In)
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Room Switcher solid dark pill with Rooms switcher dropdown - Image 1 */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsRoomListOpen(!isRoomListOpen);
                  setIsRosterMenuOpen(false);
                }}
                className="px-4 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-280 text-slate-800 font-mono font-extrabold text-xs uppercase rounded-full flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-3xs"
                id="btn-room-selector-dropdown"
              >
                <span>{room?.roomId || "ROOM"}</span>
                <ChevronDown size={11} className="text-slate-500" />
              </button>

              <AnimatePresence>
                {isRoomListOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setIsRoomListOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/85 py-3 z-40 text-left overflow-hidden origin-top-right text-slate-800"
                    >
                      {/* Add Room + Option at the top */}
                      <button
                        onClick={async () => {
                          setIsRoomListOpen(false);
                          await handleAddNewRoom();
                        }}
                        className="w-full text-left px-4.5 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center group/add"
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-sans font-bold text-xs text-slate-850 group-hover:text-indigo-600 transition-colors">Add Room</span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5 leading-snug">
                            Rooms allow you to launch multiple activities at once
                          </span>
                        </div>
                        <Plus size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors ml-2 shrink-0" />
                      </button>

                      <div className="border-t border-slate-100 my-2" />

                      <div className="px-4 py-1">
                        <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-widest">Rooms</span>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-0.5 mt-1 px-1.5">
                        {allRooms.map((r) => {
                          const isSelected = r.roomId === activeRoomId;
                          
                          // Custom description matching the requested context and mockup style exactly
                          let desc = "Inquiry Session & Evaluations";
                          if (r.roomId === "SKILLSCH") {
                            desc = "Review Questions from Last Week";
                          } else if (r.roomId === "ESTY") {
                            desc = "Gradebook Indexes & Active Workspace";
                          } else if (r.activeQuizId) {
                            const matchedQuiz = quizzes.find(q => q.id === r.activeQuizId);
                            if (matchedQuiz) {
                              desc = `Running: ${matchedQuiz.title}`;
                            }
                          }

                          return (
                            <button
                              key={r.roomId}
                              onClick={() => {
                                setIsRoomListOpen(false);
                                setActiveRoomId(r.roomId);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                                isSelected 
                                  ? "bg-slate-50 border border-slate-150 font-semibold" 
                                  : "hover:bg-slate-50/70"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="mt-0.5 w-4 h-4 flex items-center justify-center shrink-0">
                                  {isSelected && <Check size={14} className="text-slate-900 stroke-[3]" />}
                                </div>
                                <div className="flex flex-col text-left">
                                  <span className={`text-[12px] font-mono font-black ${isSelected ? "text-slate-900" : "text-slate-800"}`}>
                                    {r.roomId}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-normal mt-0.5 leading-snug">
                                    {desc}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Green indicator dot on the right side */}
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-2" />
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>


            {/* 3. Orange-tinted premium Get PRO badge - Image 3 */}
            <button
              onClick={() => setIsProModalOpen(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
              id="btn-navbar-pro-badge"
            >
              <span className="text-slate-750 font-bold font-sans">
                {isProLicensed ? "Active" : "Get"}
              </span>
              <span className={`text-[9px] font-mono font-black tracking-widest px-1.5 py-0.5 rounded-sm leading-none ${
                isProLicensed 
                  ? "bg-emerald-500 text-white" 
                  : "bg-[#f97316] text-white animate-pulse"
              }`}>
                PRO
              </span>
            </button>

            {/* 4. Elegant User Profile Badge & Initials - Image 3 */}
            <div className="relative group/user z-30">
              <button 
                className="w-9 h-9 rounded-full bg-slate-100 border-2 border-slate-250 text-slate-800 hover:border-indigo-550 font-extrabold font-display flex items-center justify-center text-xs transition-all cursor-pointer"
                title={teacherEmail || "Teacher profile menu"}
              >
                {teacherEmail ? teacherEmail.substring(0, 2).toUpperCase() : "TT"}
              </button>
              
              {/* Profile dropdown triggerable easily */}
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 hidden group-hover/user:block hover:block text-slate-800">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-black leading-none">SIGNED IN AS</p>
                  <p className="text-xs font-semibold text-slate-800 truncate mt-1.5">{teacherEmail || "educator@sslive.app"}</p>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to copy the student registration join url?")) {
                      copyJoinLink();
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-semibold text-slate-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 size={13} /> Copy Student Link
                </button>
                
                <div className="border-t border-slate-100 my-1" />
                
                <button
                  onClick={() => signOut(auth)}
                  className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-xs font-bold text-rose-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut size={13} /> Exit Portal
                </button>
              </div>
            </div>

          </div>

        </div>
      </nav>

      {/* Socrative-style Yellow/Greenish "Back Online" Status Notification Banner */}
      {showOnlineStatusBanner && (
        <div className="bg-[#fffbeb] border-b border-yellow-200/70 py-2 px-6 text-xs text-yellow-800 transition-all flex justify-between items-center z-30 relative animate-fade-in">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-[#ef4444] animate-pulse"}`} />
              <span className="font-sans font-medium text-slate-700 text-[11px] md:text-xs">
                {isOnline ? (
                  <>
                    <span className="font-bold underline text-slate-900">You're back online!</span> Missing some results? Try{" "}
                    <button onClick={() => window.location.reload()} className="underline font-extrabold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors">
                      refreshing.
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-bold text-red-700">Offline mode.</span> Missing telemetry; checking alignment. Try{" "}
                    <button onClick={() => window.location.reload()} className="underline font-extrabold text-slate-900 hover:text-indigo-600 cursor-pointer">
                      refreshing.
                    </button>
                  </>
                )}
              </span>
            </div>
            <button 
              onClick={() => setShowOnlineStatusBanner(false)}
              className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer flex items-center justify-center shrink-0 ml-3"
              aria-label="Dismiss banner"
            >
              <X size={14} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Dashboard Panel Grid */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">

        {/* ACTIVE RUNNING ACTIVITY BANNER ACTION PANEL */}
        {room && room.activeActivity && (
          <div className="bg-slate-50 text-slate-800 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 fade-in-up shadow-3xs">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-sans text-emerald-600 uppercase font-black tracking-wider">
                  Live Active Meeting Activity
                </span>
              </div>
              <h3 className="text-base font-display font-bold flex items-center gap-2 text-slate-900">
                {room.activeActivity === "quiz" && "Live Quiz answering underway"}
                {room.activeActivity === "space-race" && "Live Space Race challenge running"}
                {room.activeActivity === "quick-question" && `Live Quick Poll: ${room.quickQuestion?.type}`}
              </h3>
              
              <p className="text-xs text-slate-500">
                {room.activeActivity === "quiz" && `Quiz: ${quizzes.find(q => q.id === room.activeQuizId)?.title || "Standard Evaluation"} | Pacing: ${room.pacing}`}
                {room.activeActivity === "space-race" && `Quiz: ${quizzes.find(q => q.id === room.activeQuizId)?.title || "Space Race Edition"}`}
                {room.activeActivity === "quick-question" && "Collecting dynamic responsive polls instantly from Student Screens."}
              </p>
            </div>

            {/* Advance buttons for Teacher Paced Quiz */}
            {room.activeActivity === "quiz" && room.pacing === "teacher-paced" && (
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
                <span className="text-xs font-sans text-slate-500">Pacing:</span>
                <button 
                  onClick={() => handleAdvanceTeacherPaced(-1)}
                  disabled={room.activeQuestionIndex <= 0}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-45 text-slate-700 border border-slate-200 rounded-md font-medium cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-xs font-mono font-bold text-slate-800 px-2">
                   {room.activeQuestionIndex + 1}
                </span>
                <button 
                  onClick={() => handleAdvanceTeacherPaced(1)}
                  disabled={room.activeQuestionIndex >= (quizzes.find(q => q.id === room.activeQuizId)?.questions.length || 1) - 1}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-45 text-slate-700 border border-slate-200 rounded-md font-medium cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}

            <div className="flex items-center gap-3 w-full md:w-auto">
              {currentView === "reports" ? (
                <button 
                  onClick={() => {
                    setCurrentView("launchpad");
                  }}
                  className="flex-1 md:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-750 rounded-lg border border-slate-205 transition-colors text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Layers size={13} />
                  Change/Start Activity
                </button>
              ) : (
                <button 
                  onClick={() => {
                    setCurrentView("reports");
                  }}
                  className="flex-1 md:flex-none px-4 py-2 border border-slate-205 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <BarChart3 size={13} />
                  Monitor Live
                </button>
              )}
              
              <button 
                onClick={handleEndActivity}
                className="flex-1 md:flex-none px-4 py-2 bg-red-600 hover:bg-red-750 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                id="teacher-end-activity"
              >
                End Activity
              </button>
            </div>
          </div>
        )}

        {/* VIEW: LAUNCHPAD OPTIONS PANEL */}
        {currentView === "launchpad" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Launchpad activities selector - Fully Unified Layout */}
            <div className={`lg:col-span-2 space-y-8 p-6 md:p-8 rounded-3xl border transition-all duration-300 shadow-xs ${
              dashboardLayoutOption === "tactile-console"
                ? "bg-slate-50/90 border-slate-205 text-slate-800 shadow-xs"
                : "bg-white/60 backdrop-blur-md border-slate-100"
            }`}>
              
              {/* Dynamic Design System Layout Switcher - Immersive Customizer */}
              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b ${
                dashboardLayoutOption === "tactile-console" ? "border-slate-200/80" : "border-slate-100"
              }`}>
                <div>
                  <h2 className={`text-md font-sans font-bold tracking-tight flex items-center gap-2 ${
                    dashboardLayoutOption === "tactile-console" ? "text-slate-800" : "text-slate-800"
                  }`}>
                    <span className={`w-1.5 h-6 rounded-full inline-block ${
                      dashboardLayoutOption === "tactile-console" 
                        ? "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)] animate-pulse" 
                        : "bg-gradient-to-b from-indigo-500 to-sky-500"
                    }`} />
                    Select Active Learning Module
                  </h2>
                  <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">Explore active classroom launch types built for direct student pacing.</p>
                </div>
                
                {/* Switcher widget */}
                <div className={`flex p-1 rounded-xl self-start sm:self-center border shadow-3xs ${
                  dashboardLayoutOption === "tactile-console"
                    ? "bg-slate-100 border-slate-200"
                    : "bg-slate-100 border-slate-205"
                }`}>
                  <button
                    type="button"
                    onClick={() => setDashboardLayoutOption("bento")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dashboardLayoutOption === "bento"
                        ? "bg-white text-slate-800 shadow-3xs"
                        : "text-slate-400 hover:text-slate-650"
                    }`}
                  >
                    <Layers size={11} />
                    MINIMAL BENTO
                  </button>
                  <button
                    type="button"
                    onClick={() => setDashboardLayoutOption("tactile-console")}
                    className={`px-3.5 py-1.5 rounded-lg text-[10px] font-mono tracking-wider font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                      dashboardLayoutOption === "tactile-console"
                        ? "bg-sky-100/80 text-sky-600 ring-1 ring-sky-500/20 shadow-xs"
                        : "text-slate-450 hover:text-slate-650"
                    }`}
                  >
                    <Cpu size={11} className="text-sky-600 animate-pulse" />
                    TACTILE COMMANDER
                  </button>
                </div>
              </div>

              {dashboardLayoutOption === "bento" ? (
                <>
                  {/* Row 1: Core Activities inside Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 1. QUIZ CARD */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => setActiveLaunchTab("quiz")}
                      className={`relative overflow-hidden text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[184px] group ${
                        activeLaunchTab === "quiz"
                          ? "bg-gradient-to-br from-indigo-50/70 via-indigo-50/40 to-indigo-100/20 border-indigo-500 shadow-[0_12px_24px_-4px_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/20"
                          : "bg-white hover:bg-slate-50/70 border-slate-205 hover:border-indigo-300/80 hover:shadow-xs"
                      }`}
                    >
                      {/* Interactive subtle ambient glow behind the card */}
                      {activeLaunchTab === "quiz" && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />
                      )}

                      {/* Select status badge */}
                      <div className="absolute top-5 right-5 flex items-center">
                        {activeLaunchTab === "quiz" ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] shadow-sm shadow-indigo-300/50 animate-scale">
                            <Check size={11} strokeWidth={4} />
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">SYNC</span>
                        )}
                      </div>

                      <div>
                        {/* Icon container */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeLaunchTab === "quiz" 
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-300/40 scale-105" 
                            : "bg-indigo-50 text-indigo-600 group-hover:scale-110"
                        }`}>
                          <BookOpen className="w-5.5 h-5.5" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className={`text-xs font-mono tracking-tight font-black uppercase transition-colors duration-300 ${
                          activeLaunchTab === "quiz" ? "text-indigo-950" : "text-slate-800"
                        }`}>
                          SSlive Live Quiz
                        </h4>
                        <p className={`text-[11px] mt-1 pr-1.5 leading-relaxed transition-colors duration-300 ${
                          activeLaunchTab === "quiz" ? "text-slate-600 font-medium" : "text-slate-400 group-hover:text-slate-500"
                        }`}>
                          Deploy structured, synchronous evaluation sets with multiple option rules.
                        </p>
                      </div>
                    </motion.button>

                    {/* 2. SPACE RACE CARD */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => setActiveLaunchTab("space-race")}
                      className={`relative overflow-hidden text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[184px] group ${
                        activeLaunchTab === "space-race"
                          ? "bg-gradient-to-br from-orange-50/70 via-orange-50/40 to-orange-100/20 border-orange-400 shadow-[0_12px_24px_-4px_rgba(249,115,22,0.18)] ring-1 ring-orange-400/20"
                          : "bg-white hover:bg-slate-50/70 border-slate-205 hover:border-orange-300/80 hover:shadow-xs"
                      }`}
                    >
                      {/* Interactive subtle ambient glow behind the card */}
                      {activeLaunchTab === "space-race" && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full filter blur-2xl pointer-events-none" />
                      )}

                      {/* Select status badge */}
                      <div className="absolute top-5 right-5 flex items-center">
                        {activeLaunchTab === "space-race" ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px] shadow-sm shadow-orange-300/50 animate-scale">
                            <Check size={11} strokeWidth={4} />
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-150 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">GAMIFIED</span>
                        )}
                      </div>

                      <div>
                        {/* Icon container */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeLaunchTab === "space-race" 
                            ? "bg-orange-500 text-white shadow-md shadow-orange-300/40 scale-105" 
                            : "bg-orange-50 text-orange-500 group-hover:scale-110"
                        }`}>
                          <Rocket className="w-5.5 h-5.5" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className={`text-xs font-mono tracking-tight font-black uppercase transition-colors duration-300 ${
                          activeLaunchTab === "space-race" ? "text-orange-950" : "text-slate-800"
                        }`}>
                          SSlive Space Race
                        </h4>
                        <p className={`text-[11px] mt-1 pr-1.5 leading-relaxed transition-colors duration-300 ${
                          activeLaunchTab === "space-race" ? "text-slate-600 font-medium" : "text-slate-400 group-hover:text-slate-500"
                        }`}>
                          Foment healthy competition with horizontal teammate race lanes.
                        </p>
                      </div>
                    </motion.button>

                    {/* 3. EXIT TICKET CARD */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => setActiveLaunchTab("exit-ticket")}
                      className={`relative overflow-hidden text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[184px] group ${
                        activeLaunchTab === "exit-ticket"
                          ? "bg-gradient-to-br from-emerald-50/70 via-emerald-50/40 to-emerald-100/20 border-emerald-500 shadow-[0_12px_24px_-4px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/20"
                          : "bg-white hover:bg-slate-50/70 border-slate-205 hover:border-emerald-300/80 hover:shadow-xs"
                      }`}
                    >
                      {/* Interactive subtle ambient glow behind the card */}
                      {activeLaunchTab === "exit-ticket" && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none" />
                      )}

                      {/* Select status badge */}
                      <div className="absolute top-5 right-5 flex items-center">
                        {activeLaunchTab === "exit-ticket" ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] shadow-sm shadow-emerald-300/50 animate-scale">
                            <Check size={11} strokeWidth={4} />
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-150 group-hover:text-emerald-600 group-hover:border-emerald-200 transition-colors">DIAGNOSTIC</span>
                        )}
                      </div>

                      <div>
                        {/* Icon container */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeLaunchTab === "exit-ticket" 
                            ? "bg-emerald-500 text-white shadow-md shadow-emerald-300/40 scale-105" 
                            : "bg-emerald-50 text-emerald-500 group-hover:scale-110"
                        }`}>
                          <LogOut className="w-5.5 h-5.5 rotate-180" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className={`text-xs font-mono tracking-tight font-black uppercase transition-colors duration-300 ${
                          activeLaunchTab === "exit-ticket" ? "text-emerald-950" : "text-slate-800"
                        }`}>
                          SSlive Exit Ticket
                        </h4>
                        <p className={`text-[11px] mt-1 pr-1.5 leading-relaxed transition-colors duration-300 ${
                          activeLaunchTab === "exit-ticket" ? "text-slate-600 font-medium" : "text-slate-400 group-hover:text-slate-500"
                        }`}>
                          Harvest direct, actionable diagnostic student understanding feedback.
                        </p>
                      </div>
                    </motion.button>
                  </div>

                  {/* QUICK QUESTION INTERACTIVE HEADER DIVIDER */}
                  <div className="relative flex py-6 items-center">
                    <div className="flex-grow border-t border-slate-150" />
                    <span className="flex-shrink mx-4 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-slate-400 bg-transparent px-2">
                      SSlive Quick Question Overlays
                    </span>
                    <div className="flex-grow border-t border-slate-150" />
                  </div>

                  {/* Row 2: Quick Questions in Bento Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* 4. MULTIPLE CHOICE */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => {
                        setActiveLaunchTab("quick-question");
                        setSelectedQqType("multiple-choice");
                      }}
                      className={`relative overflow-hidden text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[184px] group ${
                        activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice"
                          ? "bg-gradient-to-br from-amber-50/70 via-amber-50/40 to-amber-100/20 border-amber-400 shadow-[0_12px_24px_-4px_rgba(245,158,11,0.18)] ring-1 ring-amber-400/20"
                          : "bg-white hover:bg-slate-50/70 border-slate-205 hover:border-amber-300/80 hover:shadow-xs"
                      }`}
                    >
                      {/* Interactive subtle ambient glow behind the card */}
                      {activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
                      )}

                      <div className="absolute top-5 right-5 flex items-center">
                        {activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-550 text-white text-[10px] shadow-sm shadow-amber-300/50 animate-scale">
                            <Check size={11} strokeWidth={4} />
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-150 group-hover:text-amber-600 group-hover:border-amber-200 transition-colors">Instant MC</span>
                        )}
                      </div>

                      <div>
                        {/* Icon container */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" 
                            ? "bg-amber-500 text-white shadow-md shadow-amber-300/40 scale-105" 
                            : "bg-amber-50 text-amber-600 group-hover:scale-110"
                        }`}>
                          <FileText className="w-5.5 h-5.5" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className={`text-xs font-mono tracking-tight font-black uppercase transition-colors duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" ? "text-amber-950" : "text-slate-800"
                        }`}>
                          Fast Multiple Choice
                        </h4>
                        <p className={`text-[11px] mt-1 pr-1.5 leading-relaxed transition-colors duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" ? "text-slate-600 font-medium" : "text-slate-400 group-hover:text-slate-500"
                        }`}>
                          Pose a quick oral query. standard letter options are gathered live.
                        </p>
                      </div>
                    </motion.button>

                    {/* 5. TRUE / FALSE */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => {
                        setActiveLaunchTab("quick-question");
                        setSelectedQqType("true-false");
                      }}
                      className={`relative overflow-hidden text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[184px] group ${
                        activeLaunchTab === "quick-question" && selectedQqType === "true-false"
                          ? "bg-gradient-to-br from-violet-50/70 via-violet-50/40 to-violet-100/20 border-violet-400 shadow-[0_12px_24px_-4px_rgba(139,92,246,0.18)] ring-1 ring-violet-400/20"
                          : "bg-white hover:bg-slate-50/70 border-slate-205 hover:border-violet-300/80 hover:shadow-xs"
                      }`}
                    >
                      {/* Interactive subtle ambient glow behind the card */}
                      {activeLaunchTab === "quick-question" && selectedQqType === "true-false" && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full filter blur-2xl pointer-events-none" />
                      )}

                      <div className="absolute top-5 right-5 flex items-center">
                        {activeLaunchTab === "quick-question" && selectedQqType === "true-false" ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500 text-white text-[10px] shadow-sm shadow-violet-300/50 animate-scale">
                            <Check size={11} strokeWidth={4} />
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded border border-violet-150 group-hover:text-violet-600 group-hover:border-violet-200 transition-colors">Instant TF</span>
                        )}
                      </div>

                      <div>
                        {/* Icon container */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "true-false" 
                            ? "bg-violet-500 text-white shadow-md shadow-violet-300/40 scale-105" 
                            : "bg-violet-50 text-violet-600 group-hover:scale-110"
                        }`}>
                          <ClipboardCheck className="w-5.5 h-5.5" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className={`text-xs font-mono tracking-tight font-black uppercase transition-colors duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "true-false" ? "text-violet-950" : "text-slate-800"
                        }`}>
                          Fast True / False
                        </h4>
                        <p className={`text-[11px] mt-1 pr-1.5 leading-relaxed transition-colors duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "true-false" ? "text-slate-600 font-medium" : "text-slate-400 group-hover:text-slate-500"
                        }`}>
                          Verify conceptual alignment with binary feedback loops immediately.
                        </p>
                      </div>
                    </motion.button>

                    {/* 6. SHORT ANSWER */}
                    <motion.button
                      type="button"
                      whileHover={{ y: -5, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22 }}
                      onClick={() => {
                        setActiveLaunchTab("quick-question");
                        setSelectedQqType("short-answer");
                      }}
                      className={`relative overflow-hidden text-left p-6 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between h-[184px] group ${
                        activeLaunchTab === "quick-question" && selectedQqType === "short-answer"
                          ? "bg-gradient-to-br from-orange-50/70 via-orange-50/40 to-orange-100/20 border-orange-400 shadow-[0_12px_24px_-4px_rgba(249,115,22,0.18)] ring-1 ring-orange-400/20"
                          : "bg-white hover:bg-slate-50/70 border-slate-205 hover:border-orange-300/80 hover:shadow-xs"
                      }`}
                    >
                      {/* Interactive subtle ambient glow behind the card */}
                      {activeLaunchTab === "quick-question" && selectedQqType === "short-answer" && (
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full filter blur-2xl pointer-events-none" />
                      )}

                      <div className="absolute top-5 right-5 flex items-center">
                        {activeLaunchTab === "quick-question" && selectedQqType === "short-answer" ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white text-[10px] shadow-sm shadow-orange-300/50 animate-scale">
                            <Check size={11} strokeWidth={4} />
                          </span>
                        ) : (
                          <span className="text-[8.5px] font-mono font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded border border-orange-150 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">Instant SA</span>
                        )}
                      </div>

                      <div>
                        {/* Icon container */}
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "short-answer" 
                            ? "bg-orange-500 text-white shadow-md shadow-orange-300/40 scale-105" 
                            : "bg-orange-50 text-orange-500 group-hover:scale-110"
                        }`}>
                          <CircleHelp className="w-5.5 h-5.5" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className={`text-xs font-mono tracking-tight font-black uppercase transition-colors duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "short-answer" ? "text-orange-950" : "text-slate-800"
                        }`}>
                          Fast Short Answer
                        </h4>
                        <p className={`text-[11px] mt-1 pr-1.5 leading-relaxed transition-colors duration-300 ${
                          activeLaunchTab === "quick-question" && selectedQqType === "short-answer" ? "text-slate-600 font-medium" : "text-slate-400 group-hover:text-slate-500"
                        }`}>
                          Harvest descriptive statements or free-form text input responses.
                        </p>
                      </div>
                    </motion.button>
                  </div>
                </>
              ) : (
                /* OPTION B: IMMERSIVE TACTILE COMMAND CONSOLE (COMPLETELY UNIQUELY VISUALLY DIFFERENT) */
                <div className="space-y-6">
                  
                  {/* TACTILE COMMANDER RADAR DIAL HEADER */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-4.5 bg-white border border-slate-200/80 rounded-2xl shadow-3xs relative overflow-hidden">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[9.5px] font-mono font-black text-sky-600 uppercase tracking-widest">
                        <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                        Tactile Commander Active
                      </div>
                      <h4 className="text-sm font-sans font-extrabold text-slate-800">
                        Classroom Engine Cockpit
                      </h4>
                      <p className="text-[10px] text-slate-500 font-sans leading-normal">
                        Select an active module to transmit live learning feeds instantly to your student screens.
                      </p>
                    </div>

                    {/* The tactile commander circle - high craftsmanship rotating cockpit HUD styled with responsive Google colors */}
                    <div className="relative w-16 h-16 flex items-center justify-center shrink-0" id="tactile-commander-circle-hud">
                      {/* Outer concentric mechanical notch ring */}
                      <motion.div 
                        className="absolute inset-0 rounded-full border border-slate-205 border-dashed"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Mid ring */}
                      <motion.div 
                        className="absolute w-12 h-12 rounded-full border-2 border-slate-100 border-t-sky-500 border-r-emerald-500"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                      />
                      {/* Core Glowing Circle Pulsing with Google Colors */}
                      <motion.div 
                        className="w-8 h-8 rounded-full bg-white shadow-xs flex items-center justify-center relative overflow-hidden z-10 border border-slate-205"
                        animate={{ scale: [1, 1.08, 1] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        {/* 4 Quadrants of color inside the circle */}
                        <div className="absolute top-0 left-0 w-4 h-4 bg-[#4285f4] opacity-80" />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-[#ea4335] opacity-80" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 bg-[#fbbc05] opacity-80" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#016a40] opacity-80" />
                        <div className="absolute w-5 h-5 bg-white rounded-full flex items-center justify-center text-[8px] font-mono font-black text-slate-700 select-none shadow-3xs">
                          SS
                        </div>
                      </motion.div>
                    </div>
                  </div>

                  {/* HIGHLY GAMIFIED ACTION DIALS */}
                  <div className="space-y-12 mt-4">
                    {/* PRIMARY ACTIVITIES DECK */}
                    <div>
                      <h3 className="text-[12px] font-black tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2 justify-center">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        Main Quests
                      </h3>
                      <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                        {/* QUIZ CARD */}
                        <button
                          type="button"
                          onClick={() => setActiveLaunchTab("quiz")}
                          className={`relative flex flex-col items-center justify-center w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full border-[3px] transition-all duration-300 outline-none group overflow-hidden shrink-0 ${
                            activeLaunchTab === "quiz"
                              ? "bg-indigo-50 border-indigo-500 shadow-[0_12px_25px_rgba(99,102,241,0.25)] ring-4 ring-indigo-500/20 transform -translate-y-2"
                              : "bg-white border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-indigo-200 hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)] hover:-translate-y-2"
                          } active:translate-y-[2px] active:shadow-sm`}
                        >
                          <div className="relative z-10 flex flex-col items-center select-none">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:rotate-3 ${
                              activeLaunchTab === "quiz" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/40" : "bg-indigo-50 text-indigo-500"
                            }`}>
                              <FileText size={24} strokeWidth={2.5} />
                            </div>
                            <h4 className={`text-sm sm:text-base font-black tracking-tight mb-1 ${
                              activeLaunchTab === "quiz" ? "text-indigo-900" : "text-slate-800"
                            }`}>
                              Standard Quiz
                            </h4>
                            <p className={`text-[10px] leading-tight font-medium max-w-[110px] sm:max-w-[130px] mx-auto text-center ${
                              activeLaunchTab === "quiz" ? "text-indigo-700/80" : "text-slate-500"
                            }`}>
                              Interactive quizzes with live scores.
                            </p>
                          </div>
                        </button>

                        {/* SPACE RACE CARD */}
                        <button
                          type="button"
                          onClick={() => setActiveLaunchTab("space-race")}
                          className={`relative flex flex-col items-center justify-center w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full border-[3px] transition-all duration-300 outline-none group overflow-hidden shrink-0 ${
                            activeLaunchTab === "space-race"
                              ? "bg-orange-50 border-orange-500 shadow-[0_12px_25px_rgba(249,115,22,0.25)] ring-4 ring-orange-500/20 transform -translate-y-2"
                              : "bg-white border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-orange-200 hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] hover:-translate-y-2"
                          } active:translate-y-[2px] active:shadow-sm`}
                        >
                          <div className="relative z-10 flex flex-col items-center select-none">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:-translate-y-1 ${
                              activeLaunchTab === "space-race" ? "bg-orange-500 text-white shadow-lg shadow-orange-500/40" : "bg-orange-50 text-orange-500"
                            }`}>
                              <Rocket size={24} strokeWidth={2.5} />
                            </div>
                            <h4 className={`text-sm sm:text-base font-black tracking-tight mb-1 ${
                              activeLaunchTab === "space-race" ? "text-orange-950" : "text-slate-800"
                            }`}>
                              Space Race
                            </h4>
                            <p className={`text-[10px] leading-tight font-medium max-w-[110px] sm:max-w-[130px] mx-auto text-center ${
                              activeLaunchTab === "space-race" ? "text-orange-800/80" : "text-slate-500"
                            }`}>
                              Addictive team-based racing game.
                            </p>
                          </div>
                        </button>

                        {/* EXIT TICKET CARD */}
                        <button
                          type="button"
                          onClick={() => setActiveLaunchTab("exit-ticket")}
                          className={`relative flex flex-col items-center justify-center w-[160px] h-[160px] sm:w-[180px] sm:h-[180px] rounded-full border-[3px] transition-all duration-300 outline-none group overflow-hidden shrink-0 ${
                            activeLaunchTab === "exit-ticket"
                              ? "bg-emerald-50 border-emerald-500 shadow-[0_12px_25px_rgba(16,185,129,0.25)] ring-4 ring-emerald-500/20 transform -translate-y-2"
                              : "bg-white border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-emerald-200 hover:shadow-[0_20px_40px_rgba(16,185,129,0.15)] hover:-translate-y-2"
                          } active:translate-y-[2px] active:shadow-sm`}
                        >
                          <div className="relative z-10 flex flex-col items-center select-none">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform group-hover:scale-110 group-hover:rotate-[5deg] ${
                              activeLaunchTab === "exit-ticket" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/40" : "bg-emerald-50 text-emerald-500"
                            }`}>
                              <ClipboardCheck size={24} strokeWidth={2.5} />
                            </div>
                            <h4 className={`text-sm sm:text-base font-black tracking-tight mb-1 ${
                              activeLaunchTab === "exit-ticket" ? "text-emerald-950" : "text-slate-800"
                            }`}>
                              Exit Ticket
                            </h4>
                            <p className={`text-[10px] leading-tight font-medium max-w-[110px] sm:max-w-[130px] mx-auto text-center ${
                              activeLaunchTab === "exit-ticket" ? "text-emerald-800/80" : "text-slate-500"
                            }`}>
                              Assess student comprehension fast.
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* MINI GAMES / INSTANT QUESTIONS (Pill Shaped) */}
                    <div>
                      <h3 className="text-[12px] font-black tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2 justify-center">
                        <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Instant Actions
                      </h3>
                      <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                        
                        {/* FAST CHOICE */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLaunchTab("quick-question");
                            setSelectedQqType("multiple-choice");
                          }}
                          className={`relative text-left px-6 py-4 w-full sm:w-auto min-w-[240px] rounded-full border-[3px] transition-all duration-300 outline-none group overflow-hidden flex items-center gap-4 ${
                            activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice"
                              ? "bg-amber-50 border-amber-500 shadow-[0_10px_20px_rgba(245,158,11,0.2)] transform -translate-y-1 ring-4 ring-amber-500/20"
                              : "bg-white border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:border-amber-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(245,158,11,0.15)]"
                          } active:translate-y-[2px] active:shadow-none select-none`}
                        >
                          <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:-rotate-3 ${
                            activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" ? "bg-amber-500 text-white shadow-md shadow-amber-500/40" : "bg-amber-50 text-amber-500"
                          }`}>
                            <FileText size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className={`text-[15px] font-black tracking-tight mb-0.5 ${
                              activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" ? "text-amber-950" : "text-slate-800"
                            }`}>
                              A / B / C / D
                            </h4>
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${
                              activeLaunchTab === "quick-question" && selectedQqType === "multiple-choice" ? "text-amber-700/80" : "text-slate-400"
                            }`}>
                              Quick Poll
                            </p>
                          </div>
                        </button>

                        {/* EXTREME BINARY (TRUE/FALSE) */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLaunchTab("quick-question");
                            setSelectedQqType("true-false");
                          }}
                          className={`relative text-left px-6 py-4 w-full sm:w-auto min-w-[240px] rounded-full border-[3px] transition-all duration-300 outline-none group overflow-hidden flex items-center gap-4 ${
                            activeLaunchTab === "quick-question" && selectedQqType === "true-false"
                              ? "bg-violet-50 border-violet-500 shadow-[0_10px_20px_rgba(139,92,246,0.2)] transform -translate-y-1 ring-4 ring-violet-500/20"
                              : "bg-white border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:border-violet-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(139,92,246,0.15)]"
                          } active:translate-y-[2px] active:shadow-none select-none`}
                        >
                          <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-3 ${
                            activeLaunchTab === "quick-question" && selectedQqType === "true-false" ? "bg-violet-500 text-white shadow-md shadow-violet-500/40" : "bg-violet-50 text-violet-500"
                          }`}>
                            <Check size={20} strokeWidth={3} />
                          </div>
                          <div>
                            <h4 className={`text-[15px] font-black tracking-tight mb-0.5 ${
                              activeLaunchTab === "quick-question" && selectedQqType === "true-false" ? "text-violet-950" : "text-slate-800"
                            }`}>
                              True / False
                            </h4>
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${
                              activeLaunchTab === "quick-question" && selectedQqType === "true-false" ? "text-violet-700/80" : "text-slate-400"
                            }`}>
                              Binary Check
                            </p>
                          </div>
                        </button>

                        {/* OPEN FEED */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveLaunchTab("quick-question");
                            setSelectedQqType("short-answer");
                          }}
                          className={`relative text-left px-6 py-4 w-full sm:w-auto min-w-[240px] rounded-full border-[3px] transition-all duration-300 outline-none group overflow-hidden flex items-center gap-4 ${
                            activeLaunchTab === "quick-question" && selectedQqType === "short-answer"
                              ? "bg-sky-50 border-sky-500 shadow-[0_10px_20px_rgba(14,165,233,0.2)] transform -translate-y-1 ring-4 ring-sky-500/20"
                              : "bg-white border-slate-100 shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:border-sky-200 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(14,165,233,0.15)]"
                          } active:translate-y-[2px] active:shadow-none select-none`}
                        >
                          <div className={`w-12 h-12 rounded-full shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-[-5deg] ${
                            activeLaunchTab === "quick-question" && selectedQqType === "short-answer" ? "bg-sky-500 text-white shadow-md shadow-sky-500/40" : "bg-sky-50 text-sky-500"
                          }`}>
                            <MessageSquare size={20} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className={`text-[15px] font-black tracking-tight mb-0.5 ${
                              activeLaunchTab === "quick-question" && selectedQqType === "short-answer" ? "text-sky-950" : "text-slate-800"
                            }`}>
                              Short Answer
                            </h4>
                            <p className={`text-[11px] font-bold uppercase tracking-wider ${
                              activeLaunchTab === "quick-question" && selectedQqType === "short-answer" ? "text-sky-700/80" : "text-slate-400"
                            }`}>
                              Open Feed
                            </p>
                          </div>
                        </button>

                      </div>
                    </div>

                    {/* COLLABORATION */}
                    <div>
                      <h3 className="text-[12px] font-black tracking-widest text-slate-400 uppercase mb-6 flex items-center gap-2 justify-center">
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        Epic Challenges
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveLaunchTab("live-debate")}
                        className={`relative text-left px-8 py-6 w-full max-w-2xl mx-auto rounded-full border-[3px] transition-all duration-300 outline-none group overflow-hidden flex flex-col md:flex-row items-center justify-center gap-4 ${
                          activeLaunchTab === "live-debate"
                            ? "bg-rose-50 border-rose-500 shadow-[0_15px_30px_rgba(244,63,94,0.25)] transform -translate-y-2 ring-4 ring-rose-500/20"
                            : "bg-white border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:border-rose-200 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(244,63,94,0.15)]"
                        } active:translate-y-[2px] active:shadow-sm select-none`}
                      >
                         {activeLaunchTab === "live-debate" && (
                          <div className="absolute inset-0 bg-gradient-to-r from-rose-100/30 to-rose-200/20 pointer-events-none" />
                        )}
                        <div className="relative z-10 flex flex-col items-center text-center md:flex-row md:text-left gap-5">
                          <div className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-[15deg] ${
                            activeLaunchTab === "live-debate" ? "bg-rose-500 text-white shadow-lg shadow-rose-500/40" : "bg-rose-50 text-rose-500"
                          }`}>
                            <Flame size={28} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h4 className={`text-xl font-black tracking-tight mb-1.5 ${
                              activeLaunchTab === "live-debate" ? "text-rose-950" : "text-slate-800"
                            }`}>
                              Live Team Debate! ⚔️
                            </h4>
                            <p className={`text-sm leading-tight font-medium ${
                              activeLaunchTab === "live-debate" ? "text-rose-800/80" : "text-slate-500"
                            }`}>
                              Ignite dynamic, team-based arguments. Watch stances align in real-time.
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Expandable Configuration Drawer under selection */}
              <div className="mt-8 pt-6 border-t border-slate-100 transition-all duration-300">
                
                {activeLaunchTab === "quiz" && (
                  <div className="bg-slate-50/80 p-6 md:p-8 rounded-2xl border border-slate-200/80 relative group overflow-hidden fade-in-up">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono">Core Evaluation</span>
                          <h3 className="text-base font-display font-semibold text-slate-800 mt-0.5">Configure & Launch Standard SSlive Quiz</h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-medium">Engage students in synchronous evaluation with options for direct student pacing or teacher-led timing.</p>
                        </div>
                        <button 
                          onClick={() => setCurrentView("creator")}
                          className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-100 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Plus size={14} /> Add Quiz
                        </button>
                      </div>

                      {quizzes.length === 0 ? (
                        <div className="py-2.5 px-3.5 bg-amber-50/50 border border-dashed border-amber-200 rounded-xl text-xs text-amber-600">
                          You don't have any saved quizzes yet. Hit <strong>Saved Quizzes</strong> above or <strong>AI Script Generator</strong> to create one!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Select Quiz</label>
                            <select 
                              value={selectedQuizId || (quizzes[0]?.id || "")}
                              onChange={(e) => setSelectedQuizId(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 text-slate-750 font-semibold cursor-pointer"
                            >
                              <option value="" disabled>-- Choose a Quiz --</option>
                              {quizzes.map(q => (
                                <option key={q.id} value={q.id}>{q.title}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Pacing Mode</label>
                            <select 
                              value={selectedPacing}
                              onChange={(e) => setSelectedPacing(e.target.value as any)}
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 text-slate-750 font-semibold cursor-pointer"
                            >
                              <option value="student-paced-feedback">Student Paced - Instant Feedback</option>
                              <option value="student-paced-nav">Student Paced - Navigation allowed</option>
                              <option value="teacher-paced">Teacher Paced - Controlled advance</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Info size={12} className="text-slate-450 shrink-0" />
                          {room && room.activeActivity ? "⚠️ Active session will auto-end" : "👥 Clears student response state"}
                        </span>
                        <button 
                          onClick={handleLaunchQuiz}
                          disabled={quizzes.length === 0}
                          className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                            room && room.activeActivity 
                              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-100" 
                              : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                          }`}
                          id="launch-quiz-now"
                        >
                          {room && room.activeActivity ? <Zap size={14} /> : <Play size={14} />}
                          {room && room.activeActivity ? "Swap & Launch Quiz" : "Launch Quiz"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeLaunchTab === "space-race" && (
                  <div className="bg-slate-50/80 p-6 md:p-8 rounded-2xl border border-slate-200/80 relative group overflow-hidden fade-in-up">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest font-mono">Gamified Arena</span>
                        <h3 className="text-base font-display font-semibold text-slate-800 mt-0.5">Configure & Ignite Space Race</h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Organize student teams to compete live as horizontal rocket flight vessels advance side-by-side.</p>
                      </div>

                      {quizzes.length === 0 ? (
                        <div className="py-2.5 px-3.5 bg-amber-50/50 border border-dashed border-amber-200 rounded-xl text-xs text-amber-600">
                          You don't have any saved quizzes yet. Hit <strong>Saved Quizzes</strong> above or <strong>AI Script Generator</strong> to create one!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Select Space Quiz</label>
                            <select 
                              value={selectedQuizId || (quizzes[0]?.id || "")}
                              onChange={(e) => setSelectedQuizId(e.target.value)}
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 text-slate-750 font-semibold cursor-pointer"
                            >
                              <option value="" disabled>-- Choose a Quiz --</option>
                              {quizzes.map(q => (
                                <option key={q.id} value={q.id}>{q.title}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Flight Teams Selection</label>
                            <select 
                              value={spaceRaceLanesCount}
                              onChange={(e) => setSpaceRaceLanesCount(parseInt(e.target.value))}
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-400 text-slate-750 font-semibold cursor-pointer"
                            >
                              <option value="2">2 Teams (Blue vs Magenta)</option>
                              <option value="3">3 Teams (Blue vs Magenta vs Lime)</option>
                              <option value="4">4 Teams (Blue, Magenta, Lime, Peach)</option>
                              <option value="5">5 Teams (All 5 Cosmic Lanes!)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                          <Info size={12} className="text-slate-450 shrink-0" />
                          {room && room.activeActivity ? "⚠️ Active session will auto-end" : "🚀 Ignites cosmic raceboards"}
                        </span>
                        <button 
                          onClick={handleLaunchSpaceRace}
                          disabled={quizzes.length === 0}
                          className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                            room && room.activeActivity
                              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                              : "bg-orange-500 hover:bg-orange-600 shadow-orange-100"
                          }`}
                          id="launch-space-race"
                        >
                          {room && room.activeActivity ? <Zap size={14} /> : <Rocket size={14} />}
                          {room && room.activeActivity ? "Swap & Ignite" : "Ignite Space Race"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeLaunchTab === "exit-ticket" && (
                  <div className="bg-emerald-50/20 p-6 md:p-8 rounded-2xl border border-emerald-200 relative group overflow-hidden fade-in-up">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Formative Evaluation</span>
                        <h3 className="text-base font-display font-semibold text-slate-800 mt-0.5">Launch Class Exit Ticket</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Instantly launches a standard 3-question student feedback ticket for immediate understanding metrics, takeaways, and questions.
                        </p>
                      </div>

                      <div className="p-4 bg-white/80 rounded-xl border border-emerald-100 space-y-2.5">
                        <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <ClipboardCheck size={14} className="text-emerald-600" />
                          Standard exit-survey docket covers:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-mono font-bold text-slate-400 font-bold">Q1. Sentiments</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Rating checklist (A-D) on core concepts understanding.</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-mono font-bold text-slate-400 font-bold">Q2. Main Takeaway</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Short assessment input asking for key lessons today.</p>
                          </div>
                          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-mono font-bold text-slate-400 font-bold">Q3. Support Needs</p>
                            <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Inquiry asking what is still blurry or needs reinforcement.</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center bg-white p-4 rounded-xl border border-emerald-200/50 shadow-3xs">
                        <span className="text-[11px] text-slate-450 flex items-center gap-1 font-medium">
                          <Info size={12} className="text-emerald-500 shrink-0" />
                          Class Exit Ticket is self-bootstrapped straight to teacher library if needed.
                        </span>
                        <button 
                          onClick={handleLaunchExitTicket}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Play size={14} />
                          Launch Exit Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeLaunchTab === "quick-question" && (
                  <div className="bg-slate-50/80 p-6 md:p-8 rounded-2xl border border-slate-200 relative group overflow-hidden fade-in-up">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest font-mono">Dynamic Live Poll</span>
                        <h3 className="text-base font-display font-semibold text-slate-800 mt-0.5">
                          Launch Quick {selectedQqType === "multiple-choice" ? "Multiple Choice" : selectedQqType === "true-false" ? "True / False" : "Short Answer"} Pulse
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">
                          {selectedQqType === "multiple-choice" && "Ask the question verbally or on the slides. Students tap A, B, C, D, or E options immediately."}
                          {selectedQqType === "true-false" && "Spontaneously query a binary statement aloud. Rooms collect True / False votes instantly."}
                          {selectedQqType === "short-answer" && "Propose open-ended ideas. Collect instant text answers and see real-time student submissions."}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {["multiple-choice", "true-false", "short-answer"].map((type) => (
                          <button 
                            key={type}
                            onClick={() => setSelectedQqType(type as any)}
                            className={`flex-1 py-2.5 px-3 border rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                              selectedQqType === type 
                                ? "bg-violet-50 border-violet-500 text-violet-700 font-bold" 
                                : "border-slate-200 text-slate-500 hover:bg-slate-50 bg-white"
                            }`}
                          >
                            {type.replace("-", " ")}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-3xs">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {room && room.activeActivity ? "⚠️ Active session will auto-end" : "📡 Launches instant class poll"}
                        </span>
                        <button 
                          onClick={handleLaunchQuickQuestion}
                          className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                            room && room.activeActivity
                              ? "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                              : "bg-violet-600 hover:bg-violet-700 shadow-violet-100"
                          }`}
                        >
                          {room && room.activeActivity ? <Zap size={14} /> : <Play size={14} />}
                          {room && room.activeActivity ? "Swap & Launch Pulse" : "Launch Pulse"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeLaunchTab === "live-debate" && (
                  <div className="bg-rose-50/20 p-6 md:p-8 rounded-2xl border border-rose-200 relative group overflow-hidden fade-in-up">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest font-mono">Dialectical Arena</span>
                        <h3 className="text-base font-display font-semibold text-slate-800 mt-0.5">Configure & Launch Live Debate</h3>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">
                          Sparks interactive, team-based arguments and real-time stance alignments on hard-hitting Socratic themes.
                        </p>
                      </div>

                      <div className="space-y-4 bg-white/90 p-5 rounded-xl border border-rose-100">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold">Debate Topic / Prompt Question</label>
                          <input 
                            type="text"
                            value={debatePrompt}
                            onChange={(e) => setDebatePrompt(e.target.value)}
                            placeholder="e.g. To what extent does digital architecture shape human morality?"
                            className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-450/45 text-slate-750 font-semibold placeholder:text-slate-350"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold text-[#fbbc05]">Side A (Thesis / Yes Stance)</label>
                            <input 
                              type="text"
                              value={debateSideA}
                              onChange={(e) => setDebateSideA(e.target.value)}
                              placeholder="e.g. Structure Dictates Norms"
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-450/45 text-slate-750 font-semibold"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold text-[#016a40]">Side B (Antithesis / No Stance)</label>
                            <input 
                              type="text"
                              value={debateSideB}
                              onChange={(e) => setDebateSideB(e.target.value)}
                              placeholder="e.g. Human Agency Primacy"
                              className="w-full text-xs px-3 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-1 focus:ring-rose-450/45 text-slate-750 font-semibold"
                            />
                          </div>
                        </div>

                        <div className="pt-2">
                          <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-bold block mb-1.5">Preset themes:</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { p: "To what extent does digital architecture shape human morality?", a: "Structure Shapes Conduct", b: "Human Agency Rules" },
                              { p: "Should AI participate in civic policymaking directly?", a: "Benefit from Pure Logic", b: "Civics Require Empathy" },
                              { p: "Do digital credentials replace classical curriculum decks?", a: "Credentials Demystify Skill", b: "Decks Ground Foundational Knowledge" }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setDebatePrompt(preset.p);
                                  setDebateSideA(preset.a);
                                  setDebateSideB(preset.b);
                                }}
                                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-mono hover:bg-rose-50 hover:border-rose-300 text-slate-600 transition-all cursor-pointer"
                              >
                                Theme {idx + 1}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center bg-white p-4 rounded-xl border border-rose-200/50 shadow-3xs">
                        <span className="text-[11px] text-slate-450 flex items-center gap-1 font-medium">
                          <Info size={12} className="text-rose-500 shrink-0" />
                          {room && room.activeActivity ? "⚠️ Active session will auto-end" : "👥 Stance votes & text claims collect live"}
                        </span>
                        <button 
                          onClick={() => handleLaunchLiveDebate(debatePrompt, debateSideA, debateSideB)}
                          disabled={!debatePrompt.trim() || !debateSideA.trim() || !debateSideB.trim()}
                          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                        >
                          <Play size={14} />
                          Launch Debate Arena
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Sidebar Controls: Room code customization and instructions */}
            <div className="space-y-8">
              
              {/* Copy links & QR block */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  Meeting Gateway
                  {room && (
                    <button 
                      onClick={() => {
                        const file = new File([`Meeting Code: ${room.roomId}\nJoin Link: ${window.location.origin}/?room=${room.roomId}`], `Join_Instructions_${room.roomId}.txt`, {type: "text/plain"});
                        const url = URL.createObjectURL(file);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = file.name;
                        a.click();
                      }}
                      className="text-[10px] text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Download size={10} />
                      Export Instructions
                    </button>
                  )}
                </h4>
                
                {room && (
                  <div className="space-y-4">
                    <div className="flex gap-4 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-3xs shrink-0 relative flex items-center justify-center">
                        {/* We use a simple react-qr-code here. We need to import QRCode from "react-qr-code" */}
                        {QRCode ? <QRCode value={`${window.location.origin}/?room=${room.roomId}`} size={84} bgColor="#ffffff" fgColor="#0f172a" level="L" /> : <div className="w-[84px] h-[84px] bg-slate-100 flex items-center justify-center text-xs text-slate-400">QR</div>}
                      </div>
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Scan to Join</span>
                          {copiedLink && <span className="text-[9px] font-semibold text-emerald-600 animate-pulse bg-emerald-50 px-1 border border-emerald-100 rounded">Copied!</span>}
                        </div>
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 rounded-xl p-1.5 pl-2.5 shadow-3xs overflow-hidden">
                          <div className="text-[10px] sm:text-xs font-mono text-indigo-600 font-semibold select-all flex-1 min-w-0 overflow-x-auto whitespace-nowrap scrollbar-none py-1" title={`${window.location.origin}/?room=${room.roomId}`}>
                            {window.location.origin}/?room={room.roomId}
                          </div>
                          <button 
                            onClick={copyJoinLink}
                            type="button"
                            className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-150 transition-all flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                          >
                            {copiedLink ? <Check size={11} className="text-emerald-600 animate-ping-once" /> : <Copy size={11} />}
                            <span>{copiedLink ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Rename Room Code</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={editableRoomCode}
                          onChange={(e) => setEditableRoomCode(e.target.value)}
                          placeholder="e.g. CS101"
                          maxLength={12}
                          className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 uppercase focus:outline-hidden"
                        />
                        <button 
                          onClick={handleUpdateRoomCode}
                          disabled={isUpdatingRoomCode || editableRoomCode.trim().toUpperCase() === room.roomId}
                          className="px-3.5 bg-indigo-600 text-white font-semibold text-[11px] rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* UNIQUE DIFFERENTIATION CONTROL PANEL: SSLIVE INQUIRY MODE */}
              {room && (() => {
                const isInquiryActive = room.inquiryModeEnabled !== false;
                return (
                  <div className={`p-6 rounded-3xl border transition-all duration-500 relative overflow-hidden flex flex-col gap-5 ${
                    isInquiryActive
                      ? "bg-cyan-50/70 text-slate-850 border-cyan-200/80 shadow-[0_8px_24px_rgba(6,182,212,0.08)]"
                      : "bg-white text-slate-850 border-slate-200/80 shadow-3xs"
                  }`}>
                    {/* Brand Identity Accent Bar matching logo ribbon colors */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#016a40] via-[#ebb308] via-[#dc2626] to-[#0284c7] z-10" />

                    {/* Glowing Ambient Glow Orbs when Inquiry is Active */}
                    {isInquiryActive && (
                      <>
                        <div className="absolute top-0 right-0 w-44 h-44 bg-cyan-400/10 rounded-full filter blur-3xl animate-pulse pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-400/10 rounded-full filter blur-3xl pointer-events-none" />
                      </>
                    )}

                    <div className="flex items-center justify-between z-10">
                      <span className={`text-[10px] font-mono tracking-widest font-extrabold uppercase py-1 px-3 rounded-full border flex items-center gap-1.5 transition-all duration-300 ${
                        isInquiryActive
                          ? "bg-cyan-100/80 text-cyan-800 border-cyan-200 shadow-3xs"
                          : "bg-slate-50 text-slate-600 border-slate-100"
                      }`}>
                        <Sparkles size={11} className={`animate-pulse ${isInquiryActive ? "text-cyan-600" : "text-slate-400"}`} />
                        SSlive Core vs Standard Rote
                      </span>
                      <span className={`text-[9px] font-mono font-black tracking-wider px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
                        isInquiryActive
                          ? "text-emerald-700 bg-emerald-100/60 border-emerald-250"
                          : "text-emerald-600 bg-emerald-50 border-emerald-200/60"
                      }`}>
                        LIVE ACTIVE
                      </span>
                    </div>

                    <div className="space-y-1.5 z-10">
                      <h3 className={`text-base font-sans font-black flex items-center gap-2 transition-colors duration-300 ${
                        isInquiryActive ? "text-cyan-950 font-bold" : "text-slate-905"
                      }`}>
                        Meeting Reasoning Mode
                      </h3>
                      <p className={`text-xs leading-relaxed transition-colors duration-300 ${
                        isInquiryActive ? "text-slate-610 font-medium" : "text-slate-500"
                      }`}>
                        SSlive empowers peer collaboration and Inquiry AI facilitators, whereas traditional tools enforce passive, blind tests.
                      </p>
                    </div>

                    {/* Mode Button Switcher Segmented Pill Slider */}
                    <div className={`flex p-1 rounded-xl border transition-all duration-300 z-10 ${
                      isInquiryActive
                        ? "bg-cyan-100/50 border-cyan-200/80"
                        : "bg-slate-100/85 border-slate-200/65"
                    }`}>
                      <button
                        type="button"
                        onClick={() => handleSetInquiryMode(false)}
                        className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          !isInquiryActive
                            ? "bg-white text-slate-900 shadow-xs border border-slate-150"
                            : "text-cyan-700/65 hover:text-cyan-900"
                        }`}
                      >
                        <Lock size={12} />
                        <span>Rote (Conventional)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetInquiryMode(true)}
                        className={`flex-1 py-2 px-3 text-center rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isInquiryActive
                            ? "bg-cyan-600 hover:bg-cyan-705 text-white shadow-xs border border-cyan-500/20"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Sparkles size={12} className="animate-pulse" />
                        <span>Inquiry (SSlive Exclusive)</span>
                      </button>
                    </div>

                    {/* Dynamic Overlay List Container */}
                    <div className={`p-4 rounded-xl border transition-all duration-300 z-10 ${
                      isInquiryActive
                        ? "bg-white/85 border-cyan-200/70"
                        : "bg-slate-50/50 border-slate-200/40"
                    }`}>
                      <p className={`text-[9.5px] font-mono font-black uppercase tracking-wider mb-3 ${
                        isInquiryActive ? "text-amber-700" : "text-slate-500"
                      }`}>
                        {isInquiryActive ? "SSlive-Exclusive Active Overlays:" : "Standard Routine Parameters:"}
                      </p>
                      
                      {isInquiryActive ? (
                        <div className="space-y-3">
                          {/* Inquiry AI Challenger Toggle */}
                          <div className="flex items-center justify-between group bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-150 transition-colors">
                            <div className="flex items-center gap-3">
                              <motion.span 
                                className={`w-2 h-2 rounded-full shrink-0 ${room.inquiryAiChallengerEnabled !== false ? "bg-[#016a40] shadow-[0_0_8px_rgba(1,106,64,0.4)]" : "bg-slate-300"}`}
                                animate={room.inquiryAiChallengerEnabled !== false ? { scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              />
                              <div className="flex flex-col">
                                <strong className="text-slate-850 font-bold text-xs">Inquiry AI Challenger</strong>
                                <span className="text-[11px] text-slate-500">Explanations offer dialectic prompts automatically.</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSetOverlay("inquiryAiChallengerEnabled", room.inquiryAiChallengerEnabled === false ? true : false)}
                              className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ml-3 shrink-0 ${
                                room.inquiryAiChallengerEnabled !== false ? "bg-[#016a40]" : "bg-slate-300"
                              }`}
                            >
                              <span className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                                room.inquiryAiChallengerEnabled !== false ? "left-[22px]" : "left-[2px]"
                              }`} />
                            </button>
                          </div>

                          {/* Anonymous Peer Forum Toggle */}
                          <div className="flex items-center justify-between group bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-150 transition-colors">
                            <div className="flex items-center gap-3">
                              <motion.span 
                                className={`w-2 h-2 rounded-full shrink-0 ${room.anonymousPeerForumEnabled !== false ? "bg-[#ebb308] shadow-[0_0_8px_rgba(235,179,8,0.4)]" : "bg-slate-300"}`}
                                animate={room.anonymousPeerForumEnabled !== false ? { scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                              />
                              <div className="flex flex-col">
                                <strong className="text-slate-850 font-bold text-xs">Anonymous Peer Forum</strong>
                                <span className="text-[11px] text-slate-500">Students upvote classmate's short answers using critical labels.</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSetOverlay("anonymousPeerForumEnabled", room.anonymousPeerForumEnabled === false ? true : false)}
                              className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ml-3 shrink-0 ${
                                room.anonymousPeerForumEnabled !== false ? "bg-[#ebb308]" : "bg-slate-300"
                              }`}
                            >
                              <span className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                                room.anonymousPeerForumEnabled !== false ? "left-[22px]" : "left-[2px]"
                              }`} />
                            </button>
                          </div>

                          {/* Maieutic Dialogue Toggle */}
                          <div className="flex items-center justify-between group bg-slate-50 hover:bg-slate-100 p-2.5 rounded-lg border border-slate-150 transition-colors">
                            <div className="flex items-center gap-3">
                              <motion.span 
                                className={`w-2 h-2 rounded-full shrink-0 ${room.maieuticDialogueEnabled !== false ? "bg-[#dc2626] shadow-[0_0_8px_rgba(220,38,38,0.4)]" : "bg-slate-300"}`}
                                animate={room.maieuticDialogueEnabled !== false ? { scale: [1, 1.35, 1], opacity: [0.8, 1, 0.8] } : {}}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
                              />
                              <div className="flex flex-col">
                                <strong className="text-slate-850 font-bold text-xs">Maieutic Dialogue</strong>
                                <span className="text-[11px] text-slate-500">Students get AI hints on mistakes.</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSetOverlay("maieuticDialogueEnabled", room.maieuticDialogueEnabled === false ? true : false)}
                              className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ml-3 shrink-0 ${
                                room.maieuticDialogueEnabled !== false ? "bg-[#dc2626]" : "bg-slate-300"
                              }`}
                            >
                              <span className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                                room.maieuticDialogueEnabled !== false ? "left-[22px]" : "left-[2px]"
                              }`} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between group bg-white hover:bg-slate-50 p-2.5 rounded-lg border border-slate-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <ShieldAlert size={16} className={`${room.showResults === false ? "text-indigo-600" : "text-slate-400"}`} />
                              <div className="flex flex-col">
                                <strong className="text-slate-850 font-bold text-xs">Strict Blind Testing</strong>
                                <span className="text-[11px] text-slate-500">Hide live results and peer answers until manually revealed.</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSetOverlay("showResults", room.showResults === false ? true : false)}
                              className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ml-3 shrink-0 ${
                                room.showResults === false ? "bg-indigo-600" : "bg-slate-300"
                              }`}
                            >
                              <span className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                                room.showResults === false ? "left-[22px]" : "left-[2px]"
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between group bg-white hover:bg-slate-50 p-2.5 rounded-lg border border-slate-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <EyeOff size={16} className={`${room.showFeedback === false ? "text-indigo-600" : "text-slate-400"}`} />
                              <div className="flex flex-col">
                                <strong className="text-slate-850 font-bold text-xs">Hide Correct Answers</strong>
                                <span className="text-[11px] text-slate-500">Disable immediate feedback after submitting.</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSetOverlay("showFeedback", room.showFeedback === false ? true : false)}
                              className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ml-3 shrink-0 ${
                                room.showFeedback === false ? "bg-indigo-600" : "bg-slate-300"
                              }`}
                            >
                              <span className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                                room.showFeedback === false ? "left-[22px]" : "left-[2px]"
                              }`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between group bg-white hover:bg-slate-50 p-2.5 rounded-lg border border-slate-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <Clock size={16} className={`${room.pacing === "teacher-paced" ? "text-indigo-600" : "text-slate-400"}`} />
                              <div className="flex flex-col">
                                <strong className="text-slate-850 font-bold text-xs">Teacher Paced Checkpoints</strong>
                                <span className="text-[11px] text-slate-500">Lock navigation; students wait for you to progress.</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newPacing = room.pacing === "teacher-paced" ? "student-paced-feedback" : "teacher-paced";
                                handleSetOverlay("pacing", newPacing);
                              }}
                              className={`w-10 h-5 rounded-full transition-all relative cursor-pointer ml-3 shrink-0 ${
                                room.pacing === "teacher-paced" ? "bg-indigo-600" : "bg-slate-300"
                              }`}
                            >
                              <span className={`block w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow ${
                                room.pacing === "teacher-paced" ? "left-[22px]" : "left-[2px]"
                              }`} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* SSlive Wisdom Quote block */}
              <div className="bg-slate-50 text-slate-800 p-6 rounded-3xl border border-slate-200 shadow-3xs space-y-3 relative overflow-hidden">
                <div className="absolute -bottom-6 -right-6 text-slate-205 font-serif font-black text-7xl select-none opacity-40">“</div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                  <ShieldCheck size={14} className="text-indigo-500" /> SSlive wisdom
                </h4>
                <p className="text-xs italic text-slate-700 leading-relaxed font-serif">
                  "I cannot teach anybody anything. I can only make them think."
                </p>
                <p className="text-[10px] font-mono text-slate-500 text-right">— Classical Sage</p>
              </div>

            </div>

          </div>
        )}

        {/* VIEW: MY SAVED QUIZZES */}
        {currentView === "quizzes" && (
          <div className="space-y-6 fade-in-up">
            
            <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
              <div>
                <h3 className="font-display text-lg font-medium text-slate-800">SSlive Quiz Repositories</h3>
                <p className="text-xs text-slate-400">Manage or load quizzes. Tap Create with AI to invoke AI instantly</p>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsAddQuizModalOpen(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shadow-indigo-100 cursor-pointer active:scale-98"
                  id="btn-open-add-quiz-modal"
                >
                  <Plus size={15} /> Add Quiz
                </button>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <div className="bg-white border rounded-3xl py-16 text-center text-slate-400 text-xs font-mono">
                <BookOpen className="mx-auto mb-3 text-slate-300 animate-pulse" size={40} />
                No custom quizzes saved on this teacher record.
                <p className="mt-2 text-slate-400">Generations on our AI integration are instantaneous. Start forging now!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((q) => (
                  <div 
                    key={q.id}
                    onClick={() => {
                      setEditingQuiz(q);
                    }}
                    className="bg-white p-6 rounded-2xl border border-slate-105 shadow-xs hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group relative"
                  >
                    <div>
                      <span className="text-[9px] font-mono uppercase bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm font-semibold">
                        {q.questions.length} questions
                      </span>
                      <h4 className="text-base font-display font-semibold text-slate-800 mt-2.5 group-hover:text-indigo-600 transition-colors">
                        {q.title}
                      </h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">Created: {new Date(q.createdAt).toLocaleDateString()}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Edit Quiz <ChevronRight size={14} />
                      </span>
                      <button 
                        onClick={(e) => handleDeleteQuiz(q.id, e)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer relative z-10 pointer-events-auto ${quizToDelete === q.id ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500'}`}
                        title={quizToDelete === q.id ? "Click again to confirm delete" : "Delete Quiz"}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* VIEW: DISCOVER CURRICULUM MARKETPLACE */}
        {currentView === "discover" && (
          <DiscoverView 
            teacherUid={teacherUid}
            onImportSuccess={(title) => {
              alert(`Successfully imported "${title}" to your custom Quizzes catalog!`);
              setCurrentView("quizzes");
            }}
          />
        )}

        {/* VIEW: MEETINGS & ROOM CODES */}
        {currentView === "rooms" && (
          <RoomsView 
            teacherUid={teacherUid}
            teacherEmail={teacherEmail}
            allRooms={allRooms}
            activeRoomId={activeRoomId}
            setActiveRoomId={setActiveRoomId}
            participantsCount={participants.length}
            isProLicensed={isProLicensed}
            onTriggerProUpgrade={() => setIsProModalOpen(true)}
          />
        )}

        {/* VIEW: HISTORIC DIAGNOSTICS & Snapshots */}
        {currentView === "reports" && (
          <ReportsView 
            reportsHistory={reportsHistory}
          />
        )}

        {/* VIEW: LIVE REAL TIME SCOREBOARD */}
        {currentView === "live-results" && (
          <LiveResultsView 
            room={room}
            participants={participants}
            quizzes={quizzes}
            qqStats={qqStats}
            handleAdvanceTeacherPaced={handleAdvanceTeacherPaced}
            handleEndActivity={handleEndActivity}
            setCurrentView={setCurrentView}
          />
        )}

      </main>

      {/* SSLive "Add Quiz" Overlay Modal (Exact Screenshot 1 Layout) */}
      <AnimatePresence>
        {isAddQuizModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark blur backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddQuizModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Body Container */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative bg-white rounded-3xl w-full max-w-[550px] shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col"
              id="add-quiz-modal"
            >
              {/* Header Box */}
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <h3 className="text-lg font-display font-semibold text-slate-900">Add Quiz</h3>
                <button 
                  onClick={() => setIsAddQuizModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
                  aria-label="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[80vh] space-y-6 bg-slate-50/50">
                
                {/* Section A: Create with AI */}
                <div>
                  <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 mb-3 flex items-center gap-1">
                    Create with AI <span className="text-amber-500">✨</span>
                  </h4>
                  
                  {/* GENERATE QUESTIONS Option */}
                  <div 
                    onClick={() => {
                      setCreatorInitialMode("ai");
                      setEditingQuiz(null);
                      setIsAddQuizModalOpen(false);
                      setCurrentView("creator");
                    }}
                    className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-4 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer transition-all hover:shadow-xs group active:scale-99"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100/50 text-orange-500 flex items-center justify-center shrink-0 group-hover:bg-orange-100/50 transition-colors">
                      <Sparkles size={20} className="group-hover:animate-pulse" />
                    </div>
                    <div>
                      <h5 className="text-[13px] font-display font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">Generate Questions</h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">Create questions using an AI topic prompt and/or a quick teaching material paste.</p>
                    </div>
                  </div>
                </div>

                {/* Section B: Import Questions */}
                <div>
                  <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 mb-3">
                    Import Questions
                  </h4>

                  <div className="space-y-3">
                    {/* Option B1: Copy-Paste Questions */}
                    <div 
                      onClick={() => {
                        setCreatorInitialMode("import-paste");
                        setEditingQuiz(null);
                        setIsAddQuizModalOpen(false);
                        setCurrentView("creator");
                      }}
                      className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-4 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer transition-all hover:shadow-xs group active:scale-99"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100/50 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-100/50 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h5 className="text-[13px] font-display font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors font-medium">Copy-Paste Questions</h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">Import questions by pasting raw notes or existing questions list from another resource.</p>
                      </div>
                    </div>

                    {/* Option B2: Extract Questions from Document [PRO] */}
                    <div 
                      onClick={() => {
                        setCreatorInitialMode("import-pro");
                        setEditingQuiz(null);
                        setIsAddQuizModalOpen(false);
                        setCurrentView("creator");
                      }}
                      className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-4 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer transition-all hover:shadow-xs group active:scale-99"
                    >
                      <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100/50 text-violet-500 flex items-center justify-center shrink-0 group-hover:bg-violet-100/50 transition-colors relative">
                        <FileUp size={19} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-[13px] font-display font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">Extract Questions from Document</h5>
                          <span className="text-[8px] bg-amber-500 text-white font-mono font-black tracking-widest px-1 rounded-sm">PRO</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">Upload a text file, spreadsheet, or image, and we'll dynamically search and catalog the questions in it.</p>
                      </div>
                    </div>

                    {/* Option B3: Import from Excel or Code Template */}
                    <div 
                      onClick={() => {
                        setCreatorInitialMode("import-excel");
                        setEditingQuiz(null);
                        setIsAddQuizModalOpen(false);
                        setCurrentView("creator");
                      }}
                      className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-4 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer transition-all hover:shadow-xs group active:scale-99"
                    >
                      <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100/50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-100/50 transition-colors font-semibold">
                        <FileSpreadsheet size={20} />
                      </div>
                      <div>
                        <h5 className="text-[13px] font-display font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors font-medium">Import Questions from Code or Excel Template</h5>
                        <p className="text-[11px] text-slate-400 mt-1 leading-normal">Rapidly download a csv template and import a quiz structure in bulk from an Excel file.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section C: Start From Scratch */}
                <div>
                  <h4 className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400 mb-3">
                    Start From Scratch
                  </h4>

                  <div 
                    onClick={() => {
                      setCreatorInitialMode("manual");
                      setEditingQuiz(null);
                      setIsAddQuizModalOpen(false);
                      setCurrentView("creator");
                    }}
                    className="p-4 bg-white border border-slate-200/80 rounded-2xl flex items-start gap-4 hover:border-indigo-400 hover:bg-indigo-50/10 cursor-pointer transition-all hover:shadow-xs group active:scale-99"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 group-hover:bg-slate-200/50 transition-colors">
                      <Plus size={20} />
                    </div>
                    <div>
                      <h5 className="text-[13px] font-display font-semibold text-slate-800 leading-snug group-hover:text-indigo-600 transition-colors">Blank Quiz</h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">Jump right in with a blank canvas and piece together your interactive tests manual-style.</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* Roster Controls Modal Overlay */}
        {isRosterModalOpen && room && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRosterModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl w-full max-w-[550px] shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col max-h-[90vh]"
              id="roster-modal"
            >
              {/* Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900 flex items-center gap-2 mt-2">
                    <Shield size={16} className="text-slate-605" />
                    <span>Roster Controls — Room {room.roomId}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Administer registration states and active room limits.</p>
                </div>
                <button 
                  onClick={() => setIsRosterModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Sub-Tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/50 px-4 py-1.5 gap-1.5">
                {[
                  { id: "import", label: "Import Roster" },
                  { id: "manual", label: "Manual (Type In)" },
                  { id: "pro-info", label: "Roster PRO & Queue" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setRosterModalTab(tab.id as any)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      rosterModalTab === tab.id 
                        ? "bg-white text-slate-900 shadow-3xs border border-slate-250" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {tab.id === "pro-info" ? (
                      <span className="flex items-center gap-1">
                        <span>Queue & Handraise</span>
                        <span className="text-[7px] bg-orange-500 text-white px-1 rounded-sm leading-none py-0.5">PRO</span>
                      </span>
                    ) : tab.label}
                  </button>
                ))}
              </div>

              {/* Scrollable Body Content */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                
                {/* 1. IMPORT ROSTER TAB */}
                {rosterModalTab === "import" && (
                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Paste Student List</label>
                      <p className="text-[11px] text-slate-400">Separate names with either commas or line breaks. E.g. Alice Rose, Bob Vance, Charles Grodin</p>
                    </div>
                    <textarea
                      value={pastedRosterText}
                      onChange={(e) => setPastedRosterText(e.target.value)}
                      placeholder="Alice Rose, Bob Vance, Charles Grodin, Daisy Miller..."
                      className="w-full h-32 p-3 bg-white border border-slate-200 rounded-2xl text-xs font-sans focus:ring-2 focus:ring-primary focus:outline-none placeholder-slate-400 text-slate-800"
                    />
                    
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Enforce Access Control</p>
                        <p className="text-[10px] text-slate-400">Only listed students will be permitted to enter terminal.</p>
                      </div>
                      <button
                        onClick={handleToggleRosterEnforcement}
                        className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                          room.rosterEnabled ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 transition-all ${
                          room.rosterEnabled ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <span className="text-xs text-slate-400 font-mono self-center mr-auto">
                        Currently: {room.allowedRoster?.length || 0} allowed student(s)
                      </span>
                      <button
                        onClick={() => setIsRosterModalOpen(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSavePastedRoster}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <UserPlus size={14} /> Save & Enforce
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. MANUAL TYPE-IN TAB */}
                {rosterModalTab === "manual" && (
                  <div className="space-y-4 text-left">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Add Student manually</label>
                      <p className="text-[11px] text-slate-400">Add or strike off student whitelists instantly.</p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualStudentInput}
                        onChange={(e) => setManualStudentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleAddManualStudent();
                          }
                        }}
                        placeholder="Type student name..."
                        className="flex-1 px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary focus:outline-none bg-white font-semibold text-slate-800"
                      />
                      <button
                        onClick={handleAddManualStudent}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Add Student
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-3">
                      <h4 className="text-[10px] font-mono uppercase font-bold text-slate-400 tracking-wider mb-2">Approved Student Roster ({room.allowedRoster?.length || 0})</h4>
                      
                      {(!room.allowedRoster || room.allowedRoster.length === 0) ? (
                        <div className="bg-slate-50 border border-dashed text-slate-405 border-slate-200 rounded-xl py-6 text-center text-xs font-mono">
                          No student whitelisted yet. Whitelisted students join instantly.
                        </div>
                      ) : (
                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white">
                          {room.allowedRoster.map((student, i) => (
                            <div key={student + i} className="px-4 py-2 flex justify-between items-center text-xs hover:bg-slate-50 transition-colors">
                              <span className="font-semibold text-slate-700">{student}</span>
                              <button
                                onClick={() => handleRemoveRosterStudent(student)}
                                className="p-1 hover:bg-red-50 hover:text-rose-600 rounded text-slate-400 transition-colors cursor-pointer"
                                title="Strike student from whitelist"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200 mt-2">
                      <div>
                        <p className="text-xs font-bold text-slate-700">Roster Access Filter</p>
                        <p className="text-[10px] text-slate-400">Strict mode restricts non-roster connections.</p>
                      </div>
                      <button
                        onClick={handleToggleRosterEnforcement}
                        className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                          room.rosterEnabled ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4.5 h-4.5 bg-white rounded-full absolute top-0.75 transition-all ${
                          room.rosterEnabled ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. ROSTER PRO OVERVIEW & ACTIVE QUEUE LIST */}
                {rosterModalTab === "pro-info" && (
                  <div className="space-y-4 text-left">
                    {/* Simulated hand raise box */}
                    <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-3 relative overflow-hidden">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs uppercase font-mono tracking-widest text-indigo-400 font-bold">Active Hand Raises</span>
                            <span className="text-[8px] bg-orange-500 text-white font-mono px-1 rounded-sm leading-none py-0.5 font-bold">PRO</span>
                          </div>
                          <h4 className="text-sm font-semibold font-display text-white mt-1">Live Inquiry Classroom Queue</h4>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300">
                        When active, students can toggle hand raising from their interface to alert you. Click Acknowledge to clear student from active help roster.
                      </p>

                      <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800">
                        {activeHandRaises.length === 0 && activeNeedsHelp.length === 0 ? (
                          <p className="text-[10px] text-slate-400 italic">No hands raised in current queue. Students can raise their hand from their devices.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-[120px] overflow-y-auto">
                            {activeHandRaises.map((student, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-slate-800/60 p-2 rounded-lg border border-slate-700 text-xs">
                                <span className="text-slate-200 font-mono font-medium flex items-center gap-1.5">
                                  <span className="text-indigo-400">✋</span> {student.name}
                                </span>
                                <button
                                  onClick={async () => {
                                    if(!room) return;
                                    try {
                                      await updateDoc(doc(db, "rooms", room.roomId, "participants", student.id), {
                                        handRaised: false,
                                        handRaisedAt: null
                                      });
                                    } catch(e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded text-[10px] cursor-pointer"
                                >
                                  Acknowledge
                                </button>
                              </div>
                            ))}
                            {activeNeedsHelp.map((student, idx) => (
                              <div key={`help-${idx}`} className="flex justify-between items-center bg-rose-900/20 p-2 rounded-lg border border-rose-900/50 text-xs">
                                <span className="text-rose-200 font-mono font-medium flex items-center gap-1.5">
                                  <span className="text-rose-400">❓</span> {student.name} (Needs Help)
                                </span>
                                <button
                                  onClick={async () => {
                                    if(!room) return;
                                    try {
                                      await updateDoc(doc(db, "rooms", room.roomId, "participants", student.id), {
                                        needsHelp: false
                                      });
                                    } catch(e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="px-2 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-200 hover:text-white rounded text-[10px] cursor-pointer"
                                >
                                  Resolve
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Offline / Off-task tracking block */}
                      {offTaskStudents.length > 0 && isProLicensed && (
                        <div className="mt-3 pt-3 border-t border-slate-800">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Off-Task Alerts</h4>
                          <div className="space-y-1 max-h-[80px] overflow-y-auto">
                            {offTaskStudents.map((s, idx) => (
                              <div key={`off-${idx}`} className="flex items-center justify-between py-1 px-2 bg-amber-900/20 border border-amber-900/50 rounded-md">
                                <span className="text-[10px] text-amber-200 font-mono">{s.name}</span>
                                <span className="text-[9px] bg-amber-950 text-amber-400 px-1 border border-amber-800 rounded">Switched Tab: {s.offTaskCount}x</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pro features grid */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-indigo-50/10 border border-indigo-100 rounded-xl">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Lock size={12} className="text-indigo-600" /> Whitelist Restriction
                        </h5>
                        <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1">
                          Prevent unauthorized participants from entering your workspace terminal. Keep records secure.
                        </p>
                      </div>

                      <div className="p-3 bg-indigo-50/10 border border-indigo-100 rounded-xl">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Users size={12} className="text-indigo-600" /> Multi-Class Sync
                        </h5>
                        <p className="text-[10.5px] text-slate-400 leading-relaxed mt-1">
                          Synchronize and segment gradebook indexes dynamically across rooms and semesters.
                        </p>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}

        {/* PRO Upgrade Modal Overlay */}
        {isProModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white rounded-3xl w-full max-w-[500px] shadow-2xl border border-slate-100 overflow-hidden z-10 flex flex-col"
              id="pro-modal"
            >
              {/* Giant Pro Gradient background banner */}
              <div className="bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 p-8 text-white relative overflow-hidden text-left">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20" />
                
                <span className="text-[9px] font-mono font-black tracking-widest bg-orange-500 text-white px-2 py-0.5 rounded uppercase leading-none font-bold">SSlive Premium</span>
                <h3 className="text-xl font-display font-semibold mt-2.5 text-white">Upgrade to SSlive PRO</h3>
                <p className="text-[11px] text-indigo-200 mt-1.5 leading-relaxed font-sans">Unlock advanced student analytics, automated doc-to-quiz generators, and robust whitelisted meeting rooms.</p>
              </div>

              {/* Core Features list */}
              <div className="p-6 space-y-4 bg-white text-left">
                <div className="space-y-3.5">
                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-orange-50 text-orange-500 rounded-md shrink-0 mt-0.5">
                      <Sparkles size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Dynamic Documents Question Extraction [PRO]</h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans leading-normal">Drop PDFs, spreadsheets, or raw camera shots is all it takes. SSlive parses the questions instantly into your repository.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md shrink-0 mt-0.5">
                      <ShieldCheck size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Sealed Room Whitelists & Rosters</h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans leading-normal">Maintain access filtration effortlessly. Allow only registered student candidates to enter inquiry evaluations.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 bg-amber-50 text-amber-600 shrink-0 mt-0.5 rounded-md">
                      <Rocket size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Active Handraise Classroom Queues</h4>
                      <p className="text-[10.5px] text-slate-400 mt-0.5 font-sans leading-normal font-sans">Empower student interfaces with a single-tap ✋ alert indicator, bringing active Interactive feedback loops into ultra-high speed.</p>
                    </div>
                  </div>
                </div>

                {/* Simulated Payment Activator block */}
                <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                  {isProLicensed ? (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center">
                      <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                        <Check size={15} /> SSlive PRO License is currently Active!
                      </p>
                      <p className="text-[10px] text-emerald-600 mt-0.5">Thank you for supporting classical digital classrooms.</p>
                      <button
                        onClick={() => {
                          setIsProLicensed(false);
                          localStorage.removeItem("sslive-pro-licensed");
                          alert("SSlive PRO reset. Uninstalled license successfully.");
                        }}
                        className="mt-3 text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer inline-block"
                      >
                        Deactivate PRO Simulation License
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div className="p-2.5 border border-indigo-150 bg-indigo-50/10 rounded-xl relative cursor-pointer">
                          <span className="absolute -top-2 right-2 bg-indigo-600 text-white text-[7px] px-1 rounded-sm uppercase tracking-wider font-extrabold font-mono">SAVE 33%</span>
                          <p className="text-[10px] text-slate-405 font-bold">Annual Cycle</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">$8/month</p>
                          <p className="text-[8px] text-slate-400">Billed yearly ($96)</p>
                        </div>
                        <div className="p-2.5 border border-slate-200 hover:border-indigo-200 rounded-xl cursor-pointer">
                          <p className="text-[10px] text-slate-405">Monthly Cycle</p>
                          <p className="text-sm font-black text-slate-800 mt-0.5">$12/month</p>
                          <p className="text-[8px] text-slate-400">Cancel anytime</p>
                        </div>
                      </div>

                      <button
                        onClick={async (e) => {
                          const btn = e.currentTarget;
                          const originalText = btn.innerHTML;
                          btn.innerHTML = `<span class="flex items-center gap-2"><svg class="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Secure Checkout...</span>`;
                          btn.disabled = true;
                          
                          try {
                            let locationData = { country_code: "US", continent_code: "NA" };
                            try {
                              const geoResp = await fetch("https://get.geojs.io/v1/ip/geo.json");
                              locationData = await geoResp.json();
                            } catch (err) {
                              console.warn("Location detection failed.");
                            }

                            const resp = await fetch("/api/paystack/initialize", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: teacherEmail, locationData })
                            });
                            const result = await resp.json();
                            if (result.data && result.data.authorization_url) {
                              window.location.href = result.data.authorization_url;
                            } else {
                              throw new Error(result.error || result.message || "Failed to initialize payment.");
                            }
                          } catch (err: any) {
                            alert("Payment error: " + err.message);
                            btn.innerHTML = originalText;
                            btn.disabled = false;
                          }
                        }}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white hover:shadow-md hover:shadow-indigo-100 rounded-xl text-xs font-bold transition-all text-center cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                      >
                        <Sparkles size={13} />
                        Get SSlive PRO Whitelist Features Now
                      </button>
                    </>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
