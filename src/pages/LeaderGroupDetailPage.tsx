import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  useLeaderGroupDetail,
  formatNorwegianDateTime,
  GROUP_CATEGORIES,
  MEETING_FREQUENCIES,
  WEEKDAYS,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import { GroupCategory, MeetingSchedule } from "../types";
import {
  ArrowLeft,
  Users,
  Shield,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const LeaderGroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();

  const {
    hasAccess,
    isLeader,
    isDeputy,
    isAdmin,
    currentUser,
    group,
    leaders,
    deputyLeaders,
    members,
    availablePersonsToAdd,
    groupGatherings,
    messages,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    sendMessage,
  } = useLeaderGroupDetail(groupId || "");

  // Editing state for group basic metadata
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editName, setEditName] = useState(group?.name || "");
  const [editCategory, setEditCategory] = useState<GroupCategory>(group?.category || "tjenestegruppe");
  const [editLeaderId, setEditLeaderId] = useState<string>(group?.leaderIds[0] || "");
  const [editDeputyId, setEditDeputyId] = useState<string>(group?.deputyLeaderIds?.[0] || "");

  // Editing state for meeting schedule
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleWeekday, setScheduleWeekday] = useState(group?.meetingSchedule?.weekday || "Søndag");
  const [scheduleTime, setScheduleTime] = useState(group?.meetingSchedule?.time || "10:00");
  const [scheduleFrequency, setScheduleFrequency] = useState<MeetingSchedule["frequency"]>(
    group?.meetingSchedule?.frequency || "hver uke"
  );

  // Add member selector
  const [selectedPersonToAdd, setSelectedPersonToAdd] = useState<string>("");

  // New message input
  const [newMessageText, setNewMessageText] = useState("");
  const [messageFeedback, setMessageFeedback] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showToast = (text: string) => {
    setActionFeedback(text);
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // If group not found or unauthorized
  if (!group || !hasAccess) {
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
              {!group
                ? "Gruppen ble ikke funnet."
                : `Du har ikke tilgang til å administrere denne gruppen. ${currentUser.name} er ikke registrert som leder eller nestleder for ${group.name}.`}
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/leder"
              id="btn-back-to-leader"
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

  // Handle Meta Save
  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast("Gruppenavn kan ikke være tomt.");
      return;
    }

    const newLeaderIds = editLeaderId ? [editLeaderId] : group.leaderIds;
    const newDeputyIds = editDeputyId ? [editDeputyId] : [];

    const res = updateGroup(group.id, {
      name: editName.trim(),
      category: editCategory,
      leaderIds: newLeaderIds,
      deputyLeaderIds: newDeputyIds,
    });

    if (res.success) {
      setIsEditingMeta(false);
      showToast("Gruppedetaljer ble lagret!");
    }
  };

  // Handle Schedule Save
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateGroup(group.id, {
      meetingSchedule: {
        weekday: scheduleWeekday,
        time: scheduleTime,
        frequency: scheduleFrequency,
      },
    });

    if (res.success) {
      setIsEditingSchedule(false);
      showToast("Møteplan ble oppdatert!");
    }
  };

  // Handle Add Member
  const handleAddMember = () => {
    if (!selectedPersonToAdd) return;
    const res = addGroupMember(group.id, selectedPersonToAdd);
    if (res.success) {
      setSelectedPersonToAdd("");
      showToast("Personen ble lagt til som medlem i gruppen!");
    }
  };

  // Handle Remove Member
  const handleRemoveMember = (personId: string, personName: string) => {
    if (confirm(`Er du sikker på at du vil fjerne ${personName} fra gruppen?`)) {
      const res = removeGroupMember(group.id, personId);
      if (res.success) {
        showToast(`${personName} ble fjernet fra gruppen.`);
      }
    }
  };

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const res = sendMessage(newMessageText);
    if (res.success) {
      setNewMessageText("");
      setMessageFeedback("Beskjeden ble publisert for medlemmene i gruppen.");
      setTimeout(() => setMessageFeedback(null), 3500);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Header & Breadcrumb */}
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

        <div className="flex items-start justify-between gap-2 pt-1">
          <div>
            <h1 className="text-lg font-bold text-slate-900">{group.name}</h1>
            <p className="text-xs text-slate-500 capitalize">
              {group.category || "Tjenestegruppe"} • {members.length} medlemmer
            </p>
          </div>
          {!isEditingMeta && (
            <button
              type="button"
              id="btn-edit-group-meta"
              onClick={() => {
                setEditName(group.name);
                setEditCategory(group.category || "tjenestegruppe");
                setEditLeaderId(group.leaderIds[0] || "");
                setEditDeputyId(group.deputyLeaderIds?.[0] || "");
                setIsEditingMeta(true);
              }}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Rediger</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast feedback */}
      {actionFeedback && (
        <div
          id="group-card-toast"
          className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      <div className="p-5 space-y-6">
        {/* GRUPPEKORT DETALJER / REDIGERING */}
        <section
          id="section-group-details"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gruppedetaljer</span>
          </h2>

          {isEditingMeta ? (
            <form onSubmit={handleSaveMeta} className="space-y-3 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Gruppenavn
                </label>
                <input
                  type="text"
                  id="input-edit-group-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kategori
                </label>
                <select
                  id="select-edit-group-category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as GroupCategory)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                >
                  {GROUP_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Gruppeleder
                  </label>
                  <select
                    id="select-edit-group-leader"
                    value={editLeaderId}
                    onChange={(e) => setEditLeaderId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    <option value="">Velg leder...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Nestleder
                  </label>
                  <select
                    id="select-edit-group-deputy"
                    value={editDeputyId}
                    onChange={(e) => setEditDeputyId(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    <option value="">Ingen nestleder</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  id="btn-save-group-meta"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Lagre endringer
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingMeta(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Hovedleder:</span>
                <span className="font-bold text-slate-800">
                  {leaders.length > 0 ? leaders.map((l) => l.name).join(", ") : "Ingen leder satt"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Nestleder:</span>
                <span className="font-bold text-slate-800">
                  {deputyLeaders.length > 0
                    ? deputyLeaders.map((d) => d.name).join(", ")
                    : "Ingen nestleder satt"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500 font-medium">Kategori:</span>
                <span className="font-bold text-slate-800 capitalize">
                  {group.category || "Tjenestegruppe"}
                </span>
              </div>
            </div>
          )}
        </section>

        {/* MØTEPLAN */}
        <section
          id="section-group-schedule"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fast møteplan</span>
            </h2>
            {!isEditingSchedule && (
              <button
                type="button"
                id="btn-edit-schedule"
                onClick={() => {
                  setScheduleWeekday(group.meetingSchedule?.weekday || "Søndag");
                  setScheduleTime(group.meetingSchedule?.time || "10:00");
                  setScheduleFrequency(group.meetingSchedule?.frequency || "hver uke");
                  setIsEditingSchedule(true);
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                Endre møteplan
              </button>
            )}
          </div>

          {isEditingSchedule ? (
            <form onSubmit={handleSaveSchedule} className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Ukedag
                  </label>
                  <select
                    id="select-schedule-weekday"
                    value={scheduleWeekday}
                    onChange={(e) => setScheduleWeekday(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    {WEEKDAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Tidspunkt
                  </label>
                  <input
                    type="time"
                    id="input-schedule-time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Frekvens
                  </label>
                  <select
                    id="select-schedule-frequency"
                    value={scheduleFrequency}
                    onChange={(e) => setScheduleFrequency(e.target.value as MeetingSchedule["frequency"])}
                    className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                  >
                    {MEETING_FREQUENCIES.map((freq) => (
                      <option key={freq.id} value={freq.id}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  id="btn-save-schedule"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  Lagre møteplan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingSchedule(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Avbryt
                </button>
              </div>
            </form>
          ) : (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium">
              {group.meetingSchedule ? (
                <div className="flex items-center justify-between">
                  <span>
                    {group.meetingSchedule.weekday}er kl. {group.meetingSchedule.time}
                  </span>
                  <span className="text-slate-500 font-normal">
                    ({group.meetingSchedule.frequency})
                  </span>
                </div>
              ) : (
                <span className="text-slate-400 italic">Ingen fast møteplan angitt.</span>
              )}
            </div>
          )}
        </section>

        {/* MEDLEMMER I GRUPPEN */}
        <section
          id="section-group-members"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Medlemmer ({members.length})</span>
            </h2>
          </div>

          {/* Member List */}
          <div className="space-y-2">
            {members.map((member) => {
              const isGroupLeader = group.leaderIds.includes(member.id);
              const isGroupDeputy = group.deputyLeaderIds?.includes(member.id);

              return (
                <div
                  key={member.id}
                  id={`member-row-${member.id}`}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800">{member.name}</span>
                        {isGroupLeader && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Leder
                          </span>
                        )}
                        {isGroupDeputy && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                            Nestleder
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {member.phone || member.email || "Ingen kontaktinfo"}
                      </p>
                    </div>
                  </div>

                  {/* Remove Member button (disabled for main leader to prevent orphan group) */}
                  {!isGroupLeader && (
                    <button
                      type="button"
                      id={`btn-remove-member-${member.id}`}
                      onClick={() => handleRemoveMember(member.id, member.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Fjern fra gruppen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Member form */}
          {availablePersonsToAdd.length > 0 ? (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-semibold text-slate-600 block">
                Legg til person i gruppen:
              </label>
              <div className="flex gap-2">
                <select
                  id="select-add-member"
                  value={selectedPersonToAdd}
                  onChange={(e) => setSelectedPersonToAdd(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-emerald-600 text-slate-800"
                >
                  <option value="">Velg person fra listen...</option>
                  {availablePersonsToAdd.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  id="btn-add-member"
                  onClick={handleAddMember}
                  disabled={!selectedPersonToAdd}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Legg til</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic pt-1">
              Alle registrerte personer er allerede medlemmer i denne gruppen.
            </p>
          )}
        </section>

        {/* SAMLINGSOVERSIKT FOR DENNE GRUPPEN */}
        <section
          id="section-group-gatherings"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Kommende samlinger ({groupGatherings.length})</span>
            </h2>
          </div>

          {groupGatherings.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-2">
              Ingen planlagte samlinger for denne gruppen for øyeblikket.
            </p>
          ) : (
            <div className="space-y-2">
              {groupGatherings.map(({ gathering, tasks: gTasks, staffing }) => {
                const isArrangement = gathering.type === "arrangement" || !gathering.type;

                return (
                  <div
                    key={gathering.id}
                    id={`gathering-item-${gathering.id}`}
                    onClick={() => navigate(`/leder/samling/${gathering.id}`)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between gap-2 cursor-pointer transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                          {gathering.title}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isArrangement
                              ? "bg-blue-50 text-blue-700 border border-blue-100"
                              : "bg-purple-50 text-purple-700 border border-purple-100"
                          }`}
                        >
                          {isArrangement ? "Arrangement" : "Gruppesamling"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {formatNorwegianDateTime(gathering.startsAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          staffing.color === "red"
                            ? "bg-red-100 text-red-700"
                            : staffing.color === "yellow"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {staffing.badgeText}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* BESKJED TIL GRUPPEN */}
        <section
          id="section-group-messages"
          className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Beskjed til gruppen</span>
            </h2>
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
              Synlig for {group.name}
            </span>
          </div>

          {/* Message composer */}
          <form onSubmit={handleSendMessage} className="space-y-2.5">
            <textarea
              id="input-group-message-content"
              rows={2}
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              placeholder="Skriv en beskjed til gruppens medlemmer (f.eks. 'Vi møtes tirsdag kl. 19')..."
              className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-emerald-600 text-slate-800 resize-none"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Publiseres fra {currentUser.name}
              </span>
              <button
                type="submit"
                id="btn-send-group-message"
                disabled={!newMessageText.trim()}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>Send beskjed</span>
              </button>
            </div>
          </form>

          {messageFeedback && (
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{messageFeedback}</span>
            </div>
          )}

          {/* Published Messages Feed */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-600 block">
              Publiserte beskjeder ({messages.length})
            </span>
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Ingen beskjeder publisert til denne gruppen ennå.
              </p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700">{msg.senderName}</span>
                      <span className="text-slate-400">
                        {formatNorwegianDateTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
