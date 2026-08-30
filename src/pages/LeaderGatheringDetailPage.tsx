import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useLeaderGatheringDetail,
  formatNorwegianDateTime,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { Task, Person } from "../types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Info,
  Check,
  ChevronRight,
  Sparkles,
} from "lucide-react";

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
    groupMembers,
    tasksWithDetails,
    assignTaskToPerson,
  } = useLeaderGatheringDetail(gatheringId || "");

  const [activeInterveneTaskId, setActiveInterveneTaskId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (!gathering || !group || !hasAccess) {
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
                ? "Samlingen ble ikke funnet."
                : `Du har ikke tilgang til denne samlingen. ${currentUser.name} er ikke registrert som leder eller nestleder for ${group?.name || "denne gruppen"}.`}
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

  // Calculate overall staffing summary
  const totalTasks = tasksWithDetails.length;
  const vacantTasks = tasksWithDetails.filter((t) => t.task.status === "vacant");
  const coveredTasks = tasksWithDetails.filter((t) => t.isFullyCovered);

  const handleDirectAssign = async (taskId: string, personId: string, personName: string) => {
    const res = await assignTaskToPerson(taskId, personId);
    if (res.success) {
      setActiveInterveneTaskId(null);
      showToast(`Oppgaven ble direkte tildelt ${personName}!`);
    } else {
      showToast(res.error || "Kunne ikke tildele oppgaven.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Header & Breadcrumbs */}
      <div className="bg-white px-5 pt-4 pb-3 border-b border-slate-100 space-y-2">
        <div className="flex items-center justify-between">
          <Link
            to="/leder"
            id="btn-back-to-leader-nav"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Gruppeleder</span>
          </Link>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
              isLeader
                ? "bg-emerald-100 text-emerald-800"
                : isDeputy
                ? "bg-blue-100 text-blue-800"
                : "bg-indigo-100 text-indigo-800"
            }`}
          >
            {isLeader ? "Gruppeleder" : isDeputy ? "Nestleder" : "Admin"}
          </span>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-slate-900">{gathering.title}</h1>
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
            <Link
              to={`/leder/gruppe/${group.id}`}
              className="text-emerald-700 font-semibold hover:underline"
            >
              {group.name}
            </Link>
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
      </div>

      {/* Toast message */}
      {toastMessage && (
        <div
          id="gathering-detail-toast"
          className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="p-5 space-y-6">
        {/* BEMANNINGSSTATUS BAROMETER FOR SAMLINGEN */}
        <section aria-labelledby="gathering-status-heading">
          <h2 id="gathering-status-heading" className="sr-only">
            Bemanningsstatus for samlingen
          </h2>

          <div
            className={`p-4 rounded-2xl border shadow-xs space-y-2 ${
              vacantTasks.length > 0
                ? "bg-red-50/90 border-red-200"
                : coveredTasks.length === totalTasks && totalTasks > 0
                ? "bg-emerald-50/90 border-emerald-200"
                : "bg-amber-50/90 border-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {vacantTasks.length > 0 ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  {vacantTasks.length > 0
                    ? "Krever oppfølging / Vikar mangler"
                    : coveredTasks.length === totalTasks && totalTasks > 0
                    ? "Fullt bemannet"
                    : "Ubesatte oppgaver"}
                </h3>
              </div>

              <span className="text-xs font-bold text-slate-700 bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200/60">
                {coveredTasks.length} av {totalTasks} dekket
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {vacantTasks.length > 0
                ? `Det er meldt forfall på ${vacantTasks.length} oppgave(r). Gruppen kan ta den selv på Min side, eller du kan trykke «Grip inn» for å tildele direkte under.`
                : "Alle oppgaver er tildelt og bekreftet for denne samlingen."}
            </p>
          </div>
        </section>

        {/* OPPGAVELISTER MED INSTRUKS OG BEMANNINGSSTATUS */}
        <section className="space-y-3.5" aria-labelledby="gathering-tasks-heading">
          <div className="flex items-center justify-between">
            <h2 id="gathering-tasks-heading" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Oppgaver på samlingen ({tasksWithDetails.length})
            </h2>
            <span className="text-[11px] text-slate-400 font-medium">
              Detaljert bemanningsstatus
            </span>
          </div>

          <div className="space-y-3.5">
            {tasksWithDetails.map(({ task, neededCount, assignedPersons, confirmedPersonsCount, isFullyCovered, missingCount, staffingStatusLabel }) => {
              const isVacant = task.status === "vacant";
              const isIntervening = activeInterveneTaskId === task.id;

              return (
                <div
                  key={task.id}
                  id={`leader-task-card-${task.id}`}
                  className={`p-4 bg-white rounded-2xl border transition-all space-y-3 ${
                    isVacant
                      ? "border-red-300 shadow-sm ring-1 ring-red-100"
                      : isFullyCovered
                      ? "border-slate-200 shadow-xs"
                      : "border-amber-200 shadow-xs"
                  }`}
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-medium">
                          Behov: <span className="font-bold text-slate-700">{neededCount !== undefined ? `${neededCount} personer` : "Ikke satt"}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isVacant
                              ? "bg-red-100 text-red-700"
                              : isFullyCovered
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {staffingStatusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Grip inn button */}
                    {!isFullyCovered && (
                      <button
                        type="button"
                        id={`btn-leader-intervene-${task.id}`}
                        onClick={() => setActiveInterveneTaskId(isIntervening ? null : task.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs ${
                          isVacant
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        }`}
                      >
                        Grip inn
                      </button>
                    )}
                  </div>

                  {/* Task Instruction / Description */}
                  {(task.instruction || task.description) && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">
                        Instruks / Beskrivelse
                      </span>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {task.instruction || task.description}
                      </p>
                    </div>
                  )}

                  {/* Assigned Persons Status List */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-slate-600 block">
                      Tilknyttede personer ({assignedPersons.length}):
                    </span>

                    {assignedPersons.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Ingen personer har tatt eller blitt forespurt denne oppgaven ennå.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {assignedPersons.map(({ assignment, person, statusLabel, response }) => (
                          <div
                            key={assignment.id}
                            id={`person-status-row-${assignment.id}`}
                            className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                {person ? person.name.charAt(0) : "?"}
                              </div>
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {person ? person.name : "Ukjent person"}
                                </span>
                                {person?.phone && (
                                  <span className="text-[10px] text-slate-400 ml-2">
                                    {person.phone}
                                  </span>
                                )}
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                response === "confirmed"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : response === "withdrawn"
                                  ? "bg-red-100 text-red-700"
                                  : response === "declined"
                                  ? "bg-slate-200 text-slate-600"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {statusLabel}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inline Intervention Form */}
                  {isIntervening && (
                    <div
                      id={`inline-intervene-${task.id}`}
                      className="mt-3 p-3.5 bg-slate-900 text-white rounded-xl space-y-3 animate-in fade-in zoom-in-95 duration-150 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                        <div>
                          <span className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                            Lederhandling • Grip inn
                          </span>
                          <p className="text-xs font-semibold text-slate-200 mt-0.5">
                            Tildel oppgave direkte til et medlem
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveInterveneTaskId(null)}
                          className="text-xs text-slate-400 hover:text-white cursor-pointer px-1 py-0.5 rounded"
                        >
                          Lukk
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {groupMembers.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            id={`btn-assign-gather-task-${task.id}-${member.id}`}
                            onClick={() => handleDirectAssign(task.id, member.id, member.name)}
                            className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-emerald-700 text-left rounded-lg text-xs font-medium text-slate-200 transition-colors flex items-center justify-between group cursor-pointer border border-slate-700"
                          >
                            <span>{member.name}</span>
                            <UserPlus className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
