import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  useAdminDashboard,
  useModuleConfig,
  formatNorwegianDateTime,
  GROUP_CATEGORIES,
} from "../hooks/useAppHooks";
import { UserQuickSwitcherBar } from "../components/UserSwitcher";
import {
  Shield,
  Users,
  FolderKanban,
  CalendarDays,
  ListTodo,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Calendar,
  MessageSquare,
  ChevronRight,
  Repeat,
  Tag,
  UserCheck,
  UserCog,
  UserPlus,
  Phone,
  Mail,
  Sliders,
  Settings,
} from "lucide-react";

export const AdminPage: React.FC = () => {
  const {
    isAdmin,
    currentUser,
    adminPersons,
    adminGroups,
    adminGatherings,
    adminTasks,
    updateGroupName,
    addPerson,
  } = useAdminDashboard();

  const { kalender, meldinger, toggleKalender, toggleMeldinger } = useModuleConfig();
  const [searchParams, setSearchParams] = useSearchParams();

  const validTabs = ["grupper", "personer", "samlinger", "oppgaver", "innstillinger"] as const;
  type AdminTab = typeof validTabs[number];

  const initialTab = (searchParams.get("tab") as AdminTab) || "grupper";
  const [activeTab, setActiveTab] = useState<AdminTab>(
    validTabs.includes(initialTab) ? initialTab : "grupper"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab") as AdminTab;
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editNameInput, setEditNameInput] = useState<string>("");
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Group Category Filter state: 'all' | 'husgruppe' | 'tjenestegruppe'
  const [groupCategoryFilter, setGroupCategoryFilter] = useState<"all" | "husgruppe" | "tjenestegruppe">("all");

  const husGroupsCount = useMemo(
    () => adminGroups.filter((g) => g.group.category === "husgruppe").length,
    [adminGroups]
  );
  const tjenesteGroupsCount = useMemo(
    () => adminGroups.filter((g) => (g.group.category || "tjenestegruppe") === "tjenestegruppe").length,
    [adminGroups]
  );

  const filteredAdminGroups = useMemo(() => {
    if (groupCategoryFilter === "all") return adminGroups;
    return adminGroups.filter((g) => (g.group.category || "tjenestegruppe") === groupCategoryFilter);
  }, [adminGroups, groupCategoryFilter]);

  // New Person Form States
  const [showAddPersonForm, setShowAddPersonForm] = useState<boolean>(false);
  const [newPersonName, setNewPersonName] = useState<string>("");
  const [newPersonPhone, setNewPersonPhone] = useState<string>("");
  const [newPersonEmail, setNewPersonEmail] = useState<string>("");

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleStartEditGroup = (groupId: string, currentName: string) => {
    setEditingGroupId(groupId);
    setEditNameInput(currentName);
  };

  const handleSaveGroupName = (groupId: string) => {
    const res = updateGroupName(groupId, editNameInput);
    if (res.success) {
      showFeedback(`Gruppenavnet ble oppdatert til «${editNameInput.trim()}»!`);
      setEditingGroupId(null);
    } else {
      showFeedback(res.error || "Kunne ikke oppdatere gruppenavn", "error");
    }
  };

  const handleCancelEditGroup = () => {
    setEditingGroupId(null);
    setEditNameInput("");
  };

  const handleCreatePerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) {
      showFeedback("Navn må fylles ut.", "error");
      return;
    }

    const res = addPerson({
      name: newPersonName.trim(),
      phone: newPersonPhone.trim() || undefined,
      email: newPersonEmail.trim() || undefined,
    });

    if (res.success && res.person) {
      showFeedback(`${res.person.name} ble opprettet og lagt til i personlisten!`);
      setNewPersonName("");
      setNewPersonPhone("");
      setNewPersonEmail("");
      setShowAddPersonForm(false);
    } else {
      showFeedback(res.error || "Kunne ikke opprette person.", "error");
    }
  };

  // Friendly access denied screen if user is not admin
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
              {currentUser.name} har rollen <span className="font-semibold text-slate-700">«{currentUser.globalRole}»</span> og har ikke tilgang til administrasjonsflaten. Bytt til en bruker med admin-rolle i toppen (f.eks. Kari Nordmann) for å teste.
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

  return (
    <div className="w-full max-w-md mx-auto bg-slate-50 min-h-screen shadow-md sm:my-4 sm:rounded-3xl sm:border sm:border-slate-200/80 overflow-hidden">
      {/* Quick Mock User Switcher Bar */}
      <UserQuickSwitcherBar />

      {/* Top Admin Subheader */}
      <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-700">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-bold text-slate-800">Admin-oversikt</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            to="/admin/settings"
            id="link-admin-settings-top"
            className="text-[11px] font-semibold text-slate-600 hover:text-indigo-700 px-2 py-0.5 rounded-md hover:bg-slate-100 flex items-center gap-1 transition-colors"
          >
            <Settings className="w-3 h-3" />
            Innstillinger
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
            Global Admin ({currentUser.name.split(" ")[0]})
          </span>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          id="admin-feedback-toast"
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
        {/* Section Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto scrollbar-none">
          <button
            type="button"
            id="tab-grupper"
            onClick={() => handleTabChange("grupper")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "grupper"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Grupper ({adminGroups.length})
          </button>
          <button
            type="button"
            id="tab-personer"
            onClick={() => handleTabChange("personer")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "personer"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Personer ({adminPersons.length})
          </button>
          <button
            type="button"
            id="tab-samlinger"
            onClick={() => handleTabChange("samlinger")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "samlinger"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Samlinger ({adminGatherings.length})
          </button>
          <button
            type="button"
            id="tab-oppgaver"
            onClick={() => handleTabChange("oppgaver")}
            className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "oppgaver"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            Oppgaver ({adminTasks.length})
          </button>
          <button
            type="button"
            id="tab-innstillinger"
            onClick={() => handleTabChange("innstillinger")}
            className={`py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1 ${
              activeTab === "innstillinger"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Innstillinger
          </button>
        </div>

        {/* TAB 1: GRUPPER & GRUPPEADMINISTRASJON */}
        {activeTab === "grupper" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Grupper & administrasjon
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {filteredAdminGroups.length} av {adminGroups.length} grupper
              </span>
            </div>

            {/* Kategori-filter for admin: Alle | Husfellesskap | Tjenestegrupper */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                id="btn-admin-filter-group-all"
                onClick={() => setGroupCategoryFilter("all")}
                className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  groupCategoryFilter === "all"
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Alle</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700">
                  {adminGroups.length}
                </span>
              </button>

              <button
                type="button"
                id="btn-admin-filter-group-husgruppe"
                onClick={() => setGroupCategoryFilter("husgruppe")}
                className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  groupCategoryFilter === "husgruppe"
                    ? "bg-white text-emerald-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Husfellesskap</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {husGroupsCount}
                </span>
              </button>

              <button
                type="button"
                id="btn-admin-filter-group-tjenestegruppe"
                onClick={() => setGroupCategoryFilter("tjenestegruppe")}
                className={`flex-1 py-1.5 px-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  groupCategoryFilter === "tjenestegruppe"
                    ? "bg-white text-indigo-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Tjenestegrupper</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800">
                  {tjenesteGroupsCount}
                </span>
              </button>
            </div>

            {filteredAdminGroups.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                Ingen grupper matcher valgt kategori.
              </div>
            ) : (
              filteredAdminGroups.map(({ group, leaders, deputyLeaders, members, tasksCount }) => {
              const categoryLabel =
                GROUP_CATEGORIES.find((c) => c.id === (group.category || "tjenestegruppe"))?.label ||
                "Tjenestegruppe";

              return (
                <div
                  key={group.id}
                  id={`admin-group-card-${group.id}`}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2.5 shadow-xs transition-all hover:border-indigo-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    {editingGroupId === group.id ? (
                      <div className="flex-1 space-y-2">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Nytt gruppenavn:
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            id={`input-group-name-${group.id}`}
                            value={editNameInput}
                            onChange={(e) => setEditNameInput(e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-800"
                            placeholder="Gruppenavn..."
                            autoFocus
                          />
                          <button
                            type="button"
                            id={`btn-save-group-${group.id}`}
                            onClick={() => handleSaveGroupName(group.id)}
                            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Lagre
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditGroup}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/admin/gruppe/${group.id}`}
                              id={`link-group-title-${group.id}`}
                              className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                            >
                              {group.name}
                            </Link>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {categoryLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {group.id}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            id={`btn-edit-group-${group.id}`}
                            onClick={() => handleStartEditGroup(group.id, group.name)}
                            className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            title="Hurtigendre navn"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <Link
                            to={`/admin/gruppe/${group.id}`}
                            id={`btn-open-group-${group.id}`}
                            className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            Åpne kort
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Leader and Deputy */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        Leder:
                      </span>
                      <p className="font-semibold text-slate-700 mt-0.5 truncate">
                        {leaders.length > 0
                          ? leaders.map((l) => l.name).join(", ")
                          : "Ingen leder"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <UserCog className="w-3 h-3 text-blue-600" />
                        Nestleder:
                      </span>
                      <p className="font-semibold text-slate-700 mt-0.5 truncate">
                        {deputyLeaders && deputyLeaders.length > 0
                          ? deputyLeaders.map((d) => d.name).join(", ")
                          : "Ingen"}
                      </p>
                    </div>
                  </div>

                  {/* Meeting schedule & members */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Repeat className="w-3 h-3 text-indigo-500" />
                        Møteplan:
                      </span>
                      <p className="text-slate-700 font-medium mt-0.5 truncate">
                        {group.meetingSchedule
                          ? `${group.meetingSchedule.weekday} ${group.meetingSchedule.time}, ${group.meetingSchedule.frequency}`
                          : "Ikke angitt"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        Medlemmer ({members.length}):
                      </span>
                      <p className="text-slate-600 mt-0.5 truncate">
                        {members.map((m) => m.name.split(" ")[0]).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              );
            }))}
          </div>
        )}

        {/* TAB 2: PERSONER & PERSONKORT */}
        {activeTab === "personer" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Personer ({adminPersons.length})
              </h3>
              <button
                type="button"
                id="btn-toggle-add-person"
                onClick={() => setShowAddPersonForm((prev) => !prev)}
                className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {showAddPersonForm ? "Lukk skjema" : "Legg til person"}
              </button>
            </div>

            {/* Add Person Form */}
            {showAddPersonForm && (
              <form
                onSubmit={handleCreatePerson}
                id="form-add-person"
                className="p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-200/80 space-y-3 shadow-xs animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between border-b border-indigo-100 pb-1.5">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-indigo-700" />
                    Registrer ny person
                  </span>
                  <span className="text-[10px] text-indigo-700 font-medium">
                    globalRole: member
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label
                      htmlFor="input-new-person-name"
                      className="text-[11px] font-bold text-slate-700 block mb-0.5"
                    >
                      Navn <span className="text-red-500">*</span>:
                    </label>
                    <input
                      type="text"
                      id="input-new-person-name"
                      value={newPersonName}
                      onChange={(e) => setNewPersonName(e.target.value)}
                      placeholder="F.eks. Jonas Lie"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor="input-new-person-phone"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        Mobil:
                      </label>
                      <input
                        type="tel"
                        id="input-new-person-phone"
                        value={newPersonPhone}
                        onChange={(e) => setNewPersonPhone(e.target.value)}
                        placeholder="999 88 777"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="input-new-person-email"
                        className="text-[11px] font-semibold text-slate-700 block mb-0.5"
                      >
                        E-post:
                      </label>
                      <input
                        type="email"
                        id="input-new-person-email"
                        value={newPersonEmail}
                        onChange={(e) => setNewPersonEmail(e.target.value)}
                        placeholder="jonas@eksempel.no"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddPersonForm(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
                  >
                    Avbryt
                  </button>
                  <button
                    type="submit"
                    id="btn-submit-add-person"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Lagre person
                  </button>
                </div>
              </form>
            )}

            {/* List of Persons */}
            {adminPersons.map(({ person, groups: pGroups, leaderInGroups, deputyInGroups }) => (
              <div
                key={person.id}
                id={`admin-person-card-${person.id}`}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-xs transition-all hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/admin/person/${person.id}`}
                        id={`link-person-name-${person.id}`}
                        className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                      >
                        {person.name}
                      </Link>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                          person.globalRole === "admin"
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {person.globalRole}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {person.id}</span>
                  </div>

                  <Link
                    to={`/admin/person/${person.id}`}
                    id={`btn-open-person-${person.id}`}
                    className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    Åpne personkort
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {/* Contact info: Mobil and E-post */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-1 text-slate-600 truncate">
                    <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{person.phone || "Ingen mobil"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-600 truncate">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{person.email || "Ingen e-post"}</span>
                  </div>
                </div>

                {/* Group memberships & roles */}
                <div className="pt-1.5 border-t border-slate-100 text-xs space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-slate-500">Grupper ({pGroups.length}):</span>
                    <span className="font-semibold text-slate-700 text-right truncate max-w-[200px]">
                      {pGroups.length > 0
                        ? pGroups.map((g) => g.name).join(", ")
                        : "Ingen grupper"}
                    </span>
                  </div>
                  {leaderInGroups.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        Leder for:
                      </span>
                      <span className="font-bold text-emerald-800 text-right">
                        {leaderInGroups.map((g) => g.name).join(", ")}
                      </span>
                    </div>
                  )}
                  {deputyInGroups && deputyInGroups.length > 0 && (
                    <div className="flex items-start justify-between">
                      <span className="text-blue-700 font-medium flex items-center gap-1">
                        <UserCog className="w-3 h-3" />
                        Nestleder for:
                      </span>
                      <span className="font-bold text-blue-800 text-right">
                        {deputyInGroups.map((g) => g.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: SAMLINGER & BEMANNINGSSTATUS */}
        {activeTab === "samlinger" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Samlinger & samlingsplanlegging
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Klikk på en samling for detaljvisning
              </span>
            </div>

            {adminGatherings.map(({ gathering, group, tasks: gTasks, totalTasks, coveredTasksCount, missingStaffingCount, staffing }) => (
              <div
                key={gathering.id}
                id={`admin-gathering-card-${gathering.id}`}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs transition-all hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/admin/samling/${gathering.id}`}
                      id={`link-gathering-title-${gathering.id}`}
                      className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors block"
                    >
                      {gathering.title}
                    </Link>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {formatNorwegianDateTime(gathering.startsAt)} • {group?.name || "Ukjent gruppe"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {missingStaffingCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Mangler {missingStaffingCount}
                      </span>
                    )}
                    <Link
                      to={`/admin/samling/${gathering.id}`}
                      id={`btn-open-gathering-${gathering.id}`}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Åpne samling
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Oppgaver ({gTasks.length}):
                  </span>
                  <div className="space-y-1">
                    {gTasks.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between text-xs py-0.5"
                      >
                        <Link
                          to={`/admin/oppgave/${t.id}`}
                          className="text-slate-700 hover:text-indigo-600 font-medium transition-colors truncate max-w-[210px]"
                        >
                          {t.title}
                        </Link>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              t.status === "confirmed"
                                ? "text-emerald-700 bg-emerald-50"
                                : t.status === "vacant"
                                ? "text-red-700 bg-red-50"
                                : "text-amber-800 bg-amber-50"
                            }`}
                          >
                            {t.neededCount !== undefined ? `Behov: ${t.neededCount}` : "Behov ikke satt"}
                          </span>
                          <Link
                            to={`/admin/oppgave/${t.id}`}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                          >
                            Kort →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: OPPGAVER & TILDELINGER */}
        {activeTab === "oppgaver" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Alle oppgaver i mock-state
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Klikk på en oppgave for oppgavekort
              </span>
            </div>

            {adminTasks.map(({ task, gathering, group, assignedPerson, assignedPersonsList, isFullyCovered, missingCount }) => (
              <div
                key={task.id}
                id={`admin-task-card-${task.id}`}
                className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-xs transition-all hover:border-indigo-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/admin/oppgave/${task.id}`}
                      id={`link-task-title-${task.id}`}
                      className="text-sm font-bold text-slate-800 hover:text-indigo-600 transition-colors block truncate"
                    >
                      {task.title}
                    </Link>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {group && (
                        <Link
                          to={`/admin/gruppe/${group.id}`}
                          className="hover:text-indigo-600 transition-colors font-medium text-slate-600"
                        >
                          {group.name}
                        </Link>
                      )}
                      {group && gathering && <span>•</span>}
                      {gathering && (
                        <Link
                          to={`/admin/samling/${gathering.id}`}
                          className="hover:text-indigo-600 transition-colors text-slate-500"
                        >
                          {gathering.title}
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isFullyCovered
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : task.status === "vacant"
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {task.neededCount !== undefined
                        ? isFullyCovered
                          ? "Fullt dekket"
                          : `Mangler: ${missingCount}`
                        : task.status === "confirmed"
                        ? "Dekket"
                        : task.status === "vacant"
                        ? "Trenger vikar"
                        : "Ledig oppgave"}
                    </span>
                    <Link
                      to={`/admin/oppgave/${task.id}`}
                      id={`btn-open-task-${task.id}`}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/60 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Åpne kort
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {task.neededCount !== undefined ? `Behov: ${task.neededCount} pers.` : "Behov: Ikke satt"}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {assignedPerson ? (
                      <Link
                        to={`/admin/person/${assignedPerson.id}`}
                        id={`link-task-person-${task.id}`}
                        className="hover:text-indigo-600 transition-colors"
                      >
                        {assignedPerson.name}
                      </Link>
                    ) : (
                      <span className="text-slate-400 italic">Ingen (ubesatt)</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5: INNSTILLINGER (VALGFRIE MODULER) */}
        {activeTab === "innstillinger" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Innstillinger & valgfrie moduler
              </h3>
              <Link
                to="/admin/settings"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
              >
                Gå til /admin/settings
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
              <p className="text-xs text-slate-600 leading-relaxed">
                Herfra kan admin styre om valgfrie tilleggsmoduler (Kalender og Meldinger) skal være aktivert i grensesnittet.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Kalender:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${kalender === "on" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
                      {kalender.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Meldinger:</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${meldinger === "on" ? "bg-blue-100 text-blue-800" : "bg-slate-200 text-slate-600"}`}>
                      {meldinger.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/admin/settings"
                id="btn-open-full-settings"
                className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sliders className="w-4 h-4" />
                Åpne innstillingssiden (/admin/settings)
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
