import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useLeaderDashboard,
  formatNorwegianDateTime,
  LeaderGatheringItem,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { Task, Person } from "../types";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  MapPin,
  UserPlus,
  ArrowLeft,
  ChevronRight,
  Users,
  Calendar,
  Layers,
  Filter,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react";

// Inline Intervention Component for "Grip inn"
const InterveneModalInline: React.FC<{
  task: Task;
  members: Person[];
  onAssign: (taskId: string, personId: string, personName: string) => void;
  onFollowUp: (taskId: string) => void;
  onCancel: () => void;
}> = ({ task, members, onAssign, onFollowUp, onCancel }) => {
  return (
    <div
      id={`intervene-panel-${task.id}`}
      className="mt-3 p-3.5 bg-slate-900 text-white rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-150 shadow-md"
    >
      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
            Lederhandling • Grip inn
          </span>
          <p className="text-xs font-semibold text-slate-200 mt-0.5">{task.title}</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-white cursor-pointer px-1 py-0.5 rounded"
        >
          Lukk
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] text-slate-300 font-medium">
          Tildel direkte til et gruppemedlem:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              id={`btn-assign-${task.id}-${member.id}`}
              onClick={() => onAssign(task.id, member.id, member.name)}
              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-left rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center justify-between group cursor-pointer border border-slate-700"
            >
              <span>{member.name}</span>
              <UserPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      <div className="pt-1.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          type="button"
          id={`btn-followup-${task.id}`}
          onClick={() => onFollowUp(task.id)}
          className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold cursor-pointer underline underline-offset-2"
        >
          Marker som personlig oppfølging
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
};

// Gathering Row for Semester Overview
const SemesterGatheringRow: React.FC<{
  item: LeaderGatheringItem;
  members: Person[];
  onAssign: (taskId: string, personId: string, personName: string) => void;
  onFollowUp: (taskId: string) => void;
}> = ({ item, members, onAssign, onFollowUp }) => {
  const { gathering, group, tasks, staffing } = item;
  const navigate = useNavigate();
  const [isIntervening, setIsIntervening] = useState<string | null>(null);

  const vacantTasks = tasks.filter((t) => t.status === "vacant");
  const isArrangement = gathering.type === "arrangement" || !gathering.type;

  return (
    <div
      id={`leader-semester-gathering-${gathering.id}`}
      className={`p-4 bg-white rounded-2xl border transition-all space-y-3 ${
        staffing.color === "red"
          ? "border-red-200 shadow-xs ring-1 ring-red-100"
          : staffing.color === "yellow"
          ? "border-amber-200/90 shadow-xs"
          : "border-slate-100 shadow-xs"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-slate-800">{gathering.title}</h4>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                isArrangement
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "bg-purple-50 text-purple-700 border border-purple-100"
              }`}
            >
              {isArrangement ? "Arrangement" : "Gruppesamling"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-slate-700 font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formatNorwegianDateTime(gathering.startsAt)}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">{group.name}</span>
            {gathering.location && (
              <>
                <span className="text-slate-400">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {gathering.location}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Staffing Status Badge & Link */}
        <div className="shrink-0 text-right space-y-1">
          <span
            className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${
              staffing.color === "red"
                ? "bg-red-100 text-red-700"
                : staffing.color === "yellow"
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {staffing.badgeText}
          </span>
          <p className="text-[10px] text-slate-400 font-medium">
            {staffing.coveredCount} av {staffing.totalTasks} dekket
          </p>
        </div>
      </div>

      {/* Forfall warning banner */}
      {staffing.color === "red" && (
        <div className="p-2.5 bg-red-50 rounded-xl border border-red-200/70 text-xs text-red-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <span className="font-medium">
              Forfall meldt på {vacantTasks.length} {vacantTasks.length === 1 ? "oppgave" : "oppgaver"}.
            </span>
          </div>
          {vacantTasks.length > 0 && (
            <button
              type="button"
              id={`btn-open-intervene-${vacantTasks[0].id}`}
              onClick={() => setIsIntervening(isIntervening === vacantTasks[0].id ? null : vacantTasks[0].id)}
              className="text-[11px] font-bold px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              Grip inn
            </button>
          )}
        </div>
      )}

      {/* Inline Intervention Form if open */}
      {isIntervening && (
        <InterveneModalInline
          task={tasks.find((t) => t.id === isIntervening)!}
          members={members}
          onAssign={(tId, pId, pName) => {
            onAssign(tId, pId, pName);
            setIsIntervening(null);
          }}
          onFollowUp={(tId) => {
            onFollowUp(tId);
            setIsIntervening(null);
          }}
          onCancel={() => setIsIntervening(null)}
        />
      )}

      {/* Bottom Link to Gathering/Arrangement Detail */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {tasks.length} {tasks.length === 1 ? "oppgave tilknyttet" : "oppgaver tilknyttet"}
        </span>
        <button
          type="button"
          id={`btn-open-gathering-${gathering.id}`}
          onClick={() => navigate(`/leder/samling/${gathering.id}`)}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>Åpne arrangementsdetalj</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export const LeaderPage: React.FC = () => {
  const {
    isLeader,
    leaderData,
    allSemesterGatherings,
    urgentGatherings,
    urgentTasks,
    urgentTasksCount,
    currentUser,
    assignTaskToPerson,
  } = useLeaderDashboard();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = searchParams.get("tab") === "samlinger" ? "samlinger" : "grupper";
  const [activeTab, setActiveTab] = useState<"grupper" | "samlinger">(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "samlinger" || tabParam === "grupper") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: "grupper" | "samlinger") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<"all" | "red" | "yellow" | "green">("all");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "info" } | null>(null);

  const showFeedback = (text: string, type: "success" | "info" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleAssign = async (taskId: string, personId: string, personName: string) => {
    const res = await assignTaskToPerson(taskId, personId);
    if (res.success) {
      showFeedback(`Oppgaven ble direkte tildelt ${personName}. Arrangementet er nå oppdatert!`);
    } else {
      showFeedback(res.error || "Kunne ikke tildele oppgaven.", "info");
    }
  };

  const handleFollowUp = (taskId: string) => {
    showFeedback("Oppgaven er markert for personlig oppfølging av gruppeleder.", "info");
  };

  // Shortcut from urgent banner: switch to Semesteroversikt, select 'red' status, and reset month to 'all'
  const handleShowUrgentInSemester = () => {
    handleTabChange("samlinger");
    setSelectedStatusFilter("red");
    setSelectedMonth("all");
  };

  // Month filtering definitions (Aug 2026 – Jan 2027)
  const monthOptions = [
    { id: "all", label: "Alle måneder" },
    { id: "2026-08", label: "Aug 2026" },
    { id: "2026-09", label: "Sep 2026" },
    { id: "2026-10", label: "Okt 2026" },
    { id: "2026-11", label: "Nov 2026" },
    { id: "2026-12", label: "Des 2026" },
    { id: "2027-01", label: "Jan 2027" },
  ];

  // Gatherings in currently selected month (for dynamic filter badge counts)
  const monthGatherings = useMemo(() => {
    if (selectedMonth === "all") return allSemesterGatherings;
    return allSemesterGatherings.filter((item) => item.gathering.startsAt.substring(0, 7) === selectedMonth);
  }, [allSemesterGatherings, selectedMonth]);

  const monthRedCount = useMemo(() => monthGatherings.filter((item) => item.staffing.color === "red").length, [monthGatherings]);
  const monthYellowCount = useMemo(() => monthGatherings.filter((item) => item.staffing.color === "yellow").length, [monthGatherings]);
  const monthGreenCount = useMemo(() => monthGatherings.filter((item) => item.staffing.color === "green").length, [monthGatherings]);

  // Filtered semester gatherings combining Month + Status
  const filteredSemesterGatherings = useMemo(() => {
    return monthGatherings.filter((item) => {
      if (selectedStatusFilter !== "all") {
        if (item.staffing.color !== selectedStatusFilter) return false;
      }
      return true;
    });
  }, [monthGatherings, selectedStatusFilter]);

  // Count urgent tasks inside the filtered gatherings
  const filteredUrgentTasksCount = useMemo(() => {
    return filteredSemesterGatherings.reduce((acc, item) => {
      return acc + item.tasks.filter((t) => t.status === "vacant").length;
    }, 0);
  }, [filteredSemesterGatherings]);

  // Friendly message if user is not a leader or deputy in any group
  if (!isLeader) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800">Ikke registrert som leder</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              <span className="font-semibold text-slate-700">{currentUser.name}</span> er registrert som medlem, men leder for øyeblikket ingen grupper. Bytt bruker i toppen for å teste lederflaten.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/"
              id="btn-back-to-my-page"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til Min side
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Subheader & Tabs */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold">
              Gruppeleder-arbeidsflate
            </span>
            <h2 className="text-base font-bold text-slate-800">
              {currentUser.name}
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {leaderData.length} {leaderData.length === 1 ? "ledergruppe" : "ledergrupper"}
          </span>
        </div>

        {/* View Switcher Tabs: Grupper vs Semesteroversikt */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            id="tab-btn-mine-grupper"
            onClick={() => handleTabChange("grupper")}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "grupper"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Mine ledergrupper</span>
          </button>

          <button
            type="button"
            id="tab-btn-samlingsoversikt"
            onClick={() => handleTabChange("samlinger")}
            className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "samlinger"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Semesteroversikt</span>
            {urgentGatherings.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          id="leader-feedback-toast"
          className={`mx-5 mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-amber-50 text-amber-800 border border-amber-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="p-5 space-y-6">
        {/* Executive Summary: Rolig og kompakt statusindikator */}
        <section aria-labelledby="leader-summary-title">
          <h2 id="leader-summary-title" className="sr-only">
            Statusoppsummering for gruppeleder
          </h2>

          {urgentTasksCount > 0 ? (
            <div
              id="leader-urgent-banner"
              className="px-4 py-3 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <div>
                  <span className="text-xs font-bold text-red-900 block leading-snug">
                    {urgentTasksCount} {urgentTasksCount === 1 ? "oppgave trenger vikar / oppfølging" : "oppgaver trenger vikar / oppfølging"}
                  </span>
                  <span className="text-[11px] text-red-700 font-medium">
                    I {urgentGatherings.length} {urgentGatherings.length === 1 ? "aktivitet" : "aktiviteter"} dette semesteret
                  </span>
                </div>
              </div>
              <button
                type="button"
                id="btn-show-urgent-in-semester"
                onClick={handleShowUrgentInSemester}
                className="text-xs font-bold px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <span>Vis i semesteroversikt</span>
                <span>→</span>
              </button>
            </div>
          ) : (
            <div className="px-4 py-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-emerald-900">
                  Alt er i rute • Alle planlagte oppgaver er dekket
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700">
                🟢 Dekket
              </span>
            </div>
          )}
        </section>

        {/* TAB 1: Mine Ledergrupper (Gruppekort overblikk) */}
        {activeTab === "grupper" && (
          <section className="space-y-3.5" aria-labelledby="leader-groups-heading">
            <div className="flex items-center justify-between">
              <h3 id="leader-groups-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Mine grupper
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Velg gruppe for å åpne gruppekortet
              </span>
            </div>

            <div className="space-y-3">
              {leaderData.map(({ group, members, gatherings, totalVacantTasks, totalOpenTasks }) => {
                const isMainLeader = group.leaderIds.includes(currentUser.id);
                const isDeputy = group.deputyLeaderIds?.includes(currentUser.id);

                // Find next upcoming activity for this group
                const nextGatheringItem = gatherings[0];

                return (
                  <div
                    key={group.id}
                    id={`leader-group-card-${group.id}`}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3 hover:border-emerald-300 transition-all group"
                  >
                    {/* Header: Gruppenavn, Kategori & Medlemmer */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                            {group.name}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              isMainLeader
                                ? "bg-emerald-100 text-emerald-800"
                                : isDeputy
                                ? "bg-blue-100 text-blue-800"
                                : "bg-indigo-100 text-indigo-800"
                            }`}
                          >
                            {isMainLeader ? "Hovedleder" : isDeputy ? "Nestleder" : "Admin"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          <span className="capitalize">{group.category || "Tjenestegruppe"}</span> · {members.length} medlemmer
                        </p>
                      </div>
                    </div>

                    {/* Neste relevante aktivitet & Bemanningsstatus */}
                    {nextGatheringItem ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-500 font-medium">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                            Neste aktivitet:
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              nextGatheringItem.staffing.color === "red"
                                ? "bg-red-100 text-red-700"
                                : nextGatheringItem.staffing.color === "yellow"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {nextGatheringItem.staffing.color === "green" ? "🟢 Dekket" : nextGatheringItem.staffing.badgeText}
                          </span>
                        </div>
                        <div className="font-bold text-slate-800">
                          {nextGatheringItem.gathering.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatNorwegianDateTime(nextGatheringItem.gathering.startsAt)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400 italic">
                        Ingen planlagte aktiviteter for denne gruppen.
                      </div>
                    )}

                    {/* Fast møteplan */}
                    {group.meetingSchedule && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 px-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Fast tid: {group.meetingSchedule.weekday} kl. {group.meetingSchedule.time} ({group.meetingSchedule.frequency})</span>
                      </div>
                    )}

                    {/* Action link */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {gatherings.length} planlagte aktiviteter
                      </span>
                      <button
                        type="button"
                        id={`btn-open-group-card-${group.id}`}
                        onClick={() => navigate(`/leder/gruppe/${group.id}`)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <span>Gå til gruppekort</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 2: Semesteroversikt for Arrangementer */}
        {activeTab === "samlinger" && (
          <section className="space-y-4" aria-labelledby="leader-semester-heading">
            <div className="flex items-center justify-between">
              <h3 id="leader-semester-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Arrangementer dette semesteret (6 mnd)
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredSemesterGatherings.length} av {allSemesterGatherings.length} arrangementer
              </span>
            </div>

            {/* Month Filter Selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {monthOptions.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    id={`filter-month-${m.id}`}
                    onClick={() => setSelectedMonth(m.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                      selectedMonth === m.id
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                <button
                  type="button"
                  id="filter-status-all"
                  onClick={() => setSelectedStatusFilter("all")}
                  className={`px-2.5 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                    selectedStatusFilter === "all"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs font-bold"
                      : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  <span>Alle statuser</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                    {monthGatherings.length}
                  </span>
                </button>
                <button
                  type="button"
                  id="filter-status-red"
                  onClick={() => setSelectedStatusFilter("red")}
                  className={`px-2.5 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                    selectedStatusFilter === "red"
                      ? "bg-red-100 text-red-900 border border-red-300 shadow-2xs font-bold"
                      : "bg-white text-red-600 border border-slate-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Trenger vikar / Forfall</span>
                  {monthRedCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-200/80 text-red-900 font-bold">
                      {monthRedCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  id="filter-status-yellow"
                  onClick={() => setSelectedStatusFilter("yellow")}
                  className={`px-2.5 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                    selectedStatusFilter === "yellow"
                      ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-bold"
                      : "bg-white text-amber-600 border border-slate-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Mangler frivillig</span>
                  {monthYellowCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-bold">
                      {monthYellowCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  id="filter-status-green"
                  onClick={() => setSelectedStatusFilter("green")}
                  className={`px-2.5 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                    selectedStatusFilter === "green"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs font-bold"
                      : "bg-white text-emerald-600 border border-slate-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Fullt dekket</span>
                  {monthGreenCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
                      {monthGreenCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Active Filter Notification Bar */}
            {(selectedStatusFilter !== "all" || selectedMonth !== "all") && (
              <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-500 text-[11px] font-medium">Filter:</span>
                  {selectedMonth !== "all" && (
                    <span className="font-bold bg-white text-slate-800 text-[11px] px-2 py-0.5 rounded-md border border-slate-200">
                      {monthOptions.find((m) => m.id === selectedMonth)?.label}
                    </span>
                  )}
                  {selectedStatusFilter === "red" && (
                    <span className="font-bold bg-red-100 text-red-800 text-[11px] px-2 py-0.5 rounded-md border border-red-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      Trenger vikar / Forfall
                    </span>
                  )}
                  {selectedStatusFilter === "yellow" && (
                    <span className="font-bold bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Mangler frivillig
                    </span>
                  )}
                  {selectedStatusFilter === "green" && (
                    <span className="font-bold bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Fullt dekket
                    </span>
                  )}
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-slate-700 text-[11px]">
                    {filteredSemesterGatherings.length} {filteredSemesterGatherings.length === 1 ? "aktivitet" : "aktiviteter"}
                    {selectedStatusFilter === "red" && ` (${filteredUrgentTasksCount} ${filteredUrgentTasksCount === 1 ? "oppgave" : "oppgaver"} med forfall)`}
                  </span>
                </div>
                <button
                  type="button"
                  id="btn-reset-filters"
                  onClick={() => {
                    setSelectedMonth("all");
                    setSelectedStatusFilter("all");
                  }}
                  className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 shrink-0 cursor-pointer"
                >
                  Nullstill
                </button>
              </div>
            )}

            {filteredSemesterGatherings.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-3">
                <p className="text-xs text-slate-500 font-medium">
                  {selectedStatusFilter === "red" && selectedMonth !== "all"
                    ? `Ingen aktiviteter med forfall eller vikarbehov i ${monthOptions.find((m) => m.id === selectedMonth)?.label}.`
                    : "Ingen aktiviteter matcher valgt måned eller filter."}
                </p>
                {selectedStatusFilter === "red" && selectedMonth !== "all" && urgentGatherings.length > 0 && (
                  <button
                    type="button"
                    id="btn-show-all-months-urgent"
                    onClick={() => setSelectedMonth("all")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-3.5 py-2 rounded-xl cursor-pointer transition-colors shadow-2xs"
                  >
                    <span>Vis alle måneder ({urgentGatherings.length} {urgentGatherings.length === 1 ? "aktivitet" : "aktiviteter"} med forfall)</span>
                    <span>→</span>
                  </button>
                )}
                {selectedStatusFilter !== "all" && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMonth("all");
                        setSelectedStatusFilter("all");
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer"
                    >
                      Nullstill alle filtre
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSemesterGatherings.map((item) => {
                  const groupData = leaderData.find((gd) => gd.group.id === item.group.id);
                  const members = groupData ? groupData.members : [];

                  return (
                    <SemesterGatheringRow
                      key={item.gathering.id}
                      item={item}
                      members={members}
                      onAssign={handleAssign}
                      onFollowUp={handleFollowUp}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

