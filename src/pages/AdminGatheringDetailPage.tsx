import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  useAdminGatheringDetail,
  formatNorwegianDateTime,
  GROUP_CATEGORIES,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import {
  Shield,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileText,
  User,
  ChevronRight,
  Save,
  CheckSquare,
  Sparkles,
} from "lucide-react";

export const AdminGatheringDetailPage: React.FC = () => {
  const { gatheringId } = useParams<{ gatheringId: string }>();

  const {
    isAdmin,
    currentUser,
    gathering,
    group,
    tasksWithDetails,
    updateTaskNeededCount,
    updateTaskInstruction,
  } = useAdminGatheringDetail(gatheringId || "");

  // Local state for editing task instructions or needed count inline
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editInstruction, setEditInstruction] = useState<string>("");
  const [editNeededCount, setEditNeededCount] = useState<string>("");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const startEdit = (taskId: string, currentInstruction?: string, currentNeededCount?: number) => {
    setEditingTaskId(taskId);
    setEditInstruction(currentInstruction || "");
    setEditNeededCount(currentNeededCount !== undefined ? String(currentNeededCount) : "");
  };

  const handleSaveInline = (taskId: string) => {
    let parsedCount: number | undefined = undefined;
    if (editNeededCount.trim() !== "") {
      const num = parseInt(editNeededCount.trim(), 10);
      if (isNaN(num) || num < 0) {
        showFeedback("Behov må være et gyldig positivt tall eller tomt.", "error");
        return;
      }
      parsedCount = num;
    }

    const countRes = updateTaskNeededCount(taskId, parsedCount);
    const instrRes = updateTaskInstruction(taskId, editInstruction);

    if (countRes.success && instrRes.success) {
      showFeedback("Oppgaven ble oppdatert!");
      setEditingTaskId(null);
    } else {
      showFeedback(countRes.error || instrRes.error || "Kunne ikke oppdatere oppgave.", "error");
    }
  };

  // Access check
  if (!isAdmin) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Admin-tilgang kreves</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til samlingsplanlegging i admin-flaten.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til Min side
          </Link>
        </div>
      </div>
    );
  }

  // Not found
  if (!gathering) {
    return (
      <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
        <UserQuickSwitcherBar />
        <div className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Fant ikke samlingen</h3>
          <p className="text-xs text-slate-500">Samlingen kan være slettet eller ID-en er ugyldig.</p>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til Admin-oversikt
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = group
    ? GROUP_CATEGORIES.find((c) => c.id === (group.category || "tjenestegruppe"))?.label || "Tjenestegruppe"
    : "Tjenestegruppe";

  const totalTasks = tasksWithDetails.length;
  const fullyCoveredTasks = tasksWithDetails.filter((t) => t.isFullyCovered).length;
  const totalMissing = tasksWithDetails.reduce((sum, t) => sum + (t.missingCount || 0), 0);

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Top Navigation */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <Link
          to="/admin"
          id="btn-back-to-admin-from-gathering"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin-oversikt
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
          Samlingsdetaljer
        </span>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          id="admin-gathering-feedback-toast"
          className={`mx-5 mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Gathering Summary Card */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-slate-400">ID: {gathering.id}</span>
            <h1 className="text-lg font-black text-slate-900 leading-snug">{gathering.title}</h1>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{formatNorwegianDateTime(gathering.startsAt)}</span>
            </div>

            {gathering.location && (
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{gathering.location}</span>
              </div>
            )}

            {group && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <Link
                    to={`/admin/gruppe/${group.id}`}
                    className="font-bold text-slate-800 hover:text-indigo-600 transition-colors inline-flex items-center gap-1"
                  >
                    {group.name}
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </Link>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                  {categoryLabel}
                </span>
              </div>
            )}
          </div>

          {/* Bemanning Status Summary Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-medium text-slate-500 block">Oppgaver</span>
              <span className="text-sm font-black text-slate-800">{totalTasks}</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-[10px] font-medium text-emerald-600 block">Fullt dekket</span>
              <span className="text-sm font-black text-emerald-800">{fullyCoveredTasks}</span>
            </div>
            <div className={`p-2 rounded-xl border ${totalMissing > 0 ? "bg-red-50 border-red-100 text-red-800" : "bg-slate-50 border-slate-100 text-slate-700"}`}>
              <span className="text-[10px] font-medium block opacity-80">Mangler</span>
              <span className="text-sm font-black">{totalMissing}</span>
            </div>
          </div>
        </div>

        {/* Tasks Section Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
            Oppgaver og bemanning ({totalTasks})
          </h2>
        </div>

        {/* List of Tasks */}
        <div className="space-y-3">
          {tasksWithDetails.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400">
              Ingen oppgaver er opprettet for denne samlingen ennå.
            </div>
          ) : (
            tasksWithDetails.map(
              ({
                task,
                neededCount,
                assignedPersons,
                confirmedPersonsCount,
                isFullyCovered,
                missingCount,
                staffingStatusLabel,
              }) => {
                const isEditing = editingTaskId === task.id;

                return (
                  <div
                    key={task.id}
                    id={`gathering-task-card-${task.id}`}
                    className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs"
                  >
                    {/* Title & Status Badge */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">ID: {task.id}</span>
                        <Link
                          to={`/admin/oppgave/${task.id}`}
                          className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors block leading-snug"
                        >
                          {task.title}
                        </Link>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isFullyCovered
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : task.status === "vacant"
                              ? "bg-red-100 text-red-700 border border-red-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {staffingStatusLabel}
                        </span>
                      </div>
                    </div>

                    {/* Staffing Needs and Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Behov</span>
                        <span className="font-bold text-slate-700">
                          {neededCount !== undefined ? `${neededCount} personer` : "Behov ikke satt"}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Bekreftet</span>
                        <span className="font-bold text-slate-700">
                          {confirmedPersonsCount} person{confirmedPersonsCount === 1 ? "" : "er"}
                        </span>
                      </div>
                    </div>

                    {/* Person status overview */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Personstatus for oppgaven
                      </span>
                      {assignedPersons.length === 0 ? (
                        <div className="text-slate-400 italic text-xs py-1 px-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          Ingen personer forespurt eller tildelt.
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {assignedPersons.map(({ person, assignment, statusLabel, response }) => (
                            <div
                              key={assignment.id}
                              className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {person ? (
                                  <Link
                                    to={`/admin/person/${person.id}`}
                                    className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                                  >
                                    {person.name}
                                  </Link>
                                ) : (
                                  <span className="font-medium text-slate-600">Ukjent person</span>
                                )}
                              </div>

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  response === "confirmed"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : response === "withdrawn"
                                    ? "bg-red-100 text-red-700 border border-red-200"
                                    : response === "declined"
                                    ? "bg-slate-200 text-slate-700"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Role instruction preview or edit mode */}
                    {isEditing ? (
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">
                            Behov (antall personer):
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={editNeededCount}
                            onChange={(e) => setEditNeededCount(e.target.value)}
                            placeholder="F.eks. 2 (eller la stå tomt for 'ikke satt')"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-800 block">
                            Instruks for rollen (Task.instruction):
                          </label>
                          <textarea
                            rows={3}
                            value={editInstruction}
                            onChange={(e) => setEditInstruction(e.target.value)}
                            placeholder="Hva skal personen som har denne rollen gjøre..."
                            className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleSaveInline(task.id)}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Lagre
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingTaskId(null)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-indigo-500" />
                            Instruks for rollen
                          </span>
                          <button
                            type="button"
                            onClick={() => startEdit(task.id, task.instruction, task.neededCount)}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Rediger
                          </button>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-3">
                          {task.instruction || task.description || "Ingen instruks er registrert ennå."}
                        </p>
                      </div>
                    )}

                    {/* Link to Open Task Card */}
                    <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                      <Link
                        to={`/admin/oppgave/${task.id}`}
                        id={`btn-open-task-detail-${task.id}`}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
                      >
                        Åpne oppgavekort
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        to={`/oppgave/${task.id}`}
                        className="text-[10px] text-slate-400 hover:text-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        Frivilligvisning
                      </Link>
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>
    </div>
  );
};
