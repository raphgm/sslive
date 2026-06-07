import React, { useState } from "react";
import { 
  Plus, 
  X, 
  Info, 
  Pencil, 
  Users, 
  Share2, 
  Trash, 
  Check, 
  Copy 
} from "lucide-react";
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebase";
import { Room } from "../types";

interface RoomsViewProps {
  teacherUid: string;
  teacherEmail: string | null;
  allRooms: Room[];
  activeRoomId: string;
  setActiveRoomId: (id: string) => void;
  participantsCount: number;
  isProLicensed: boolean;
  onTriggerProUpgrade: () => void;
}

export default function RoomsView({
  teacherUid,
  teacherEmail,
  allRooms,
  activeRoomId,
  setActiveRoomId,
  participantsCount,
  isProLicensed,
  onTriggerProUpgrade
}: RoomsViewProps) {
  const [showProTipRoom, setShowProTipRoom] = useState(
    localStorage.getItem("dismiss-rooms-protip") !== "true"
  );
  const [renamingRoomId, setRenamingRoomId] = useState<string | null>(null);
  const [renamingText, setRenamingText] = useState("");
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Room code modal state
  const [showRoomCodeModal, setShowRoomCodeModal] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [roomCodeError, setRoomCodeError] = useState("");
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const openRoomCodeModal = () => {
    setRoomCodeInput("");
    setRoomCodeError("");
    setShowRoomCodeModal(true);
  };

  const handleAddRoom = () => {
    if (!isProLicensed && allRooms.length >= 1) {
      setIsUpgradeModalOpen(true);
      return;
    }
    openRoomCodeModal();
  };

  const handleConfirmRoomCode = async () => {
    const formattedCode = roomCodeInput.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (formattedCode.length < 3) {
      setRoomCodeError("Room Code must be at least 3 alphanumeric characters.");
      return;
    }
    if (!teacherUid) {
      setRoomCodeError("User authentication failed. Please sign out and sign back in.");
      return;
    }
    setIsCreatingRoom(true);
    setRoomCodeError("");
    try {
      const docSnap = await getDoc(doc(db, "rooms", formattedCode));
      if (docSnap.exists()) {
        setRoomCodeError(`Room Code "${formattedCode}" is already taken. Try another.`);
        setIsCreatingRoom(false);
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
      setShowRoomCodeModal(false);
      setRoomCodeInput("");
    } catch (e) {
      console.error("Room creation error:", e);
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg.includes("permission")) {
        setRoomCodeError("Permission denied. You may not be signed in properly. Try signing out and signing back in.");
      } else if (errMsg.includes("not-found")) {
        setRoomCodeError("Firestore database not accessible. Please contact support.");
      } else {
        setRoomCodeError("Failed to create room. " + (errMsg ? "(" + errMsg.substring(0, 40) + ")" : "Please try again."));
      }
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleRenameRoomInDB = async (oldCode: string, newCode: string) => {
    if (!newCode || !newCode.trim()) return;
    const formattedCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (formattedCode.length < 3) {
      alert("Room Code must be at least 3 characters.");
      return;
    }
    if (formattedCode === oldCode) return;

    try {
      const targetSnap = await getDoc(doc(db, "rooms", formattedCode));
      if (targetSnap.exists()) {
        alert(`Room Code "${formattedCode}" is already taken.`);
        return;
      }

      const sourceSnap = await getDoc(doc(db, "rooms", oldCode));
      if (!sourceSnap.exists()) return;

      const sourceData = sourceSnap.data() as Room;
      const updatedRoom: Room = {
        ...sourceData,
        roomId: formattedCode
      };

      await setDoc(doc(db, "rooms", formattedCode), updatedRoom);
      await deleteDoc(doc(db, "rooms", oldCode));

      if (activeRoomId === oldCode) {
        setActiveRoomId(formattedCode);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to rename room. Check database security rules.");
    }
  };

  const handleDeleteRoom = async (roomIdToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (allRooms.length <= 1) {
      alert("You need at least one room to launch class evaluation activities.");
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete meeting "${roomIdToDelete}"?`)) return;

    try {
      await deleteDoc(doc(db, "rooms", roomIdToDelete));
      if (activeRoomId === roomIdToDelete) {
        const remaining = allRooms.filter(r => r.roomId !== roomIdToDelete);
        if (remaining.length > 0) {
          setActiveRoomId(remaining[0].roomId);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete room.");
    }
  };

  return (
    <div className="space-y-6 fade-in-up" id="rooms-view-root">
      {/* Pro Tip Banner */}
      {showProTipRoom && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 relative flex items-start gap-4 shadow-3xs">
          <div className="w-8 h-8 rounded-full bg-sky-100 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0">
            <Info size={16} />
          </div>
          <div className="space-y-1 flex-grow pr-6">
            <h4 className="text-xs font-bold text-sky-850 font-sans">Pro tip to master SSlive Rooms:</h4>
            <p className="text-xs text-sky-750 leading-relaxed font-semibold">
              Create separate rostered rooms to run parallel class sections, partition student records, and email automated diagnostic cards. Join links are custom bound to the active room selected in your top right picker!
            </p>
          </div>
          <button 
            type="button"
            onClick={() => {
              setShowProTipRoom(false);
              localStorage.setItem("dismiss-rooms-protip", "true");
            }}
            className="p-1 hover:bg-sky-100 rounded-lg text-sky-450 hover:text-sky-700 cursor-pointer absolute top-4 right-4"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Rooms management header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
        <div>
          <h2 className="text-lg font-display font-semibold text-slate-800">Collaborative Meeting Rooms</h2>
          <p className="text-xs text-slate-400">Launch different activities across rooms simultaneously. Single-click rows to select and set them active.</p>
        </div>
        <button 
          onClick={handleAddRoom}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          id="btn-add-room"
        >
          <Plus size={14} /> ADD ROOM
        </button>
      </div>

      {/* Rooms List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-3xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5 text-center w-24">IN MENU</th>
                <th className="py-3 px-4 text-center w-24">STATUS</th>
                <th className="py-3 px-5">ROOM NAME</th>
                <th className="py-3 px-5 text-center w-24">SHARE</th>
                <th className="py-3 px-5 text-center w-24">ROSTER</th>
                <th className="py-3 px-5 text-center w-24">DELETE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allRooms.map((r) => {
                const isSelected = activeRoomId === r.roomId;
                const hasActiveSession = r.activeActivity !== null;
                
                return (
                  <tr 
                    key={r.roomId}
                    onClick={() => setActiveRoomId(r.roomId)}
                    className={`group text-xs transition-colors cursor-pointer ${
                      isSelected ? "bg-slate-50/75 font-semibold" : "hover:bg-slate-50/25"
                    }`}
                  >
                    <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setActiveRoomId(r.roomId)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          hasActiveSession 
                            ? "bg-emerald-500 animate-pulse ring-4 ring-emerald-100" 
                            : "bg-slate-300"
                        }`} title={hasActiveSession ? "Live Active Activity underway" : "Inactive Room"} />
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {renamingRoomId === r.roomId ? (
                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleRenameRoomInDB(r.roomId, renamingText);
                              setRenamingRoomId(null);
                            }}
                            className="flex items-center gap-1.5"
                          >
                            <input 
                              type="text"
                              value={renamingText}
                              onChange={(e) => setRenamingText(e.target.value)}
                              className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              maxLength={15}
                              autoFocus
                            />
                            <button 
                              type="submit"
                              className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded cursor-pointer"
                            >
                              Save
                            </button>
                            <button 
                              type="button"
                              onClick={() => setRenamingRoomId(null)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[10px] rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <>
                            <span className={`font-mono text-sm tracking-wide ${
                              isSelected ? "text-slate-800 font-bold" : "text-slate-500"
                            }`}>
                              {r.roomId}
                            </span>
                            <button 
                              onClick={() => {
                                setRenamingRoomId(r.roomId);
                                setRenamingText(r.roomId);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                              title="Rename Room Code"
                            >
                              <Pencil size={11} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => {
                          const clickUrl = `${window.location.origin}${window.location.pathname}?room=${r.roomId}`;
                          navigator.clipboard.writeText(clickUrl).then(() => {
                            let originUrl = window.location.origin;
                            if (originUrl.includes("ais-dev")) {
                              alert(`Join link copied!\n\nNote: You are in the private dev environment. To share with real students, please deploy first.`);
                            } else {
                              alert(`Join link copied for ${r.roomId}!`);
                            }
                          });
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        title="Copy Meeting URL"
                      >
                        <Share2 size={14} />
                      </button>
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-500 font-mono text-xs">
                        <Users size={12} className="text-slate-400" />
                        <span>{isSelected ? participantsCount : 0}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={(evt) => handleDeleteRoom(r.roomId, evt)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-405 hover:text-red-650 transition-colors cursor-pointer"
                        title="Trash Room Record"
                      >
                        <Trash size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Central promo/add room teaser section */}
      <div className="flex flex-col items-center justify-center py-12 px-6 bg-white border border-slate-200 rounded-3xl shadow-3xs max-w-xl mx-auto mt-8 text-center">
        <div className="flex items-center justify-center -space-x-4 text-slate-150 mb-4 scale-110">
          <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-350 border-2 border-white shadow-3xs">
            <Users size={28} strokeWidth={1.5} />
          </div>
          <div className="w-11 h-11 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border-2 border-white shadow-3xs">
            <Users size={20} strokeWidth={1.5} />
          </div>
        </div>
        <h3 className="text-sm font-semibold text-slate-800 font-sans tracking-wide">
          Add a Room to Launch More Activities
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 max-w-sm leading-relaxed">
          Run multiple activities at once and group your students with rosters.
        </p>
        <button
          onClick={handleAddRoom}
          className="mt-5 px-5 py-2 bg-sky-50 hover:bg-sky-100/75 text-sky-600 rounded-xl text-xs font-bold transition-all border border-sky-100/60 shadow-3xs cursor-pointer active:scale-98"
        >
          Add Room
        </button>
      </div>

      {/* ── Room Code Input Modal ── */}
      {showRoomCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowRoomCodeModal(false)}
          />
          <div className="relative bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 z-10">
            <button
              onClick={() => setShowRoomCodeModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
            >
              <X size={15} />
            </button>

            <h3 className="text-[15px] font-bold text-slate-800 mb-1">Create a Room</h3>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Choose a unique alphanumeric code (3–15 characters). Students use this to join your room.
            </p>

            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => {
                setRoomCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                setRoomCodeError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && handleConfirmRoomCode()}
              placeholder="e.g. MATH101"
              maxLength={15}
              autoFocus
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-300 placeholder:uppercase"
            />

            {roomCodeError && (
              <p className="text-[11px] text-red-500 mt-2 font-medium">{roomCodeError}</p>
            )}

            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setShowRoomCodeModal(false)}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRoomCode}
                disabled={isCreatingRoom || roomCodeInput.length < 3}
                className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isCreatingRoom ? (
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                ) : (
                  <Plus size={13} />
                )}
                {isCreatingRoom ? "Creating…" : "Create Room"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade rooms modal */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsUpgradeModalOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs"
          />
          <div className="relative bg-white rounded-3xl w-full max-w-[390px] shadow-2xl border border-slate-100 p-6 z-10 flex flex-col text-left">
            <button 
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4.5 right-4.5 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-full transition-all cursor-pointer"
            >
              <X size={15} />
            </button>
            <h3 className="text-[15px] font-sans font-bold text-slate-800 pr-8">
              Upgrade to Add More Rooms
            </h3>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed font-sans">
              Rooms allow you to launch multiple activities at the same time for all your classes. Upgrade to SSlive PRO and get more features:
            </p>
            <ul className="space-y-2.5 mt-4">
              {["Email individual reports", "Manage student access to rooms", "One attempt on quizzes"].map(f => (
                <li key={f} className="flex items-center gap-2 text-[11px] text-slate-600 font-semibold font-sans">
                  <span className="text-sky-500 shrink-0"><Check size={13} strokeWidth={4} /></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2.5 mt-6">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="flex-1 py-2 border border-slate-150 hover:bg-slate-50 text-slate-605 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsUpgradeModalOpen(false);
                  onTriggerProUpgrade();
                }}
                className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-xs"
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
