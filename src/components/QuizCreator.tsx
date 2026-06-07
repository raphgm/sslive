import React, { useState, useRef } from "react";
import { 
  Plus, Trash, Sparkles, AlertCircle, Save, ArrowLeft, RefreshCw, Eye, Check, X, 
  FileText, FileUp, FileSpreadsheet, Clipboard, Download, HelpCircle, ToggleLeft, ToggleRight, Info, EyeOff, PieChart, SlidersHorizontal,
  Cloud, Layers, ChevronUp, ChevronDown
} from "lucide-react";
import { Question, Quiz } from "../types";

interface QuizCreatorProps {
  onSave: (quiz: Partial<Quiz>) => Promise<void>;
  onCancel: () => void;
  existingQuiz?: Quiz | null;
  initialMode?: "manual" | "ai" | "import-paste" | "import-pro" | "import-excel";
  /** Wave 7: pre-fill the AI topic field — used for skill.sch deep links */
  initialAiTopic?: string;
}

const PRESET_TOPICS = [
  { name: "Ancient Greece", icon: "🏛️" },
  { name: "Photosynthesis", icon: "🌱" },
  { name: "Linear Equations", icon: "📊" },
  { name: "Shakespeare's Hamlet", icon: "🎭" }
];

export default function QuizCreator({ onSave, onCancel, existingQuiz, initialMode, initialAiTopic }: QuizCreatorProps) {
  // Title of the quiz - starts blank or Untitled Quiz if completely new
  const [title, setTitle] = useState(existingQuiz?.title || (existingQuiz ? "" : "Untitled Quiz"));
  
  // Quiz Questions - starts empty for pristine Blank Quiz experience
  const [questions, setQuestions] = useState<Question[]>(existingQuiz?.questions || []);

  // Co-Pilot Workspace Layout States
  // It is open by default if initialMode is passed and is NOT "manual"
  const [aiSidebarOpen, setAiSidebarOpen] = useState(initialMode !== undefined && initialMode !== "manual");
  const [aiSubMode, setAiSubMode] = useState<"ai" | "import-paste" | "import-pro" | "import-excel">(
    initialMode && initialMode !== "manual" ? initialMode : "ai"
  );

  // Common State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [gradeLevel, setGradeLevel] = useState("High School");

  // --- SUB-MODE A: AI Generator States (Screenshot 2)
  const [aiDescribeCover, setAiDescribeCover] = useState(initialAiTopic || "");
  const [aiTypesSelected, setAiTypesSelected] = useState<Record<string, boolean>>({
    "multiple-choice": true,
    "true-false": true,
    "short-answer": false
  });
  const [aiGenerateExplanations, setAiGenerateExplanations] = useState(true);
  const [aiQuestionsCount, setAiQuestionsCount] = useState<number>(5);
  
  // Drag-and-drop document upload inside Generation Panel
  const [dragProgress, setDragProgress] = useState<number | null>(null);
  const [draggedFileName, setDraggedFileName] = useState("");
  const [draggedContent, setDraggedContent] = useState("");
  
  // --- SUB-MODE B: Copy-Paste States
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [pasteAutoCorrect, setPasteAutoCorrect] = useState(true);
  const [pasteExplanations, setPasteExplanations] = useState(true);

  // --- SUB-MODE C: Document Ingestion Scan States
  const [proDocName, setProDocName] = useState("");
  const [proDocContent, setProDocContent] = useState("");
  const [proDocPrompt, setProDocPrompt] = useState("");
  const [proDocProgress, setProDocProgress] = useState<number | null>(null);

  // --- SUB-MODE D: Spreadsheet Excel Template States
  const [excelSuccess, setExcelSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Question Fields Handlers
  const addQuestion = (type: "multiple-choice" | "true-false" | "short-answer" | "poll" | "scale" | "word-cloud" | "puzzle-order") => {
    let newQ: Question;
    if (type === "multiple-choice") {
      newQ = {
        text: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: "",
        correctOptionIndex: 0,
        explanation: "",
      };
    } else if (type === "true-false") {
      newQ = {
        text: "",
        type: "true-false",
        options: ["True", "False"],
        correctAnswer: "True",
        correctOptionIndex: 0,
        explanation: "",
      };
    } else if (type === "poll") {
      newQ = {
        text: "",
        type: "poll",
        options: ["Option 1", "Option 2"],
        correctAnswer: "",
        correctOptionIndex: -1,
        explanation: "Polls do not have correct answers.",
      };
    } else if (type === "scale") {
      newQ = {
        text: "Rate your understanding from 1 to 5",
        type: "scale",
        options: ["1", "2", "3", "4", "5"],
        correctAnswer: "",
        correctOptionIndex: -1,
        explanation: "Scale questions do not have correct answers.",
      };
    } else if (type === "word-cloud") {
      newQ = {
        text: "",
        type: "word-cloud",
        options: [],
        correctAnswer: "",
        correctOptionIndex: -1,
        explanation: "Word Cloud questions collect single-word submissions — no right answer.",
      };
    } else if (type === "puzzle-order") {
      newQ = {
        text: "",
        type: "puzzle-order",
        options: ["", "", "", ""],
        // correctAnswer stores the ordered sequence joined by "|"
        correctAnswer: "",
        correctOptionIndex: -1,
        explanation: "",
      };
    } else {
      newQ = {
        text: "",
        type: "short-answer",
        options: [],
        correctAnswer: "",
        correctOptionIndex: -1,
        explanation: "",
      };
    }
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...questions];
    updated[index].text = text;
    setQuestions(updated);
  };

  const updateQuestionExplanation = (index: number, explanation: string) => {
    const updated = [...questions];
    updated[index].explanation = explanation;
    setQuestions(updated);
  };

  const updateMcOption = (qIndex: number, optIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].options[optIndex] = val;
    if (updated[qIndex].correctOptionIndex === optIndex) {
      updated[qIndex].correctAnswer = val;
    }
    setQuestions(updated);
  };

  const updateMcCorrectIndex = (qIndex: number, val: number) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = val;
    updated[qIndex].correctAnswer = updated[qIndex].options[val];
    setQuestions(updated);
  };

  const updateTfCorrectIndex = (qIndex: number, val: number) => {
    const updated = [...questions];
    updated[qIndex].correctOptionIndex = val;
    updated[qIndex].correctAnswer = val === 0 ? "True" : "False";
    setQuestions(updated);
  };

  const updateSaCorrectValue = (qIndex: number, val: string) => {
    const updated = [...questions];
    updated[qIndex].correctAnswer = val;
    setQuestions(updated);
  };

  // Active File Upload reading
  const handleRealFileUpload = (mode: "ai" | "pro-doc", file: File) => {
    const setProg = mode === "ai" ? setDragProgress : setProDocProgress;
    const setName = mode === "ai" ? setDraggedFileName : setProDocName;
    const setCont = mode === "ai" ? setDraggedContent : setProDocContent;

    setProg(10);
    setName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setProg(100);
      const text = e.target?.result as string;
      setCont(text || "Warning: Binary or unreadable document uploaded without pure text indexing. Cannot extract cleanly.");
      setTimeout(() => setProg(null), 600);
    };
    reader.onerror = () => {
      setProg(100);
      setCont("Failed to read file contents.");
      setTimeout(() => setProg(null), 600);
    };
    reader.readAsText(file);
  };

  // Simulated File Upload triggers (fallback)
  const handleSimulateFileUpload = (mode: "ai" | "pro-doc", name: string, sizeText: string, contentSim: string) => {
    const setProg = mode === "ai" ? setDragProgress : setProDocProgress;
    const setName = mode === "ai" ? setDraggedFileName : setProDocName;
    const setCont = mode === "ai" ? setDraggedContent : setProDocContent;

    setProg(0);
    setName(name);

    let currentProg = 0;
    const interval = setInterval(() => {
      currentProg += 20;
      setProg(currentProg);
      if (currentProg >= 100) {
        clearInterval(interval);
        setCont(contentSim);
        setTimeout(() => setProg(null), 800); // clear progress
      }
    }, 150);
  };

  // AI CORE GENERATORS calling Express server-side AI API
  const runServerAiGeneration = async (promptPayload: string, sizeLabel = aiQuestionsCount) => {
    setIsGenerating(true);
    setAiError("");

    try {
      const res = await fetch("/api/quizzes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: promptPayload,
          gradeLevel: gradeLevel,
          questionCount: sizeLabel,
          quizType: `SSlive Advanced Workspace Input [${aiSubMode}]`
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to compile questions via SSlive Brain.");
      }

      const data = await res.json();
      if (data && data.questions) {
        // Formulate standard title if none written
        if (!title || title === "Untitled Quiz") {
          setTitle(data.title || "SSlive Custom Prompt Quiz");
        }
        setQuestions([...questions, ...data.questions]);
      } else {
        throw new Error("Peculiar format returned from AI integration.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "An unexpected error blocked AI integration from completing. Let's retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger for Sub-Mode 1: Generate Questions
  const handleGenerateQuestions = () => {
    if (!aiDescribeCover.trim()) {
      setAiError("Please describe what concepts the questions should cover.");
      return;
    }

    const enabledStyles: string[] = [];
    if (aiTypesSelected["multiple-choice"]) enabledStyles.push("multiple choice");
    if (aiTypesSelected["true-false"]) enabledStyles.push("true/false");
    if (aiTypesSelected["short-answer"]) enabledStyles.push("short text answer");

    const styleDirective = enabledStyles.length > 0
      ? `Generate only these question formats: ${enabledStyles.join(", ")}.`
      : "Inculcate a blend of multiple-choice and true-false formats.";

    const explanationDirective = aiGenerateExplanations
      ? "Each question MUST have a highly detailed, insightful, and pedagogical explanation."
      : "For explanations, supply brief encouraging feedback notes.";

    const promptText = `CONCEPT TARGET: ${aiDescribeCover}.
    ${styleDirective}
    ${explanationDirective}
    Grade Cohort Target: ${gradeLevel}.
    ${draggedContent ? `COMPRESSED BACKGROUND REFERENCE CONTEXT:\n"""\n${draggedContent}\n"""` : ""}`;

    runServerAiGeneration(promptText, aiQuestionsCount);
  };

  // Trigger for Sub-Mode 2: Copy-Paste Parser
  const handleParsePastedBlock = () => {
    if (!pasteBuffer.trim()) {
      setAiError("Clipboard buffer is currently empty. Please copy and paste some material.");
      return;
    }

    const promptText = `TASK: Read this raw unformatted text block containing questions, notes, or classroom lists. Parse, repair, structure, and convert them safely into standard quiz nodes.
    RAW CLIPPINGS TO EXTRACT FROM:
    """
    ${pasteBuffer}
    """
    INSTRUCTIONS: 
    ${pasteAutoCorrect ? "- Auto-correct clear grammatical typos or factual layout slips." : ""}
    ${pasteExplanations ? "- Ensure insightful pedagogical explanations are written where missing." : "- Inherit standard option-keys accurately."}`;

    runServerAiGeneration(promptText, 5);
  };

  // Trigger for Sub-Mode 3: Document Extract PRO
  const handleExtractProDoc = async () => {
    if (!proDocContent && !proDocPrompt) {
      setAiError("Please drop a file or specify the core query filters first.");
      return;
    }

    setIsGenerating(true);
    setAiError("");

    try {
      const res = await fetch("/api/quizzes/extract-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textContent: proDocContent || proDocPrompt,
          limit: aiQuestionsCount
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to extract questions from document.");
      }

      const data = await res.json();
      if (data && data.questions) {
        if (!title || title === "Untitled Quiz") {
          setTitle(data.title || "Document Extraction Quiz");
        }
        setQuestions([...questions, ...data.questions]);
      } else {
        throw new Error("Peculiar format returned from ai integration.");
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || "An unexpected error blocked Document Extraction.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger for Sub-Mode 4: CSV Template loading
  const handleLoadSampleCSV = () => {
    const rawCSV = `Question,Type,Option A,Option B,Option C,Option D,Correct Answer,Explanation
"Which organelle carries out aerobic cellular respirations?","multiple-choice","Chloroplast","Mitochondria","Ribosome","Golgi Apparatus","Mitochondria","The mitochondria processes chemical bonds to form rich ATP bundles."
"The Atlantic Ocean is the largest ocean on planet Earth.","true-false","True","False","","","False","False. The Pacific Ocean is the largest, spanning over 60 million square miles."
"What is the value of x if 3x - 7 = 14?","short-answer","","","","","7","Add 7 to obtain 21, then divide by 3 to reach 7."`;

    handleProcessCSVContent(rawCSV);
  };

  const handleProcessCSVContent = (text: string) => {
    try {
      const lines = text.split("\n");
      const loaded: Question[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV splitter
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
        if (matches.length < 2) continue;

        const cells = matches.map(m => m.replace(/^"|"$/g, "").trim());
        const qText = cells[0] || "Sample CSV Question";
        const qType = (cells[1] || "multiple-choice").toLowerCase();
        const optA = cells[2] || "";
        const optB = cells[3] || "";
        const optC = cells[4] || "";
        const optD = cells[5] || "";
        const correctVal = cells[6] || "";
        const explanationVal = cells[7] || "Imported from SSlive Template.";

        let optionsList: string[] = [];
        let correctIdx = 0;

        if (qType === "multiple-choice") {
          optionsList = [optA, optB, optC, optD].filter(o => o !== "");
          if (optionsList.length === 0) optionsList = ["A", "B", "C", "D"];
          correctIdx = optionsList.findIndex(o => o.toLowerCase() === correctVal.toLowerCase());
          if (correctIdx === -1) correctIdx = 0;
        } else if (qType === "true-false") {
          optionsList = ["True", "False"];
          correctIdx = correctVal.toLowerCase() === "false" ? 1 : 0;
        } else {
          optionsList = [];
          correctIdx = -1;
        }

        loaded.push({
          text: qText,
          type: qType === "true-false" ? "true-false" : qType === "short-answer" ? "short-answer" : "multiple-choice",
          options: optionsList,
          correctAnswer: correctVal || (qType === "true-false" ? "True" : optA),
          correctOptionIndex: correctIdx,
          explanation: explanationVal
        });
      }

      if (loaded.length > 0) {
        setQuestions([...questions, ...loaded]);
        setExcelSuccess(true);
        setTimeout(() => setExcelSuccess(false), 2500);
      } else {
        alert("We could not find any readable question rows in this file. Double-check layout.");
      }
    } catch (err) {
      console.error(err);
      alert("Error parsing CSV data. Please check standard formatting guidelines.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropCSV = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleProcessCSVContent(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleProcessCSVContent(evt.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSave = () => {
    if (!title.trim() || title === "Untitled Quiz") {
      alert("Please provide an inspiring title for your quiz!");
      return;
    }
    if (questions.length === 0) {
      alert("Please add or generate at least one question to save.");
      return;
    }
    
    // Complete validation pass before writing DB
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].text.trim()) {
        alert(`Question #${i + 1} text is empty.`);
        return;
      }
      if (questions[i].type === "multiple-choice") {
        for (let j = 0; j < 4; j++) {
          const optVal = questions[i].options[j];
          if (!optVal || !optVal.trim()) {
            alert(`Option ${j + 1} for Question #${i + 1} is empty.`);
            return;
          }
        }
      }
    }

    onSave({
      title,
      questions,
    });
  };

  return (
    <div className="bg-neutral-50/65 min-h-screen p-4 md:p-8 font-sans transition-all" id="quiz-creator-root">
      <div className="max-w-7xl mx-auto">
        
        {/* UPPER BANNER / CONTROL TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-3xs">
          <div className="flex items-center gap-4">
            <button 
              onClick={onCancel}
              className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all cursor-pointer border border-slate-150 bg-white shadow-3xs active:scale-95"
              id="btn-back-to-dashboard-custom"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[10px] font-mono font-medium tracking-widest uppercase text-slate-400">Meeting Architect</p>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-lg font-display font-semibold text-slate-900">
                  {existingQuiz ? "Edit SSlive Quiz" : "Create SSlive Quiz"}
                </h1>
                <span className="text-[8px] bg-indigo-50 border border-indigo-100/50 text-indigo-700 tracking-wider font-bold px-1.5 py-0.5 rounded leading-none uppercase">Inquiry Setup</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={onCancel}
              className="flex-1 md:flex-none px-4 py-2 border border-slate-200 text-slate-650 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold cursor-pointer active:scale-98"
              id="btn-cancel-create"
            >
              Cancel
            </button>
            
            {/* Dynamic AI toggle bubble bar if not currently open */}
            {!aiSidebarOpen && (
              <button
                onClick={() => setAiSidebarOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-98 cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500 animate-pulse" />
                <span>AI Co-Pilot</span>
              </button>
            )}

            <button 
              onClick={handleSave}
              className="flex-1 md:flex-none px-5 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-slate-100 active:scale-98"
              id="btn-save-quiz"
            >
              <Save size={14} />
              Save Quiz
            </button>
          </div>
        </div>

        {/* WORKSPACE LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTAINER: THE QUIZ CANVAS (MANUAL EDITOR) */}
          <div className={`space-y-6 transition-all duration-300 ${
            aiSidebarOpen ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12 max-w-4xl mx-auto w-full"
          }`}>
            
            {/* LARGE QUIZ TITLE BLOCK */}
            <div className="bg-white p-6 rounded-2xl shadow-3xs border border-slate-200/80 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                <FileText size={20} />
              </div>
              <div className="flex-grow">
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quiz Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Cellular Biology Lesson, Geometry Review Master, etc."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-base font-semibold border-b border-transparent focus:border-indigo-400 py-1 focus:outline-hidden text-slate-800 font-display transition-all"
                  id="quiz-title-input"
                />
              </div>
            </div>

            {/* QUESTIONS LIST CANVAS */}
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Evaluation Nodes ({questions.length})
                </h3>
                {questions.length > 0 && (
                  <button 
                    onClick={() => setQuestions([])}
                    className="text-[10px] font-mono font-bold text-red-500 hover:text-red-700 bg-red-50 border border-red-100 hover:border-red-200 px-2.5 py-1 rounded transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* EMPTY CANVAS PLACEHOLDER (Matches Screenshot 2 Left Grid) */}
              {questions.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-250 py-16 px-6 rounded-3xl text-center shadow-3xs flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-indigo-50 rounded-full blur-2xl opacity-60" />
                  <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-50 rounded-full blur-2xl opacity-60" />
                  
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-3xs">
                    <Plus size={22} className="animate-pulse" />
                  </div>
                  
                  <h3 className="text-base font-display font-bold text-slate-800">Add Blank Question</h3>
                  <p className="text-xs text-slate-400 max-w-sm mt-2 leading-relaxed">
                    Begin manual writing, or leverage the expert **AI Assisted Co-Pilot** on your right to compile interactive debates instantly!
                  </p>

                  {/* Option block cards inside central empty state */}
                  <div className="grid grid-cols-1 sm:grid-cols-7 gap-3 w-full max-w-4xl mt-6">
                    <button 
                      onClick={() => addQuestion("multiple-choice")}
                      className="p-4 bg-slate-50 hover:bg-indigo-50/40 border border-slate-150 hover:border-indigo-200 rounded-2xl text-center group cursor-pointer transition-all active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-mono font-bold text-sm mb-2 group-hover:bg-indigo-100">
                        A
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Multiple Choice</span>
                    </button>

                    <button 
                      onClick={() => addQuestion("true-false")}
                      className="p-4 bg-slate-50 hover:bg-sky-50/40 border border-slate-150 hover:border-sky-200 rounded-2xl text-center group cursor-pointer transition-all active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 mx-auto flex items-center justify-center text-xs mb-2 group-hover:bg-sky-100">
                        <Check size={16} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">True / False</span>
                    </button>

                    <button 
                      onClick={() => addQuestion("short-answer")}
                      className="p-4 bg-slate-50 hover:bg-emerald-50/40 border border-slate-150 hover:border-emerald-250 rounded-2xl text-center group cursor-pointer transition-all active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center text-xs mb-2 group-hover:bg-emerald-100">
                        <FileText size={16} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Short Answer</span>
                    </button>
                    
                    <button 
                      onClick={() => addQuestion("poll")}
                      className="p-4 bg-slate-50 hover:bg-rose-50/40 border border-slate-150 hover:border-rose-200 rounded-2xl text-center group cursor-pointer transition-all active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 mx-auto flex items-center justify-center text-xs mb-2 group-hover:bg-rose-100">
                        <PieChart size={16} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Live Poll</span>
                    </button>

                    <button 
                      onClick={() => addQuestion("scale")}
                      className="p-4 bg-slate-50 hover:bg-cyan-50/40 border border-slate-150 hover:border-cyan-200 rounded-2xl text-center group cursor-pointer transition-all active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 mx-auto flex items-center justify-center text-xs mb-2 group-hover:bg-cyan-100">
                        <SlidersHorizontal size={16} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Scale / Rate</span>
                    </button>

                    <button 
                      onClick={() => addQuestion("word-cloud")}
                      className="p-4 bg-slate-50 hover:bg-violet-50/40 border border-slate-150 hover:border-violet-200 rounded-2xl text-center group cursor-pointer transition-all active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 mx-auto flex items-center justify-center text-xs mb-2 group-hover:bg-violet-100">
                        <Cloud size={16} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Word Cloud</span>
                    </button>

                    <button 
                      onClick={() => addQuestion("puzzle-order")}
                      className="p-4 bg-slate-50 hover:bg-amber-50/40 border border-slate-150 hover:border-amber-200 rounded-2xl text-center group cursor-pointer transition-all active:scale-98"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 mx-auto flex items-center justify-center text-xs mb-2 group-hover:bg-amber-100">
                        <Layers size={16} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700">Puzzle / Order</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* RENDER ACTIVE QUESTIONS LIST */
                <div className="space-y-4">
                  {questions.map((q, qIndex) => (
                    <div key={qIndex} className="bg-white p-6 rounded-2xl shadow-3xs border border-slate-200/80 group relative transition-all hover:shadow-xs hover:border-slate-300">
                      
                      {/* Delete node button */}
                      <button 
                        onClick={() => removeQuestion(qIndex)}
                        className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-red-50 text-slate-450 hover:text-red-500 rounded-lg opacity-60 group-hover:opacity-100 transition-all border border-slate-100 cursor-pointer relative z-10 pointer-events-auto"
                        title="Delete Question"
                      >
                        <Trash size={14} />
                      </button>

                      <div className="flex items-center gap-2 mb-4">
                        <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-mono font-bold border border-slate-700 leading-none">
                          {qIndex + 1}
                        </span>
                        <span className="text-[9px] font-mono font-extrabold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100/50 px-2.5 py-0.5 rounded leading-none">
                          {q.type}
                        </span>
                      </div>

                      {/* Question Text Input */}
                      <textarea 
                        placeholder="Draft standard, thought-provoking classroom prompt text..."
                        value={q.text}
                        onChange={(e) => updateQuestionText(qIndex, e.target.value)}
                        rows={2}
                        className="w-full border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 focus:outline-hidden rounded-xl p-3.5 text-slate-750 text-xs mb-4"
                      />

                      {/* QUESTION TYPES FIELDS OPTIONS */}
                      {q.type === "multiple-choice" && (
                        <div className="space-y-3 pl-3 border-l-2 border-slate-100">
                          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">Options & Set Correct Answer</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-150/80 hover:border-slate-200 transition-colors">
                                <button 
                                  onClick={() => updateMcCorrectIndex(qIndex, optIndex)}
                                  className={`w-6 h-6 rounded-full border text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                    q.correctOptionIndex === optIndex 
                                      ? "bg-emerald-500 border-emerald-500 text-white shadow-xs" 
                                      : "border-slate-300 bg-white hover:border-emerald-400 text-slate-400"
                                  }`}
                                >
                                  {q.correctOptionIndex === optIndex ? <Check size={11} /> : String.fromCharCode(65 + optIndex)}
                                </button>
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateMcOption(qIndex, optIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                  className="w-full bg-transparent text-xs text-slate-700 focus:outline-hidden py-1 border-b border-transparent focus:border-indigo-400"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === "true-false" && (
                        <div className="flex gap-4 pl-3 border-l-2 border-slate-100 mb-4">
                          {["True", "False"].map((item, index) => (
                            <button 
                              key={item}
                              onClick={() => updateTfCorrectIndex(qIndex, index)}
                              className={`flex-1 py-2.5 px-4 rounded-xl border font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                                q.correctOptionIndex === index 
                                  ? "bg-indigo-50/40 border-indigo-400 text-indigo-700" 
                                  : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                q.correctOptionIndex === index ? "border-indigo-500 bg-indigo-500 text-white" : "border-slate-300 bg-white"
                              }`}>
                                {q.correctOptionIndex === index && <div className="w-1.5 h-1.5 rounded-full bg-white animate-scale-in" />}
                              </div>
                              {item}
                            </button>
                          ))}
                        </div>
                      )}

                      {q.type === "short-answer" && (
                        <div className="pl-3 border-l-2 border-slate-100 mb-4 space-y-1.5">
                          <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Accepted Key-Expression</label>
                          <input 
                            type="text"
                            placeholder="e.g. Mitochondria (Evaluation checking is case-insensitive)"
                            value={q.correctAnswer}
                            onChange={(e) => updateSaCorrectValue(qIndex, e.target.value)}
                            className="w-full border border-slate-200 focus:border-indigo-400 focus:outline-hidden rounded-xl px-4 py-2 text-xs text-slate-700"
                          />
                        </div>
                      )}

                      {q.type === "poll" && (
                        <div className="space-y-3 pl-3 border-l-2 border-rose-100 mb-4">
                          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1.5 font-semibold">Poll Options (No Correct Answer)</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-150/80 hover:border-slate-200 transition-colors">
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 border-slate-300 bg-white font-mono text-[9px] text-slate-400 font-bold`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateMcOption(qIndex, optIndex, e.target.value)}
                                  placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                                  className="w-full bg-transparent text-xs text-slate-700 focus:outline-hidden py-1 border-b border-transparent focus:border-rose-400"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.type === "scale" && (
                        <div className="pl-3 border-l-2 border-cyan-100 mb-4 space-y-1.5 py-2">
                          <p className="text-[10px] text-slate-500 font-medium">Students will rate on a scale from 1 to 5.</p>
                        </div>
                      )}

                      {q.type === "word-cloud" && (
                        <div className="pl-3 border-l-2 border-violet-100 mb-4 space-y-1.5 py-2">
                          <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5">
                            <Cloud size={12} className="text-violet-500" />
                            Students submit one word — popular words grow larger on the live cloud.
                          </p>
                        </div>
                      )}

                      {q.type === "puzzle-order" && (
                        <div className="space-y-2.5 pl-3 border-l-2 border-amber-100 mb-4">
                          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Items in correct order (will be shuffled for students)</p>
                          <div className="space-y-2">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2.5 bg-amber-50/30 p-2 rounded-xl border border-amber-100/60">
                                <span className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-700 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {optIndex + 1}
                                </span>
                                <input 
                                  type="text"
                                  value={opt}
                                  onChange={(e) => updateMcOption(qIndex, optIndex, e.target.value)}
                                  placeholder={`Step ${optIndex + 1}`}
                                  className="w-full bg-transparent text-xs text-slate-700 focus:outline-hidden py-1 border-b border-transparent focus:border-amber-400"
                                />
                                {q.options.length > 2 && (
                                  <button
                                    onClick={() => {
                                      const updated = [...questions];
                                      updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
                                      setQuestions(updated);
                                    }}
                                    className="text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Remove step"
                                  >
                                    <X size={13} />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const updated = [...questions];
                                updated[qIndex].options = [...updated[qIndex].options, ""];
                                setQuestions(updated);
                              }}
                              className="text-[10px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 px-2 py-1"
                            >
                              <Plus size={11} /> Add step
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Post-Question Advisor Advice */}
                      <div className="mt-4 bg-amber-50/20 p-4 rounded-xl border border-dashed border-amber-200/60">
                        <label className="block text-[8px] font-mono text-amber-700 uppercase tracking-widest mb-1 font-bold">Post-Question SSlive Insights</label>
                        <input 
                          type="text"
                          placeholder="e.g. Inquiry insight explaining photosynthesis structures..."
                          value={q.explanation}
                          onChange={(e) => updateQuestionExplanation(qIndex, e.target.value)}
                          className="w-full bg-transparent text-xs text-slate-750 focus:outline-hidden border-b border-transparent focus:border-amber-400/50 py-0.5"
                        />
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK APPEND QUESTION BAR */}
            <div className="bg-slate-100 border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">Append:</span>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => addQuestion("multiple-choice")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  <Plus size={13} />
                  <span>MC Option</span>
                </button>
                <button 
                  onClick={() => addQuestion("true-false")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  <Plus size={13} />
                  <span>True/False</span>
                </button>
                <button 
                  onClick={() => addQuestion("short-answer")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  <Plus size={13} />
                  <span>Short Text</span>
                </button>
                <button 
                  onClick={() => addQuestion("poll")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-rose-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  <Plus size={13} />
                  <span>Poll</span>
                </button>
                <button 
                  onClick={() => addQuestion("scale")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-cyan-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  <Plus size={13} />
                  <span>Scale</span>
                </button>
                <button 
                  onClick={() => addQuestion("word-cloud")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-violet-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  <Cloud size={13} />
                  <span>Word Cloud</span>
                </button>
                <button 
                  onClick={() => addQuestion("puzzle-order")}
                  className="flex-1 sm:flex-none px-4 py-2 bg-white hover:bg-amber-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-3xs"
                >
                  <Layers size={13} />
                  <span>Puzzle</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT CONTAINER: "AI ASSISTED" WORKSPACE PANEL */}
          {aiSidebarOpen && (
            <div className="lg:col-span-5 xl:col-span-4 bg-white border border-slate-200 rounded-3xl shadow-lg sticky top-24 overflow-hidden z-10 flex flex-col" id="ai-assisted-panel">
              
              {/* Sidebar Header Title */}
              <div className="p-4 border-b border-indigo-50/80 bg-indigo-50/20 flex justify-between items-start gap-4">
                <div>
                  <span className="inline-flex gap-1 items-center font-mono text-[9px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded leading-none border border-indigo-150 tracking-widest">
                    <Sparkles size={9} className="text-amber-500 animate-spin" /> AI Assisted
                  </span>
                  <h4 className="text-sm font-display font-bold text-slate-900 mt-2 leading-none">
                    {aiSubMode === "ai" && "Generate Questions"}
                    {aiSubMode === "import-paste" && "Messy Copy-Paste Parser"}
                    {aiSubMode === "import-pro" && "PRO Document Extract"}
                    {aiSubMode === "import-excel" && "Excel Spreadsheet Ingest"}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {aiSubMode === "ai" && "Instantly synthesize highly effective quiz formats using our ai integration."}
                    {aiSubMode === "import-paste" && "Clippings dump converter to format messy items on the fly."}
                    {aiSubMode === "import-pro" && "AI scanning tools to read pages and index exam nodes."}
                    {aiSubMode === "import-excel" && "Upload custom spreadsheets corresponding to roster lists."}
                  </p>
                </div>
                
                <button 
                  onClick={() => setAiSidebarOpen(false)}
                  className="p-1 hover:bg-slate-100 text-slate-450 hover:text-slate-800 rounded-md transition-colors cursor-pointer shrink-0"
                  title="Close AI Assistant Panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Sidebar Ingest sub-mode Tab selectors matching Screenshot 1 groupings */}
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-150 flex gap-1.5 overflow-x-auto select-none no-scrollbar">
                
                <button 
                  onClick={() => { setAiSubMode("ai"); setAiError(""); }}
                  className={`px-3 py-1.5 rounded-xl font-bold font-display text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0 border ${
                    aiSubMode === "ai" 
                      ? "bg-slate-900 text-white border-transparent shadow-3xs" 
                      : "bg-white text-slate-550 border-slate-200 hover:text-slate-800 hover:border-slate-300"
                  }`}
                  title="AI Synthesizer"
                >
                  <Sparkles size={11} className={aiSubMode === "ai" ? "text-amber-300" : "text-amber-500"} />
                  <span>Synthesizer</span>
                </button>

                <button 
                  onClick={() => { setAiSubMode("import-paste"); setAiError(""); }}
                  className={`px-3 py-1.5 rounded-xl font-bold font-display text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0 border ${
                    aiSubMode === "import-paste" 
                      ? "bg-slate-900 text-white border-transparent shadow-3xs" 
                      : "bg-white text-slate-550 border-slate-200 hover:text-slate-800 hover:border-slate-300"
                  }`}
                  title="Pasted Text Ingestion"
                >
                  <FileText size={11} />
                  <span>Paste Parser</span>
                </button>

                <button 
                  onClick={() => { setAiSubMode("import-pro"); setAiError(""); }}
                  className={`px-3 py-1.5 rounded-xl font-bold font-display text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0 border relative ${
                    aiSubMode === "import-pro" 
                      ? "bg-slate-900 text-white border-transparent shadow-3xs" 
                      : "bg-white text-slate-550 border-slate-200 hover:text-slate-800 hover:border-slate-300"
                  }`}
                  title="Document OCR / Scan PRO"
                >
                  <FileUp size={11} />
                  <span>Doc Scan</span>
                  <span className="absolute -top-1 -right-1 text-[6px] bg-amber-500 text-white px-0.5 rounded-sm scale-90">PRO</span>
                </button>

                <button 
                  onClick={() => { setAiSubMode("import-excel"); setAiError(""); }}
                  className={`px-3 py-1.5 rounded-xl font-bold font-display text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0 border ${
                    aiSubMode === "import-excel" 
                      ? "bg-slate-900 text-white border-transparent shadow-3xs" 
                      : "bg-white text-slate-550 border-slate-200 hover:text-slate-800 hover:border-slate-300"
                  }`}
                  title="Spreadsheets Import"
                >
                  <FileSpreadsheet size={11} />
                  <span>Template List</span>
                </button>
              </div>

              {/* Sidebar Content Scrollable Panels */}
              <div className="p-5 space-y-5 bg-white overflow-y-auto max-h-[64vh]">
                
                {/* Visual error box if prompt blocked */}
                {aiError && (
                  <div className="bg-red-50 text-red-750 text-[10px] p-3 border border-red-100 rounded-xl flex gap-2.5 items-start font-mono font-medium animate-shake">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Execution Error:</span>
                      <p className="mt-0.5">{aiError}</p>
                    </div>
                  </div>
                )}

                {/* =======================================================
                    TAB 1: SYNTHESIZE QUESTIONS ON AI (Screenshot 2)
                    ======================================================= */}
                {aiSubMode === "ai" && (
                  <div className="space-y-4 fade-in-up">
                    
                    {/* Prompt input with character limit */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider">Cover Topic Focus</label>
                        <span className="text-[9px] font-mono text-slate-400 font-bold">{aiDescribeCover.length} / 3000</span>
                      </div>
                      <textarea 
                        rows={3}
                        maxLength={3000}
                        value={aiDescribeCover}
                        onChange={(e) => setAiDescribeCover(e.target.value)}
                        placeholder="e.g., The solar system and natural satellites, cellular respiration equations, WWII turning point battles..."
                        className="w-full text-xs p-3 border border-slate-200 focus:border-indigo-400 focus:outline-hidden rounded-xl bg-slate-50/30 text-slate-700"
                        id="ai-topic-prompt-desc"
                      />
                    </div>

                    {/* Drag and Drop Document context [PRO] inside Synthesis Panel */}
                    <div>
                      <label className="block text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider mb-2 flex items-center gap-1.5">
                        <span>Attach Companion Material</span>
                        <span className="text-[7px] font-mono font-black tracking-widest uppercase bg-amber-500 text-white px-1 py-0.5 rounded-sm">PRO</span>
                      </label>

                      {draggedFileName ? (
                        <div className="p-3.5 bg-indigo-50/30 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileText size={16} className="text-indigo-600 shrink-0" />
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-slate-700 truncate">{draggedFileName}</p>
                              <p className="text-[8px] text-teal-600 font-bold mt-0.5 leading-none">Companion file successfully indexed!</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => { setDraggedFileName(""); setDraggedContent(""); }}
                            className="p-1 hover:bg-slate-100/50 rounded text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onDragOver={handleDragOver}
                          onDrop={(e) => {
                            e.preventDefault();
                            const f = e.dataTransfer.files[0];
                            if (f) handleRealFileUpload("ai", f);
                          }}
                          onClick={() => handleSimulateFileUpload("ai", "classroom_cheat_sheet_notes.txt", "940 KB", "Detailed notes about standard chemistry and electron valency variables.")}
                          className="border border-dashed border-slate-250 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/10 transition-all select-none"
                        >
                          {dragProgress !== null ? (
                            <div className="space-y-2 py-1">
                              <RefreshCw size={18} className="animate-spin text-indigo-600 mx-auto" />
                              <p className="text-[10px] font-bold text-slate-650">Ingesting PDF ({dragProgress}%)</p>
                              <div className="w-full h-1 bg-slate-200 rounded-full max-w-xs mx-auto overflow-hidden">
                                <div className="h-full bg-indigo-600" style={{ width: `${dragProgress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <>
                              <FileUp size={18} className="text-slate-400 mx-auto mb-1.5" />
                              <p className="text-[10px] font-bold text-slate-750">Drag a companion file or click to upload</p>
                              <p className="text-[8px] text-slate-400 mt-1 uppercase tracking-wider font-medium">Max 20MB • .pdf .txt .csv .jpg .png</p>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Target grade level cohort picker */}
                    <div>
                      <label className="block text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Cohorts Level</label>
                      <select 
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full text-xs p-2.5 border border-slate-200 focus:border-indigo-400 focus:outline-hidden rounded-xl bg-white text-slate-700 font-medium"
                      >
                        <option>Elementary School</option>
                        <option>Middle School</option>
                        <option>High School</option>
                        <option>Undergraduate College</option>
                        <option>Graduate School</option>
                      </select>
                    </div>

                    {/* Checkboxes Checklist for Question Types (Exact Screenshot 2 Types) */}
                    <div>
                      <label className="block text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider mb-2">Question Type</label>
                      <div className="space-y-2 bg-slate-50/35 p-3 rounded-xl border border-slate-150">
                        
                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium group select-none">
                          <input 
                            type="checkbox"
                            checked={aiTypesSelected["multiple-choice"]}
                            onChange={(e) => setAiTypesSelected({ ...aiTypesSelected, "multiple-choice": e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="group-hover:text-slate-900">Multiple Choice</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium group select-none">
                          <input 
                            type="checkbox"
                            checked={aiTypesSelected["true-false"]}
                            onChange={(e) => setAiTypesSelected({ ...aiTypesSelected, "true-false": e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="group-hover:text-slate-900">True / False</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-700 font-medium group select-none">
                          <input 
                            type="checkbox"
                            checked={aiTypesSelected["short-answer"]}
                            onChange={(e) => setAiTypesSelected({ ...aiTypesSelected, "short-answer": e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="group-hover:text-slate-900">Short Answer</span>
                        </label>

                      </div>
                    </div>

                    {/* Animated custom true-false toggle for explanations */}
                    <div className="flex items-center justify-between p-3.5 bg-indigo-50/15 rounded-xl border border-indigo-100/50">
                      <div>
                        <p className="text-xs font-semibold text-slate-750">Generate detailed explanations</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">Produce Inquiry context for post-question review.</p>
                      </div>
                      <button 
                        onClick={() => setAiGenerateExplanations(!aiGenerateExplanations)}
                        className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        title="Toggle Explanations"
                      >
                        {aiGenerateExplanations ? (
                          <ToggleRight size={38} className="text-indigo-600" />
                        ) : (
                          <ToggleLeft size={38} className="text-slate-300" />
                        )}
                      </button>
                    </div>

                    {/* Number of Questions pill slider/button selector */}
                    <div>
                      <label className="block text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider mb-2">Number of Questions</label>
                      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
                        {[5, 10, 15].map((num) => (
                          <button
                            key={num}
                            onClick={() => setAiQuestionsCount(num)}
                            className={`py-1.5 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                              aiQuestionsCount === num 
                                ? "bg-white text-slate-900 shadow-3xs border border-transparent" 
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* PRESET FAST TOPICS (Fast seed trigger values) */}
                    <div>
                      <p className="text-[10px] font-mono font-extrabold uppercase text-slate-40 tracking-wider mb-2">Seed presets</p>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_TOPICS.map((pt) => (
                          <button 
                            key={pt.name}
                            onClick={() => {
                              setAiDescribeCover(pt.name);
                              setAiError("");
                            }}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-slate-350 hover:bg-slate-100/80 rounded-lg text-[10px] font-semibold text-slate-600 flex items-center gap-1 cursor-pointer"
                          >
                            <span>{pt.icon}</span>
                            <span>{pt.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ACTION BLUE GENERATE AT BOTTOM PANEL */}
                    <div className="pt-3 border-t border-slate-100">
                      <button 
                        onClick={handleGenerateQuestions}
                        disabled={isGenerating}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 hover:shadow-md cursor-pointer active:scale-98 leading-none"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Engaging SSlive Brain (5-10s)...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} className="text-amber-300 animate-bounce" />
                            <span>Generate</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                )}

                {/* =======================================================
                    TAB 2: COPY-PASTE NOTES PARSER (Ingests unstructured lines)
                    ======================================================= */}
                {aiSubMode === "import-paste" && (
                  <div className="space-y-4 fade-in-up">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider">Paste Questions / Lecture Excerpts</label>
                      <button 
                        onClick={() => {
                          setPasteBuffer(`1. Identify the molecule that holds our core genetic memory codes.
- RNA
- Helix-peptide
- DNA (Correct)
- Cytosil-protein

2. Mitosis is standard cellular division.
- True (Correct)
- False`);
                        }}
                        className="text-[9px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-150 rounded px-2 py-0.5"
                      >
                        Load Paste Guide
                      </button>
                    </div>

                    <textarea 
                      rows={6}
                      value={pasteBuffer}
                      onChange={(e) => setPasteBuffer(e.target.value)}
                      placeholder="Paste unstructured textbook clippings or dirty copy-pastes containing exam lines... Our AI parses them straight into interactive cards."
                      className="w-full text-xs p-3 font-mono border border-slate-200 focus:border-indigo-400 focus:outline-hidden rounded-xl bg-slate-50/20 text-slate-700"
                    />

                    {/* Options checkboxes */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-750 font-medium select-none">
                        <input 
                          type="checkbox"
                          checked={pasteAutoCorrect}
                          onChange={(e) => setPasteAutoCorrect(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        <span>Check grammatical/factual alignment</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-750 font-medium select-none">
                        <input 
                          type="checkbox"
                          checked={pasteExplanations}
                          onChange={(e) => setPasteExplanations(e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600"
                        />
                        <span>Auto-write post-question advice notes</span>
                      </label>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={handleParsePastedBlock}
                        disabled={isGenerating}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Parsing with AI...</span>
                          </>
                        ) : (
                          <>
                            <Clipboard size={13} />
                            <span>AI Parse & Import</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* =======================================================
                    TAB 3: PRO DOCUMENT OCR SCANNING / SEGMENT PARSER 
                    ======================================================= */}
                {aiSubMode === "import-pro" && (
                  <div className="space-y-4 fade-in-up">
                    <span className="inline-flex items-center gap-1 text-[8px] font-mono bg-emerald-500 text-white px-2 py-0.5 rounded leading-none font-bold uppercase tracking-widest">
                      Enterprise Scan Tool
                    </span>

                    {proDocName ? (
                      <div className="p-4 bg-violet-50/40 border border-violet-200/80 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                            <FileUp size={16} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-slate-800 truncate">{proDocName}</p>
                            <p className="text-[8px] text-violet-600 font-extrabold uppercase mt-0.5 leading-none">Scanned & fully tokenized!</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setProDocName(""); setProDocContent(""); }}
                          className="p-1 hover:bg-violet-100 rounded text-violet-400 hover:text-violet-700 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div 
                        onDragOver={handleDragOver}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files[0];
                          if (f) handleRealFileUpload("pro-doc", f);
                        }}
                        onClick={() => handleSimulateFileUpload("pro-doc", "medical_cardiology_notes.txt", "1.1 MB", "High density cardiologist clinical charts and cardiovascular variables.")}
                        className="border border-dashed border-slate-250 hover:border-violet-400 p-6 text-center rounded-2xl bg-slate-50/40 hover:bg-slate-100/50 cursor-pointer transition-all select-none"
                      >
                        {proDocProgress !== null ? (
                          <div className="space-y-2 py-2">
                            <RefreshCw size={20} className="animate-spin text-violet-600 mx-auto" />
                            <p className="text-[11px] font-bold text-slate-700">Analyzing Document ({proDocProgress}%)</p>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full max-w-xs mx-auto overflow-hidden">
                              <div className="h-full bg-violet-600" style={{ width: `${proDocProgress}%` }} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <FileUp size={22} className="text-slate-400 hover:text-slate-600 mx-auto mb-2" />
                            <p className="text-[11px] font-bold text-slate-750">Drop clinical slide, textbook doc or exam sheet</p>
                            <p className="text-[8px] text-slate-400 uppercase tracking-widest mt-1.5 font-bold leading-normal">SUPPORTED: PDF • JPEG • PNG • CSV • TXT</p>
                          </>
                        )}
                      </div>
                    )}

                    {/* Scanning prompts filters focus */}
                    <div>
                      <label className="block text-[10px] font-mono font-extrabold uppercase text-slate-400 tracking-wider mb-1.5">Scanning Focus Guidelines</label>
                      <input 
                        type="text"
                        value={proDocPrompt}
                        onChange={(e) => setProDocPrompt(e.target.value)}
                        placeholder="e.g. Focus on Cardiovascular equations (Section 2.4)"
                        className="w-full text-xs p-2.5 border border-slate-200 focus:border-indigo-400 focus:outline-hidden rounded-xl bg-slate-50/20 text-slate-700"
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={handleExtractProDoc}
                        disabled={isGenerating || (!proDocContent && !proDocPrompt)}
                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={13} className="animate-spin animate-spin-reverse" />
                            <span>AI Scanning & Extracting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} className="text-amber-300" />
                            <span>AI Scan & Ingest</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* =======================================================
                    TAB 4: SPREADSHEETS IMPORT (Real CSV Row parser)
                    ======================================================= */}
                {aiSubMode === "import-excel" && (
                  <div className="space-y-4 fade-in-up">
                    <div className="p-4 bg-teal-50/40 border border-teal-200/50 rounded-2xl space-y-3.5">
                      <h5 className="text-[11px] font-bold text-teal-850 flex items-center gap-1.5 font-display">
                        <FileSpreadsheet size={15} /> Standard Ingestion Layout Map
                      </h5>
                      <p className="text-[10px] text-teal-750 leading-relaxed font-semibold">
                        Column sequencing required: **Question, Type, Option A, Option B, Option C, Option D, Correct Answer, Explanation**.
                      </p>
                      
                      <div className="flex gap-2.5">
                        <button 
                          onClick={handleLoadSampleCSV}
                          className="flex-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-bold transition-colors shadow-3xs cursor-pointer text-center flex items-center justify-center gap-1"
                        >
                          <Plus size={12} /> Load CSV Sample
                        </button>
                        
                        <a 
                          href="data:text/csv;charset=utf-8,Question,Type,Option%20A,Option%20B,Option%20C,Option%20D,Correct%20Answer,Explanation%0A" 
                          download="SSlive_Quiz_Template.csv"
                          className="flex-1 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-650 rounded-xl text-[10px] font-bold transition-colors text-center flex items-center justify-center gap-1"
                        >
                          <Download size={11} /> Download Layout
                        </a>
                      </div>
                    </div>

                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDropCSV}
                      onClick={handleTriggerFileInput}
                      className="border border-dashed border-slate-250 hover:border-teal-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/40 hover:bg-teal-50/10 transition-all select-none"
                    >
                      <FileSpreadsheet size={22} className="text-slate-400 mx-auto mb-2.5" />
                      <p className="text-[11px] font-bold text-slate-750">Drag custom template CSV or click to scan</p>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1 leading-normal">Reads standard .csv spreadsheets files</p>
                      
                      <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        accept=".csv"
                        className="hidden"
                      />
                    </div>

                    {excelSuccess && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl flex items-center gap-2 text-[10px] font-semibold animate-fade-in">
                        <Check size={14} className="text-emerald-500 shrink-0" />
                        <span>Spreadsheet rows successfully compiled and combined with active list!</span>
                      </div>
                    )}
                  </div>
                )}

              </div>
              
              {/* Sidebar footer quote helper */}
              <div className="p-4 bg-slate-50 border-t border-slate-150 text-center text-[9px] font-mono text-slate-400 flex items-center justify-center gap-1.5 leading-none select-none">
                <Info size={11} className="text-indigo-500" />
                <span>Powered by SSlive Brain | Standard CJS Secure</span>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
