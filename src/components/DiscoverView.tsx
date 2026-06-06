import React, { useState, useMemo } from "react";
import { 
  Search, 
  Download, 
  CheckCircle2, 
  Layers, 
  Sparkles 
} from "lucide-react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Quiz } from "../types";

// Curated Educational Activity Collections
const CURATED_COLL = [
  {
    id: "curated-devops-cicd",
    title: "Continuous Integration & Deployment (CI/CD)",
    category: "DevOps",
    description: "Formative evaluation on creating pipelines, automation, containerization with Docker, and Kubernetes fundamentals.",
    questions: [
      {
        text: "Which of the following describes the key difference between Continuous Delivery and Continuous Deployment?",
        type: "multiple-choice" as const,
        options: [
          "A. Continuous Delivery pushes to prod automatically, Deployment requires manual approval",
          "B. Continuous Deployment pushes to prod automatically, Delivery requires manual approval",
          "C. Continuous Delivery uses Jenkins, Continuous Deployment uses GitHub Actions",
          "D. There is no fundamental difference between the two concepts"
        ],
        correctAnswer: "B",
        correctOptionIndex: 1,
        explanation: "Continuous Deployment automatically deploys every validated change directly to production without manual gatekeeping, whereas Continuous Delivery prepares the code for release but requires a final manual trigger."
      },
      {
        text: "What port does fundamentally secure SSH traffic operate on by default?",
        type: "short-answer" as const,
        options: [],
        correctAnswer: "22",
        correctOptionIndex: -1,
        explanation: "SSH defaults to port 22. It encrypts the connection between the client and server."
      },
      {
        text: "In Kubernetes, a Pod is the smallest deployable unit of computing that you can create and manage.",
        type: "true-false" as const,
        options: ["True", "False"],
        correctAnswer: "True",
        correctOptionIndex: 0,
        explanation: "A Pod represents a single instance of a running process in your cluster and is the most basic building block in the Kubernetes architecture."
      }
    ]
  },
  {
    id: "curated-cloud-aws-gcp",
    title: "Cloud Infrastructure & Serverless",
    category: "Cloud",
    description: "Test your knowledge on scalable infrastructure, managed databases, and serverless execution models.",
    questions: [
      {
        text: "Which cloud service model provides the highest level of abstraction to the developer, removing all OS management and server patching?",
        type: "multiple-choice" as const,
        options: [
          "A. Infrastructure as a Service (IaaS)",
          "B. Platform as a Service (PaaS)",
          "C. Container as a Service (CaaS)",
          "D. Software as a Service (SaaS)"
        ],
        correctAnswer: "B",
        correctOptionIndex: 1,
        explanation: "PaaS handles the underlying infrastructure, OS, and runtimes, allowing developers to focus solely on code and application logic."
      },
      {
        text: "What command line tool is standard for provisioning infrastructure as code across multiple cloud providers?",
        type: "short-answer" as const,
        options: [],
        correctAnswer: "terraform",
        correctOptionIndex: -1,
        explanation: "Terraform by HashiCorp is the industry standard for declaring and managing cross-cloud infrastructure using code (IaC)."
      }
    ]
  },
  {
    id: "curated-ai-ml-basics",
    title: "AI & Large Language Models",
    category: "AI",
    description: "Explore the basics of machine learning, transformer architectures, and RAG pipelines.",
    questions: [
      {
        text: "In the context of Large Language Models, what does 'RAG' stand for?",
        type: "multiple-choice" as const,
        options: [
          "A. Recursive Adversarial Generation",
          "B. Retrieval-Augmented Generation",
          "C. Real-time Arithmetic Graph",
          "D. Raw Artificial Guessing"
        ],
        correctAnswer: "B",
        correctOptionIndex: 1,
        explanation: "Retrieval-Augmented Generation (RAG) grounds language models by querying external databases or document stores to supplement their internal knowledge before generating an answer."
      }
    ]
  }
];

interface DiscoverViewProps {
  teacherUid: string;
  onImportSuccess: (importedQuizTitle: string) => void;
}

export default function DiscoverView({ teacherUid, onImportSuccess }: DiscoverViewProps) {
  const [discoverSearchQuery, setDiscoverSearchQuery] = useState("");
  const [selectedDiscoverCategory, setSelectedDiscoverCategory] = useState("All");
  const [importingQuizId, setImportingQuizId] = useState<string | null>(null);

  const filteredDiscoverCollection = useMemo(() => {
    let list = CURATED_COLL;
    if (selectedDiscoverCategory !== "All") {
      list = list.filter(item => item.category === selectedDiscoverCategory);
    }
    if (discoverSearchQuery.trim()) {
      const q = discoverSearchQuery.toLowerCase();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) || 
        item.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [discoverSearchQuery, selectedDiscoverCategory]);

  const handleImportCuratedQuiz = async (item: typeof CURATED_COLL[0]) => {
    setImportingQuizId(item.id);
    try {
      const id = doc(collection(db, "quizzes")).id;
      const importedQuiz: Quiz = {
        id,
        title: `${item.title} (Curated)`,
        teacherId: teacherUid,
        questions: item.questions,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "quizzes", id), importedQuiz);
      
      setTimeout(() => {
        setImportingQuizId(null);
        onImportSuccess(item.title);
      }, 700);
    } catch (e) {
      console.error(e);
      setImportingQuizId(null);
      alert("Failed to import quiz. Please check database permissions.");
    }
  };

  return (
    <div className="space-y-8 fade-in-up" id="discover-view-root">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.015)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-700 uppercase tracking-widest px-2 py-0.5 rounded-sm border border-amber-100">Marketplace</span>
            <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider px-2 py-0.5 rounded-sm border border-indigo-100">COMMUNITY EDITIONS</span>
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 mt-2">Discover Curriculum Decks</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">Browse pre-cooked supreme activities crafted by scholar communities. One click imports directly into your personal repository!</p>
        </div>
        
        {/* Visual Search input in header */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search size={14} />
          </span>
          <input 
            type="text"
            placeholder="Search premium collections..."
            value={discoverSearchQuery}
            onChange={(e) => setDiscoverSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Horizontal sub-topics navigation list */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
        {["All", "DevOps", "Cloud", "AI"].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedDiscoverCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer -mb-[1px] border-b-2 shrink-0 ${
              selectedDiscoverCategory === cat 
                ? "border-slate-800 text-slate-900 font-bold" 
                : "border-transparent text-slate-400 hover:text-slate-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDiscoverCollection.map((item) => {
          const isImporting = importingQuizId === item.id;
          return (
            <div 
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.01)] hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
            >
              <div className={`h-2.5 w-full ${
                item.category === "DevOps" ? "bg-blue-500" :
                item.category === "Cloud" ? "bg-cyan-500" :
                item.category === "AI" ? "bg-fuchsia-500" : "bg-slate-400"
              }`} />

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                    <span className="uppercase">{item.category}</span>
                    <span>{item.questions.length} Questions</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 font-display group-hover:text-indigo-650 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-wider">Sample Questions Included:</span>
                    <ul className="space-y-1">
                      {item.questions.slice(0, 2).map((q, qIdx) => (
                        <li key={qIdx} className="text-[10px] text-slate-500 font-medium flex items-start gap-1">
                          <span className="text-slate-400 shrink-0 font-bold">{qIdx + 1}.</span>
                          <span className="truncate">{q.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/55 -mx-5 -mb-5 p-4 rounded-b-2xl mt-4">
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" /> Fully Aligned
                  </span>
                  
                  <button
                    onClick={() => handleImportCuratedQuiz(item)}
                    disabled={isImporting}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                      isImporting 
                        ? "bg-slate-100 text-slate-400" 
                        : "bg-slate-900 text-white hover:bg-slate-800 shadow"
                    }`}
                  >
                    {isImporting ? (
                      <>
                        <div className="w-3 h-3 border-2 border-slate-405 border-t-transparent rounded-full animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download size={12} />
                        Import Deck
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
