import React, { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useLeaderGatheringDetail,
  formatNorwegianDateTime,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { Task, Person, Assignment } from "../types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  UserCheck,
  UserX,
  FileText,
  Info,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";

interface IntegratedScheduleRow {
  id: string;
  time: string;
  programTitle: string;
  programDescription?: string;
  roleTitle: string;
  groupName: string;
  isMyGroup: boolean;
  task?: Task;
  neededCount: number;
  confirmedCount: number;
  isFullyCovered: boolean;
  hasForfall: boolean;
  assignedPersons: Array<{
    assignment?: Assignment;
    person?: Person;
    statusLabel: string;
    response: "confirmed" | "pending" | "declined" | "withdrawn";
  }>;
  instruction?: string;
}

export const LeaderGatheringDetailPage: React.FC = () => {
  const { gatheringId } = useParams<{ gatheringId: string }>();
  const navigate = useNavigate();

  const {
    hasAccess,
    isLeader,
    isDeputy,
    isAdmin,
    currentUser,
    gathering,
    group,
    involvedGroups,
    groupMembers,
    allPersons,
    tasksWithDetails,
    programSchedule,
    assignTaskToPerson,
    updateAssignmentStatus,
    removeAssignment,
    updateTaskStatus,
  } = useLeaderGatheringDetail(gatheringId || "");

  // Filters and views
  const [viewFilter, setViewFilter] = useState<"all" | "my-group" | "needs-action">("all");
  
  // Interactive modals / drawers
  const [activeInterveneTaskId, setActiveInterveneTaskId] = useState<string | null>(null);
  const [viewInstructionTask, setViewInstructionTask] = useState<{
    title: string;
    instruction: string;
    time?: string;
  } | null>(null);
  const [activePersonActionId, setActivePersonActionId] = useState<string | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build the unified "Kjøreplan & Hvem gjør hva" schedule timeline
  const integratedSchedule = useMemo<IntegratedScheduleRow[]>(() => {
    if (!gathering) return [];

    const rows: IntegratedScheduleRow[] = [];
    const usedTaskIds = new Set<string>();

    // 1. First, find preparation tasks that happen BEFORE service (e.g. oppmøte 09:30, 10:15, 10:35, 10:45)
    tasksWithDetails.forEach((td) => {
      const task = td.task;
      const lowerInstr = (task.instruction || "").toLowerCase();
      const lowerDesc = (task.description || "").toLowerCase();

      // Check if task has specific earlier prep time in instruction
      let prepTime = "";
      if (lowerInstr.includes("09:30") || lowerDesc.includes("09:30")) prepTime = "09:30";
      else if (lowerInstr.includes("10:00") || lowerDesc.includes("10:00")) prepTime = "10:00";
      else if (lowerInstr.includes("10:15") || lowerDesc.includes("10:15")) prepTime = "10:15";
      else if (lowerInstr.includes("10:20") || lowerDesc.includes("10:20")) prepTime = "10:20";
      else if (lowerInstr.includes("10:35") || lowerDesc.includes("10:35")) prepTime = "10:35";
      else if (lowerInstr.includes("10:45") || lowerDesc.includes("10:45")) prepTime = "10:45";

      if (prepTime) {
        usedTaskIds.add(task.id);
        rows.push({
          id: `prep-${task.id}`,
          time: prepTime,
          programTitle: prepTime < "10:30" ? "Teknisk rigg & forberedelser" : "Før gudstjenesten / Vertskap",
          programDescription: task.description || "Forberedelse i forkant av samlingen",
          roleTitle: task.title,
          groupName: td.taskGroup?.name || (td.isMyGroup ? group?.name || "Min gruppe" : "Tjenestegruppe"),
          isMyGroup: td.isMyGroup,
          task: task,
          neededCount: td.neededCount || 1,
          confirmedCount: td.confirmedPersonsCount,
          isFullyCovered: td.isFullyCovered,
          hasForfall: td.hasWithdrawn || task.status === "vacant",
          assignedPersons: td.assignedPersons,
          instruction: task.instruction || task.description,
        });
      }
    });

    // 2. Iterate through each ProgramItem in programSchedule
    programSchedule.forEach((item, index) => {
      // Find matching task if any
      let matchedTaskDetail = tasksWithDetails.find(
        (td) => td.task.id === item.taskId || (!usedTaskIds.has(td.task.id) && td.task.title.toLowerCase().includes(item.title.toLowerCase()))
      );

      // Specific domain mappings if taskId not explicitly bound
      if (!matchedTaskDetail) {
        const itemTitleLow = item.title.toLowerCase();
        if (itemTitleLow.includes("kirkekaffe") || itemTitleLow.includes("lunsj") || itemTitleLow.includes("kaffe")) {
          matchedTaskDetail = tasksWithDetails.find((td) => !usedTaskIds.has(td.task.id) && td.task.groupId === "group-kaffe");
        } else if (itemTitleLow.includes("lovsang") || itemTitleLow.includes("lyd")) {
          matchedTaskDetail = tasksWithDetails.find((td) => !usedTaskIds.has(td.task.id) && td.task.groupId === "group-lyd");
        } else if (itemTitleLow.includes("barnekirke") || itemTitleLow.includes("søndagsskole")) {
          matchedTaskDetail = tasksWithDetails.find((td) => !usedTaskIds.has(td.task.id) && td.task.groupId === "group-barn");
        }
      }

      if (matchedTaskDetail) {
        usedTaskIds.add(matchedTaskDetail.task.id);
        rows.push({
          id: `prog-${matchedTaskDetail.task.id}-${index}`,
          time: item.time,
          programTitle: item.title,
          programDescription: item.description,
          roleTitle: matchedTaskDetail.task.title,
          groupName: matchedTaskDetail.taskGroup?.name || (matchedTaskDetail.isMyGroup ? group?.name || "Min gruppe" : "Gruppe"),
          isMyGroup: matchedTaskDetail.isMyGroup,
          task: matchedTaskDetail.task,
          neededCount: matchedTaskDetail.neededCount || 1,
          confirmedCount: matchedTaskDetail.confirmedPersonsCount,
          isFullyCovered: matchedTaskDetail.isFullyCovered,
          hasForfall: matchedTaskDetail.hasWithdrawn || matchedTaskDetail.task.status === "vacant",
          assignedPersons: matchedTaskDetail.assignedPersons,
          instruction: matchedTaskDetail.task.instruction || matchedTaskDetail.task.description,
        });
      } else {
        // Program item without a specific volunteer Task object in DB
        // Assign realistic church role / responsible person based on type
        let role = "Liturg / Møteleder";
        let responsiblePersonName = "Jonas Lie";
        let roleGroupName = "Felles / Liturgi";

        const titleLow = item.title.toLowerCase();
        if (titleLow.includes("preken") || titleLow.includes("tale")) {
          role = "Taler / Pastor";
          responsiblePersonName = "Per prest";
        } else if (titleLow.includes("lovsang") || titleLow.includes("sang")) {
          role = "Lovsangsleder";
          responsiblePersonName = "Line & team";
          roleGroupName = "Lovsangsteam";
        } else if (titleLow.includes("dåp")) {
          role = "Liturg / Prest";
          responsiblePersonName = "Kari Nordmann";
        } else if (titleLow.includes("barnekirke") || titleLow.includes("søndagsskole")) {
          role = "Barnekirkeleder";
          responsiblePersonName = "Ingrid Berg";
          roleGroupName = "Søndagsskole";
        } else if (titleLow.includes("nattverd") || titleLow.includes("forbønn")) {
          role = "Forbønnsteam & nattverd";
          responsiblePersonName = "Kari + Ola";
        } else if (titleLow.includes("kirkekaffe")) {
          role = "Kaffeteam";
          responsiblePersonName = "Kaffegruppen";
          roleGroupName = "Kirkekaffe";
        }

        rows.push({
          id: `prog-general-${index}`,
          time: item.time,
          programTitle: item.title,
          programDescription: item.description,
          roleTitle: role,
          groupName: roleGroupName,
          isMyGroup: false,
          neededCount: 1,
          confirmedCount: 1,
          isFullyCovered: true,
          hasForfall: false,
          assignedPersons: [
            {
              person: { id: `resp-${index}`, name: responsiblePersonName, globalRole: "member" },
              statusLabel: "Bekreftet",
              response: "confirmed",
            },
          ],
        });
      }
    });

    // 3. Add any remaining tasks that were not matched to the program
    tasksWithDetails.forEach((td, idx) => {
      if (!usedTaskIds.has(td.task.id)) {
        rows.push({
          id: `task-extra-${td.task.id}-${idx}`,
          time: "Under arrangementet",
          programTitle: "Gjennomføring av arrangementet",
          programDescription: td.task.description,
          roleTitle: td.task.title,
          groupName: td.taskGroup?.name || (td.isMyGroup ? group?.name || "Min gruppe" : "Gruppe"),
          isMyGroup: td.isMyGroup,
          task: td.task,
          neededCount: td.neededCount || 1,
          confirmedCount: td.confirmedPersonsCount,
          isFullyCovered: td.isFullyCovered,
          hasForfall: td.hasWithdrawn || td.task.status === "vacant",
          assignedPersons: td.assignedPersons,
          instruction: td.task.instruction || td.task.description,
        });
      }
    });

    // Sort chronologically by time
    return rows.sort((a, b) => {
      const timeA = a.time.replace(/[^0-9:]/g, "") || "99:99";
      const timeB = b.time.replace(/[^0-9:]/g, "") || "99:99";
      return timeA.localeCompare(timeB);
    });
  }, [gathering, tasksWithDetails, programSchedule, group]);

  // Filtered rows based on user filter
  const filteredSchedule = useMemo(() => {
    return integratedSchedule.filter((row) => {
      if (viewFilter === "my-group") {
        return row.isMyGroup;
      }
      if (viewFilter === "needs-action") {
        return !row.isFullyCovered || row.hasForfall;
      }
      return true;
    });
  }, [integratedSchedule, viewFilter]);

  // Overall staffing stats for gathering
  const totalTasks = tasksWithDetails.length;
  const vacantTasks = tasksWithDetails.filter((t) => t.task.status === "vacant" || t.hasWithdrawn);
  const coveredTasks = tasksWithDetails.filter((t) => t.isFullyCovered);
  const myGroupTasks = tasksWithDetails.filter((t) => t.isMyGroup);
  const myGroupNeedsAction = myGroupTasks.filter((t) => !t.isFullyCovered || t.hasWithdrawn);

  // If unauthorized or not found
  if (!gathering || !hasAccess) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto text-amber-600 border border-amber-200">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800">
              Dette området er for gruppeledere
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
              {!gathering
                ? "Arrangementet ble ikke funnet."
                : `Du har ikke tilgang til dette arrangementet som leder. Logg inn som gruppeleder eller administrator.`}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/leder"
              id="btn-back-to-leader-denied"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              Tilbake til Gruppeleder-oversikt
            </Link>
            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-700 font-medium py-1"
            >
              Gå til Min side
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isArrangement = gathering.type === "arrangement" || !gathering.type;

  // Direct assign handler
  const handleDirectAssign = async (taskId: string, personId: string, personName: string) => {
    const res = await assignTaskToPerson(taskId, personId, "confirmed");
    if (res.success) {
      setActiveInterveneTaskId(null);
      showToast(`Oppgaven ble direkte tildelt ${personName}!`);
    } else {
      showToast(res.error || "Kunne ikke tildele oppgaven.");
    }
  };

  // Status changer for existing assignment
  const handleStatusChange = (assignmentId: string, newResponse: "confirmed" | "pending" | "withdrawn" | "declined", personName?: string) => {
    const res = updateAssignmentStatus(assignmentId, newResponse);
    if (res.success) {
      setActivePersonActionId(null);
      const label =
        newResponse === "confirmed"
          ? "Akseptert"
          : newResponse === "pending"
          ? "Forespurt"
          : newResponse === "withdrawn"
          ? "Forfall"
          : "Avslått";
      showToast(`Status for ${personName || "personen"} ble endret til ${label}.`);
    } else {
      showToast(res.error || "Kunne ikke oppdatere status.");
    }
  };

  // Remove assignment
  const handleRemoveAssignment = (assignmentId: string, personName?: string) => {
    const res = removeAssignment(assignmentId);
    if (res.success) {
      setActivePersonActionId(null);
      showToast(`${personName || "Personen"} ble fjernet fra oppgaven.`);
    } else {
      showToast(res.error || "Kunne ikke fjerne personen.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* HEADER & NAV */}
      <header className="bg-white px-5 pt-4 pb-4 border-b border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/leder"
              id="btn-back-to-leader-nav"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Gruppeleder</span>
            </Link>
            {group && (
              <>
                <span className="text-slate-300">/</span>
                <Link
                  to={`/leder/gruppe/${group.id}`}
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
                >
                  {group.name}
                </Link>
              </>
            )}
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              isLeader
                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                : isDeputy
                ? "bg-blue-100 text-blue-800 border border-blue-200"
                : "bg-indigo-100 text-indigo-800 border border-indigo-200"
            }`}
          >
            {isLeader ? "Gruppeleder" : isDeputy ? "Nestleder" : "Admin"}
          </span>
        </div>

        {/* Title, type & context */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {gathering.title}
            </h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                isArrangement
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : "bg-purple-50 text-purple-700 border border-purple-200"
              }`}
            >
              {isArrangement ? "Arrangement / Gudstjeneste" : "Gruppesamling"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              {formatNorwegianDateTime(gathering.startsAt)}
            </span>
            {gathering.location && (
              <>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {gathering.location}
                </span>
              </>
            )}
            {group && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  Min gruppe: {group.name}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* TOAST FEEDBACK */}
      {toastMessage && (
        <div
          id="gathering-detail-toast"
          className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="p-4 sm:p-6 space-y-5">
        {/* BEMANNINGSSTATUS BAROMETER FOR SAMLINGEN */}
        <section
          id="section-staffing-barometer"
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            vacantTasks.length > 0
              ? "bg-red-50/80 border-red-200 ring-1 ring-red-100"
              : coveredTasks.length === totalTasks && totalTasks > 0
              ? "bg-emerald-50/80 border-emerald-200"
              : "bg-amber-50/80 border-amber-200"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                {vacantTasks.length > 0 ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                ) : coveredTasks.length === totalTasks && totalTasks > 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {vacantTasks.length > 0
                    ? "Krever oppfølging / Forfall meldt"
                    : coveredTasks.length === totalTasks && totalTasks > 0
                    ? "Fullt bemannet arrangement"
                    : "Mangler frivillige"}
                </h2>
              </div>
              <p className="text-xs text-slate-600">
                {vacantTasks.length > 0
                  ? `${vacantTasks.length} oppgave(r) har forfall eller mangler vikar. Tildel direkte fra gruppen i listen under.`
                  : coveredTasks.length === totalTasks && totalTasks > 0
                  ? "Alle oppgaver og roller for arrangementet er besatt og bekreftet."
                  : `${totalTasks - coveredTasks.length} oppgave(r) venter på tildeling eller bekreftelse.`}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-bold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                {coveredTasks.length} av {totalTasks} oppgaver dekket
              </span>
              {myGroupTasks.length > 0 && (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-1.5 rounded-xl border border-emerald-200">
                  Min gruppe: {myGroupTasks.filter((t) => t.isFullyCovered).length}/{myGroupTasks.length}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* INTEGRERT KJØREPLAN OG BEMANNING (HVEM GJØR HVA) */}
        <section
          id="section-integrated-schedule"
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
          aria-labelledby="schedule-heading"
        >
          {/* Section Header & Filter Controls */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2
                id="schedule-heading"
                className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Program & Kjøreplan • Hvem gjør hva</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Sammenheng mellom tidspunkt, programpunkter, roller, personer og status
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
              <button
                type="button"
                id="filter-tab-all"
                onClick={() => setViewFilter("all")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                  viewFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Hele programmet ({integratedSchedule.length})
              </button>

              <button
                type="button"
                id="filter-tab-my-group"
                onClick={() => setViewFilter("my-group")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer text-xs ${
                  viewFilter === "my-group"
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                Min gruppe ({integratedSchedule.filter((r) => r.isMyGroup).length})
              </button>

              {vacantTasks.length > 0 && (
                <button
                  type="button"
                  id="filter-tab-needs-action"
                  onClick={() => setViewFilter("needs-action")}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer text-xs flex items-center gap-1 ${
                    viewFilter === "needs-action"
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-white text-red-600 hover:bg-red-50 border border-red-200"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Forfall / Mangler</span>
                </button>
              )}
            </div>
          </div>

          {/* Schedule Table / List */}
          {filteredSchedule.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <p>Ingen programpunkter eller oppgaver matcher valgt visningsfilter.</p>
              <button
                type="button"
                onClick={() => setViewFilter("all")}
                className="text-emerald-700 font-bold hover:underline cursor-pointer"
              >
                Vis hele programmet
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredSchedule.map((row) => {
                const isIntervening = activeInterveneTaskId === row.task?.id;
                const hasTask = Boolean(row.task);

                return (
                  <div
                    key={row.id}
                    id={`schedule-row-${row.id}`}
                    className={`p-3.5 sm:p-4 transition-colors hover:bg-slate-50/60 ${
                      row.hasForfall
                        ? "bg-red-50/25"
                        : row.isMyGroup
                        ? "bg-emerald-50/15"
                        : ""
                    }`}
                  >
                    {/* Main Row Grid: Desktop friendly & Mobile friendly */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Time & Program Item */}
                      <div className="flex items-start gap-3 min-w-[240px] flex-1">
                        <div className="px-2.5 py-1 bg-slate-100 text-slate-800 font-mono font-bold text-xs rounded-lg border border-slate-200/80 shrink-0">
                          {row.time}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">
                              {row.programTitle}
                            </span>
                            {row.isMyGroup && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                                Min gruppe
                              </span>
                            )}
                          </div>
                          {row.programDescription && (
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                              {row.programDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Middle: Role & Group Tag */}
                      <div className="sm:min-w-[180px] flex-1">
                        <div className="text-xs">
                          <span className="font-bold text-slate-800">{row.roleTitle}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {row.groupName}
                          </span>
                        </div>
                      </div>

                      {/* Right: Assigned Person(s) + Status Dots/Badges */}
                      <div className="flex items-center justify-between sm:justify-end gap-2.5 min-w-[200px] flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {row.assignedPersons.length > 0 ? (
                            row.assignedPersons.map((ap, pIdx) => {
                              const isConfirmed = ap.response === "confirmed";
                              const isForfall = ap.response === "withdrawn";
                              const isPending = ap.response === "pending";
                              const isDeclined = ap.response === "declined";

                              return (
                                <div
                                  key={ap.assignment?.id || `person-${pIdx}`}
                                  className="relative inline-flex items-center"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (ap.assignment && row.isMyGroup) {
                                        setActivePersonActionId(
                                          activePersonActionId === ap.assignment.id ? null : ap.assignment.id
                                        );
                                      }
                                    }}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                      isForfall
                                        ? "bg-red-100 text-red-800 border border-red-200"
                                        : isConfirmed
                                        ? "bg-slate-100 hover:bg-slate-200/80 text-slate-800 border border-slate-200"
                                        : isPending
                                        ? "bg-amber-50 text-amber-900 border border-amber-200"
                                        : "bg-slate-100 text-slate-500 border border-slate-200 line-through"
                                    } ${row.isMyGroup && ap.assignment ? "cursor-pointer" : "cursor-default"}`}
                                  >
                                    {/* Visual compact dot indicator */}
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        isForfall
                                          ? "bg-red-500 animate-pulse"
                                          : isConfirmed
                                          ? "bg-emerald-500"
                                          : isPending
                                          ? "bg-amber-500"
                                          : "bg-slate-400"
                                      }`}
                                    />
                                    <span>{ap.person?.name || "Ukjent"}</span>

                                    {/* Status tag */}
                                    <span
                                      className={`text-[9px] font-bold px-1 py-0.2 rounded uppercase ${
                                        isForfall
                                          ? "bg-red-200 text-red-900"
                                          : isConfirmed
                                          ? "text-emerald-700"
                                          : isPending
                                          ? "bg-amber-200 text-amber-900"
                                          : "text-slate-500"
                                      }`}
                                    >
                                      {ap.statusLabel}
                                    </span>
                                  </button>

                                  {/* Quick Person Action Popover (for group leader) */}
                                  {activePersonActionId === ap.assignment?.id && (
                                    <div
                                      id={`popover-person-${ap.assignment.id}`}
                                      className="absolute right-0 top-full mt-1 z-30 w-48 bg-slate-900 text-white rounded-xl shadow-xl p-2 space-y-1 text-xs border border-slate-700 animate-in fade-in zoom-in-95"
                                    >
                                      <div className="px-2 py-1 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400">
                                        Endre status: {ap.person?.name}
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(ap.assignment!.id, "confirmed", ap.person?.name)}
                                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 text-emerald-400 font-semibold flex items-center justify-between cursor-pointer"
                                      >
                                        <span>Sett som Akseptert</span>
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(ap.assignment!.id, "pending", ap.person?.name)}
                                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 text-amber-400 font-semibold flex items-center justify-between cursor-pointer"
                                      >
                                        <span>Sett som Forespurt</span>
                                        <Clock className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(ap.assignment!.id, "withdrawn", ap.person?.name)}
                                        className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-800 text-red-400 font-semibold flex items-center justify-between cursor-pointer"
                                      >
                                        <span>Meld Forfall</span>
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                      </button>
                                      <div className="border-t border-slate-800 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveAssignment(ap.assignment!.id, ap.person?.name)}
                                          className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-red-950 text-red-300 flex items-center justify-between cursor-pointer"
                                        >
                                          <span>Fjern fra oppgave</span>
                                          <UserX className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <span className="text-xs text-slate-400 italic px-2 py-1 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                              Ingen tildelt
                            </span>
                          )}
                        </div>

                        {/* Staffing Ratio & Action Buttons */}
                        <div className="flex items-center gap-1.5">
                          {hasTask && (
                            <span
                              className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                row.hasForfall
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : row.isFullyCovered
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {row.confirmedCount}/{row.neededCount}
                            </span>
                          )}

                          {/* "Vis instruks" button on demand */}
                          {row.instruction && (
                            <button
                              type="button"
                              id={`btn-view-instruction-${row.id}`}
                              onClick={() =>
                                setViewInstructionTask({
                                  title: row.roleTitle,
                                  instruction: row.instruction!,
                                  time: row.time,
                                })
                              }
                              title="Vis instruks for denne rollen"
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span className="hidden sm:inline">Instruks</span>
                            </button>
                          )}

                          {/* "Tildel / Grip inn" direct action button */}
                          {row.task && (!row.isFullyCovered || row.hasForfall) && (
                            <button
                              type="button"
                              id={`btn-intervene-row-${row.task.id}`}
                              onClick={() =>
                                setActiveInterveneTaskId(isIntervening ? null : row.task!.id)
                              }
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs ${
                                row.hasForfall
                                  ? "bg-red-600 hover:bg-red-700 text-white"
                                  : "bg-emerald-700 hover:bg-emerald-800 text-white"
                              }`}
                            >
                              <UserPlus className="w-3 h-3" />
                              <span>{row.hasForfall ? "Grip inn" : "Tildel"}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Inline Quick Assign Drawer for this task */}
                    {isIntervening && row.task && (
                      <div
                        id={`drawer-intervene-${row.task.id}`}
                        className="mt-3 p-3.5 bg-slate-900 text-white rounded-xl space-y-2.5 animate-in fade-in zoom-in-95 duration-150 shadow-md border border-slate-700"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">
                              Lederhandling • Direkte tildeling
                            </span>
                            <p className="text-xs font-semibold text-slate-200">
                              Velg person som skal utføre: {row.roleTitle}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveInterveneTaskId(null)}
                            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 cursor-pointer"
                          >
                            Lukk
                          </button>
                        </div>

                        {/* List members to select from */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                          {groupMembers.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              id={`btn-quick-assign-${row.task!.id}-${member.id}`}
                              onClick={() => handleDirectAssign(row.task!.id, member.id, member.name)}
                              className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-left rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center justify-between group cursor-pointer border border-slate-700/80"
                            >
                              <div className="space-y-0.5">
                                <span className="font-semibold text-white block">{member.name}</span>
                                {member.phone && (
                                  <span className="text-[10px] text-slate-400 block">{member.phone}</span>
                                )}
                              </div>
                              <UserCheck className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* QUICK LINK TO GROUP VIEW */}
        {group && (
          <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200/80 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700">
                Se semesteroversikt og andre arrangementer for {group.name}
              </span>
            </div>
            <Link
              to={`/leder/gruppe/${group.id}`}
              id="link-to-group-detail"
              className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <span>Åpne gruppe</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* INSTRUCTION MODAL (ON DEMAND) */}
      {viewInstructionTask && (
        <div
          id="modal-task-instruction"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Oppgaveinstruks • {viewInstructionTask.time}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {viewInstructionTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewInstructionTask(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {viewInstructionTask.instruction}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                id="btn-close-instruction-modal"
                onClick={() => setViewInstructionTask(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-colors"
              >
                Lukk instruks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
