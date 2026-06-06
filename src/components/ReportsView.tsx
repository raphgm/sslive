import React, { useState } from "react";
import { 
  FileSpreadsheet, 
  Trash, 
  ChevronRight, 
  Users 
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import LiveReportView from "./LiveReportView";

interface ReportsViewProps {
  reportsHistory: any[];
  onDeleteReport?: (id: string) => void;
}

export default function ReportsView({ reportsHistory }: ReportsViewProps) {
  const [selectedHistoricalReport, setSelectedHistoricalReport] = useState<any | null>(null);

  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this report?")) return;
    try {
      await deleteDoc(doc(db, "reports_history", id));
      alert("Report successfully deleted.");
    } catch (err) {
      console.error(err);
      alert("Failed to delete report.");
    }
  };

  return (
    <div className="space-y-6 fade-in-up" id="reports-view-root">
      {selectedHistoricalReport ? (
        <div className="space-y-4">
          <button 
            type="button"
            onClick={() => setSelectedHistoricalReport(null)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
          >
            ← Back to Reports Catalog
          </button>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-150 pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider font-bold">Historical Report Docket</span>
                  <span className="text-[9px] font-mono bg-indigo-55 text-indigo-750 px-2 py-0.5 rounded font-bold">{selectedHistoricalReport.roomCode}</span>
                </div>
                <h3 className="text-base font-display font-medium text-slate-850 mt-1">{selectedHistoricalReport.quizTitle}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">Date Closed: {new Date(selectedHistoricalReport.endedAt).toLocaleString()}</p>
              </div>
              
              <div className="flex gap-4">
                <div className="text-center font-mono py-1 px-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-lg font-bold text-slate-800">{selectedHistoricalReport.participantCount}</p>
                  <p className="text-[9px] text-slate-400 font-sans uppercase font-semibold">Attendees</p>
                </div>
                <div className="text-center font-mono py-1 px-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-lg font-bold text-indigo-750">{selectedHistoricalReport.averageScore}%</p>
                  <p className="text-[9px] text-slate-400 font-sans uppercase font-semibold">Class Avg</p>
                </div>
              </div>
            </div>

            <LiveReportView 
              participants={selectedHistoricalReport.participants.map((p: any, pIdx: number) => ({
                id: `hist-p-${pIdx}-${p.name}`,
                name: p.name,
                team: null,
                score: p.score,
                completed: p.completed,
                answers: p.answers || {},
                progress: 100,
                joinedAt: ""
              }))}
              questions={selectedHistoricalReport.questions || []}
              activeQuizTitle={selectedHistoricalReport.quizTitle}
              onCloseReport={() => setSelectedHistoricalReport(null)}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Reports Catalog Title */}
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
            <div>
              <h2 className="text-lg font-display font-medium text-slate-800">Diagnostics & Reports Log</h2>
              <p className="text-xs text-slate-400">View static grading grids, performance levels, and historical response breakdowns from completed class activities.</p>
            </div>
          </div>

          {reportsHistory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 text-center text-slate-400 text-xs font-mono shadow-3xs">
              <FileSpreadsheet className="mx-auto mb-3 text-slate-300 animate-pulse" size={40} />
              Diagnostics roster is empty.
              <p className="mt-2 text-[10px] text-slate-450">Launch a library quiz or game first, collect answers, then end the activity to generate a static graded snapshot!</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-3xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-5">QUIZ TITLE / ACTIVITY NAME</th>
                      <th className="py-3 px-5 text-center">ROOM</th>
                      <th className="py-3 px-5 text-center">TYPE</th>
                      <th className="py-3 px-5 text-center">PARTICIPANTS</th>
                      <th className="py-3 px-5 text-center">CLASS AVERAGE</th>
                      <th className="py-3 px-5">DATE COMPLETED</th>
                      <th className="py-3 px-5 text-center w-24">DELETE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportsHistory.map((rep) => (
                      <tr 
                        key={rep.id}
                        onClick={() => setSelectedHistoricalReport(rep)}
                        className="group hover:bg-slate-50/50 cursor-pointer text-xs text-slate-600 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-bold font-sans text-slate-850 group-hover:text-indigo-650 transition-colors flex items-center gap-1.5">
                          <FileSpreadsheet size={14} className="text-indigo-500" />
                          {rep.quizTitle}
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono text-slate-500">{rep.roomCode}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            rep.activityType === "space-race" ? "bg-orange-50 text-orange-600" :
                            rep.activityType === "quick-question" ? "bg-violet-50 text-violet-600" :
                            "bg-indigo-50 text-indigo-700"
                          }`}>
                            {rep.activityType}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono font-semibold">{rep.participantCount} users</td>
                        <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-800">{rep.averageScore}%</td>
                        <td className="py-3.5 px-5 text-slate-400">{new Date(rep.endedAt).toLocaleDateString()} {new Date(rep.endedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteReport(rep.id, e)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-55 rounded transition-all cursor-pointer animate-none"
                          >
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
