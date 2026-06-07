// Preset teams for team mode — referenced by name (stored on Participant.team).

export interface Team {
  id: string;
  name: string;
  emoji: string;
  color: string;       // tailwind gradient: bg-gradient-to-br from-X to-Y
  textColor: string;   // tailwind text class
  ring: string;        // tailwind ring class
  border: string;      // tailwind border class
  bg: string;          // tailwind bg-X-50 light shade
  solid: string;       // tailwind bg solid for badges
}

export const TEAMS: Team[] = [
  { id: "red-dragons",   name: "Red Dragons",   emoji: "🐉", color: "from-red-500 to-rose-600",       textColor: "text-red-700",     ring: "ring-red-400",     border: "border-red-300",    bg: "bg-red-50",     solid: "bg-red-500" },
  { id: "blue-phoenix",  name: "Blue Phoenix",  emoji: "🔥", color: "from-sky-500 to-blue-600",        textColor: "text-blue-700",    ring: "ring-blue-400",    border: "border-blue-300",   bg: "bg-blue-50",    solid: "bg-blue-500" },
  { id: "green-lions",   name: "Green Lions",   emoji: "🦁", color: "from-emerald-500 to-green-600",   textColor: "text-emerald-700", ring: "ring-emerald-400", border: "border-emerald-300", bg: "bg-emerald-50", solid: "bg-emerald-500" },
  { id: "yellow-eagles", name: "Yellow Eagles", emoji: "🦅", color: "from-amber-400 to-yellow-500",    textColor: "text-amber-700",   ring: "ring-amber-400",   border: "border-amber-300",  bg: "bg-amber-50",   solid: "bg-amber-500" },
  { id: "purple-wolves", name: "Purple Wolves", emoji: "🐺", color: "from-violet-500 to-purple-600",   textColor: "text-violet-700",  ring: "ring-violet-400",  border: "border-violet-300", bg: "bg-violet-50",  solid: "bg-violet-500" },
  { id: "orange-foxes",  name: "Orange Foxes",  emoji: "🦊", color: "from-orange-500 to-red-500",      textColor: "text-orange-700",  ring: "ring-orange-400",  border: "border-orange-300", bg: "bg-orange-50",  solid: "bg-orange-500" },
];

export const TEAM_BY_NAME: Record<string, Team> = TEAMS.reduce(
  (acc, t) => { acc[t.name] = t; return acc; },
  {} as Record<string, Team>,
);

export interface TeamStanding {
  team: Team;
  score: number;
  members: number;
  topMember?: string;
}

export const computeTeamStandings = (
  participants: Array<{ name: string; team: string | null; score: number }>,
): TeamStanding[] => {
  const byTeam: Record<string, { score: number; members: number; topMember?: string; topScore: number }> = {};
  participants.forEach(p => {
    if (!p.team) return;
    if (!byTeam[p.team]) byTeam[p.team] = { score: 0, members: 0, topScore: -1 };
    byTeam[p.team].score += p.score;
    byTeam[p.team].members += 1;
    if (p.score > byTeam[p.team].topScore) {
      byTeam[p.team].topScore = p.score;
      byTeam[p.team].topMember = p.name;
    }
  });
  return Object.entries(byTeam)
    .map(([name, data]) => ({
      team: TEAM_BY_NAME[name] || { id: name, name, emoji: "⚪", color: "from-slate-400 to-slate-500", textColor: "text-slate-700", ring: "ring-slate-400", border: "border-slate-300", bg: "bg-slate-50", solid: "bg-slate-500" },
      score: data.score,
      members: data.members,
      topMember: data.topMember,
    }))
    .sort((a, b) => b.score - a.score);
};
