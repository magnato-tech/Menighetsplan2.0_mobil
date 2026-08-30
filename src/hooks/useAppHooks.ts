import { useMemo, useState, useEffect, useCallback } from "react";
import { useMockData } from "../context/MockDataContext";
import { Task, Person, Group, Gathering, Assignment, ActionCardModel, QueryResult, BadgeVariant } from "../types";

// Helper function to format Norwegian dates nicely
export function formatNorwegianDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
    const months = ["jan.", "feb.", "mars", "apr.", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${dayName} ${dayNum}. ${monthName} kl. ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

// 1. Hook: useCurrentUser
export function useCurrentUser() {
  const { currentUser, allPersons, currentUserId, setCurrentUserId, getUserGroups } = useMockData();
  const userGroups = useMemo(() => getUserGroups(currentUser.id), [getUserGroups, currentUser.id]);

  return {
    currentUser,
    allPersons,
    currentUserId,
    setCurrentUserId,
    userGroups,
  };
}

// 2. Hook: useMyTasks
export function useMyTasks(): QueryResult<Task[]> {
  const { currentUser, getTasksForPerson, tasks, assignments } = useMockData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myTasks = useMemo(() => {
    return getTasksForPerson(currentUser.id);
  }, [getTasksForPerson, currentUser.id, tasks, assignments]);

  return {
    data: myTasks,
    loading,
    error,
  };
}

// 3. Hook: useOpenTasks
export function useOpenTasks(): QueryResult<Task[]> {
  const { currentUser, getUserGroups, getOpenTasksForGroups, tasks } = useMockData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userGroups = useMemo(() => getUserGroups(currentUser.id), [getUserGroups, currentUser.id]);
  const groupIds = useMemo(() => userGroups.map((g) => g.id), [userGroups]);

  const openTasks = useMemo(() => {
    return getOpenTasksForGroups(groupIds);
  }, [getOpenTasksForGroups, groupIds, tasks]);

  return {
    data: openTasks,
    loading,
    error,
    permissionDenied: false,
  };
}

// 4. Hook: useTaskDetail
export interface TaskDetailResult {
  task: Task | null;
  gathering: Gathering | null;
  group: Group | null;
  assignment: Assignment | null;
  assignedPerson: Person | null;
  isAssignedToMe: boolean;
  canClaim: boolean;
  canReportAbsence: boolean;
  permissionDenied: boolean;
  loading: boolean;
  error: string | null;
  claimTask: () => Promise<{ success: boolean; error?: string }>;
  reportAbsence: () => Promise<{ success: boolean; error?: string }>;
}

export function useTaskDetail(taskId: string | undefined): TaskDetailResult {
  const {
    currentUser,
    getTaskById,
    getGatheringById,
    getGroupById,
    getPersonById,
    getAssignmentForTask,
    isPersonInGroup,
    assignTaskToPerson,
    reportAbsence: performReportAbsence,
    tasks,
    assignments,
  } = useMockData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const task = useMemo(() => {
    if (!taskId) return null;
    return getTaskById(taskId) || null;
  }, [taskId, getTaskById, tasks]);

  const group = useMemo(() => {
    if (!task) return null;
    return getGroupById(task.groupId) || null;
  }, [task, getGroupById]);

  const gathering = useMemo(() => {
    if (!task) return null;
    return getGatheringById(task.gatheringId) || null;
  }, [task, getGatheringById]);

  const assignment = useMemo(() => {
    if (!task) return null;
    return getAssignmentForTask(task.id) || null;
  }, [task, getAssignmentForTask, assignments]);

  const assignedPerson = useMemo(() => {
    if (!assignment) return null;
    return getPersonById(assignment.personId) || null;
  }, [assignment, getPersonById]);

  // Check group membership permission
  const hasGroupAccess = useMemo(() => {
    if (!task) return true;
    return isPersonInGroup(currentUser.id, task.groupId);
  }, [task, currentUser.id, isPersonInGroup]);

  const isAssignedToMe = useMemo(() => {
    return assignment?.personId === currentUser.id && assignment?.response === "confirmed";
  }, [assignment, currentUser.id]);

  const canClaim = useMemo(() => {
    return (
      hasGroupAccess &&
      (task?.status === "open" || task?.status === "vacant") &&
      !isAssignedToMe
    );
  }, [hasGroupAccess, task?.status, isAssignedToMe]);

  const canReportAbsence = useMemo(() => {
    return isAssignedToMe && (task?.status === "confirmed" || task?.status === "assigned");
  }, [isAssignedToMe, task?.status]);

  const claimTask = useCallback(async () => {
    if (!task) return { success: false, error: "Ingen oppgave valgt" };
    return await assignTaskToPerson(task.id, currentUser.id);
  }, [task, currentUser.id, assignTaskToPerson]);

  const reportAbsenceAction = useCallback(async () => {
    if (!task) return { success: false, error: "Ingen oppgave valgt" };
    return await performReportAbsence(task.id, currentUser.id);
  }, [task, currentUser.id, performReportAbsence]);

  const permissionDenied = Boolean(task && !hasGroupAccess);

  return {
    task: permissionDenied ? null : task,
    gathering,
    group,
    assignment,
    assignedPerson,
    isAssignedToMe,
    canClaim,
    canReportAbsence,
    permissionDenied,
    loading,
    error,
    claimTask,
    reportAbsence: reportAbsenceAction,
  };
}

// 5. Hook / Function: useActionCardModel
export function useActionCardModel(task: Task, currentUser: Person): ActionCardModel {
  const { getGatheringById, getGroupById, getAssignmentForTask, getPersonById } = useMockData();

  const gathering = getGatheringById(task.gatheringId);
  const group = getGroupById(task.groupId);
  const assignment = getAssignmentForTask(task.id);
  const assignedPerson = assignment ? getPersonById(assignment.personId) : null;

  const isAssignedToMe = assignment?.personId === currentUser.id && assignment?.response === "confirmed";

  let statusLabel = "Ledig";
  let badgeVariant: BadgeVariant = "neutral";
  let primaryActionLabel: string | undefined = "Ta oppgave";
  let primaryActionType: "claim" | "absence" | "view" | undefined = "claim";

  if (isAssignedToMe) {
    statusLabel = "Din oppgave";
    badgeVariant = "success";
    primaryActionLabel = "Meld forfall";
    primaryActionType = "absence";
  } else if (task.status === "vacant") {
    statusLabel = "Trenger vikar";
    badgeVariant = "urgent";
    primaryActionLabel = "Ta oppgave";
    primaryActionType = "claim";
  } else if (task.status === "open") {
    statusLabel = "Ledig oppgave";
    badgeVariant = "info";
    primaryActionLabel = "Ta oppgave";
    primaryActionType = "claim";
  } else if (task.status === "confirmed" || task.status === "assigned") {
    statusLabel = assignedPerson ? `Tildelt ${assignedPerson.name.split(" ")[0]}` : "Tildelt";
    badgeVariant = "neutral";
    primaryActionLabel = undefined;
    primaryActionType = "view";
  }

  const dateTimeFormatted = gathering
    ? formatNorwegianDateTime(gathering.startsAt)
    : "Tidspunkt ikke satt";

  return {
    id: task.id,
    taskId: task.id,
    title: task.title,
    gatheringTitle: gathering?.title || "Samling",
    dateTimeFormatted,
    groupName: group?.name || "Gruppe",
    location: gathering?.location,
    status: task.status,
    statusLabel,
    badgeVariant,
    primaryActionLabel,
    primaryActionType,
    detailUrl: `/oppgave/${task.id}`,
    isAssignedToMe,
    assignedPersonName: assignedPerson?.name,
  };
}

// 6. Bemanningsbarometer v0 & Gruppeleder helpers
export type StaffingColor = "green" | "yellow" | "red";

export interface StaffingStatusResult {
  color: StaffingColor;
  label: string;
  badgeText: string;
  totalTasks: number;
  coveredCount: number;
  vacantCount: number;
  openCount: number;
  needsAttention: boolean;
}

/**
 * Bemanningsbarometer v0:
 * Utled farge basert på eksisterende statusverdier med fast prioritetsrekkefølge:
 * 1. vacant -> RØD (Trenger oppfølging / forfall)
 * 2. ellers open -> GUL (Ledig oppgave / ubesatt)
 * 3. ellers eksisterende "tatt/bekreftet" (confirmed/assigned) -> GRØNN (Alt er dekket)
 */
export function getStaffingStatus(tasksForGathering: Task[]): StaffingStatusResult {
  const totalTasks = tasksForGathering.length;
  if (totalTasks === 0) {
    return {
      color: "green",
      label: "Ingen oppgaver",
      badgeText: "Ingen oppgaver",
      totalTasks: 0,
      coveredCount: 0,
      vacantCount: 0,
      openCount: 0,
      needsAttention: false,
    };
  }

  const vacantCount = tasksForGathering.filter((t) => t.status === "vacant").length;
  const openCount = tasksForGathering.filter((t) => t.status === "open").length;
  const coveredCount = tasksForGathering.filter(
    (t) => t.status === "confirmed" || t.status === "assigned"
  ).length;

  if (vacantCount > 0) {
    return {
      color: "red",
      label: "Trenger oppfølging",
      badgeText: "Trenger vikar",
      totalTasks,
      coveredCount,
      vacantCount,
      openCount,
      needsAttention: true,
    };
  }

  if (openCount > 0) {
    return {
      color: "yellow",
      label: "Mangler frivillig",
      badgeText: "Ledig oppgave",
      totalTasks,
      coveredCount,
      vacantCount,
      openCount,
      needsAttention: false,
    };
  }

  return {
    color: "green",
    label: "Alt er dekket",
    badgeText: "Dekket",
    totalTasks,
    coveredCount,
    vacantCount,
    openCount,
    needsAttention: false,
  };
}

export interface LeaderGatheringItem {
  gathering: Gathering;
  group: Group;
  tasks: Task[];
  staffing: StaffingStatusResult;
}

export interface LeaderGroupData {
  group: Group;
  members: Person[];
  gatherings: LeaderGatheringItem[];
  totalVacantTasks: number;
  totalOpenTasks: number;
  needsAttention: boolean;
}

// 7. Hook: useLeaderDashboard
export function useLeaderDashboard() {
  const { currentUser, groups, gatherings, tasks, allPersons, assignTaskToPerson } = useMockData();

  // Find groups where current user's ID exists in group.leaderIds OR group.deputyLeaderIds
  const leaderGroups = useMemo(() => {
    return groups.filter(
      (g) =>
        g.leaderIds.includes(currentUser.id) ||
        (g.deputyLeaderIds && g.deputyLeaderIds.includes(currentUser.id)) ||
        currentUser.globalRole === "admin"
    );
  }, [groups, currentUser.id, currentUser.globalRole]);

  const isLeader = leaderGroups.length > 0;

  const leaderData: LeaderGroupData[] = useMemo(() => {
    return leaderGroups.map((group) => {
      // Find members belonging to this group
      const groupMembers = allPersons.filter((p) => group.memberIds.includes(p.id));

      // Find all tasks for this group
      const groupTasks = tasks.filter((t) => t.groupId === group.id);

      // Find gatherings relevant to this group
      const relevantGatheringIds = new Set([
        ...gatherings.filter((g) => g.groupId === group.id).map((g) => g.id),
        ...groupTasks.map((t) => t.gatheringId),
      ]);

      const groupGatherings = gatherings
        .filter((g) => relevantGatheringIds.has(g.id))
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

      const gatheringItems: LeaderGatheringItem[] = groupGatherings.map((gathering) => {
        const tasksForGathering = groupTasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(tasksForGathering);
        return {
          gathering,
          group,
          tasks: tasksForGathering,
          staffing,
        };
      });

      const totalVacantTasks = groupTasks.filter((t) => t.status === "vacant").length;
      const totalOpenTasks = groupTasks.filter((t) => t.status === "open").length;

      return {
        group,
        members: groupMembers,
        gatherings: gatheringItems,
        totalVacantTasks,
        totalOpenTasks,
        needsAttention: totalVacantTasks > 0,
      };
    });
  }, [leaderGroups, gatherings, tasks, allPersons]);

  // All semester gatherings across leader's groups
  const allSemesterGatherings = useMemo(() => {
    const list: LeaderGatheringItem[] = [];
    const seenIds = new Set<string>();

    leaderData.forEach((gd) => {
      gd.gatherings.forEach((gi) => {
        if (!seenIds.has(gi.gathering.id)) {
          seenIds.add(gi.gathering.id);
          list.push(gi);
        }
      });
    });

    return list.sort(
      (a, b) => new Date(a.gathering.startsAt).getTime() - new Date(b.gathering.startsAt).getTime()
    );
  }, [leaderData]);

  const urgentGatherings = useMemo(() => {
    const list: LeaderGatheringItem[] = [];
    for (const gd of leaderData) {
      for (const gi of gd.gatherings) {
        if (gi.staffing.color === "red") {
          list.push(gi);
        }
      }
    }
    return list;
  }, [leaderData]);

  return {
    isLeader,
    leaderGroups,
    leaderData,
    allSemesterGatherings,
    urgentGatherings,
    currentUser,
    assignTaskToPerson,
  };
}

// 8. Hook: useModuleConfig
export function useModuleConfig() {
  const { moduleConfig, setModuleStatus, toggleKalender, toggleMeldinger } = useMockData();

  return {
    moduleConfig,
    kalender: moduleConfig.kalender,
    meldinger: moduleConfig.meldinger,
    isKalenderOn: moduleConfig.kalender === "on",
    isMeldingerOn: moduleConfig.meldinger === "on",
    setModuleStatus,
    toggleKalender,
    toggleMeldinger,
  };
}

// Constants for Group Category and Meeting Schedule
export const GROUP_CATEGORIES: { id: "tjenestegruppe" | "husgruppe" | "strategigruppe" | "ledergruppe"; label: string }[] = [
  { id: "tjenestegruppe", label: "Tjenestegruppe" },
  { id: "husgruppe", label: "Husgruppe" },
  { id: "strategigruppe", label: "Strategigruppe" },
  { id: "ledergruppe", label: "Ledergruppe" },
];

export const MEETING_FREQUENCIES: { id: "hver uke" | "annenhver uke" | "hver måned"; label: string }[] = [
  { id: "hver uke", label: "Hver uke" },
  { id: "annenhver uke", label: "Annenhver uke" },
  { id: "hver måned", label: "Hver måned" },
];

export const WEEKDAYS = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag",
];

// 9. Hook: useAdminDashboard
export function useAdminDashboard() {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    tasks,
    assignments,
    updateGroupName,
    updateGroup,
    addPerson,
    updatePerson,
    getGroupById,
    getGatheringById,
    getPersonById,
    getAssignmentForTask,
    getAllAssignmentsForTask,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";

  const adminPersons = useMemo(() => {
    return allPersons.map((person) => {
      const personGroups = groups.filter((g) => g.memberIds.includes(person.id));
      const leaderInGroups = groups.filter((g) => g.leaderIds.includes(person.id));
      const deputyInGroups = groups.filter((g) => g.deputyLeaderIds?.includes(person.id));
      return {
        person,
        groups: personGroups,
        leaderInGroups,
        deputyInGroups,
      };
    });
  }, [allPersons, groups]);

  const adminGroups = useMemo(() => {
    return groups.map((group) => {
      const leaders = allPersons.filter((p) => group.leaderIds.includes(p.id));
      const deputyLeaders = allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
      const members = allPersons.filter((p) => group.memberIds.includes(p.id));
      const groupTasks = tasks.filter((t) => t.groupId === group.id);
      return {
        group,
        leaders,
        deputyLeaders,
        members,
        tasksCount: groupTasks.length,
      };
    });
  }, [groups, allPersons, tasks]);

  const adminGatherings = useMemo(() => {
    return gatherings.map((gathering) => {
      const group = getGroupById(gathering.groupId);
      const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);
      const staffing = getStaffingStatus(gatheringTasks);

      // Detailed counts for admin gathering overview
      const totalTasks = gatheringTasks.length;
      let coveredTasksCount = 0;
      let missingStaffingCount = 0;

      gatheringTasks.forEach((task) => {
        const taskAssignments = assignments.filter(
          (a) => a.taskId === task.id && a.response === "confirmed"
        );
        const confirmedPeople = taskAssignments.length;
        const needed = task.neededCount;

        if (needed !== undefined && needed > 0) {
          if (confirmedPeople >= needed) {
            coveredTasksCount++;
          } else {
            missingStaffingCount += needed - confirmedPeople;
          }
        } else {
          // If neededCount is not set, use status
          if (task.status === "confirmed") {
            coveredTasksCount++;
          } else {
            missingStaffingCount += 1;
          }
        }
      });

      return {
        gathering,
        group,
        tasks: gatheringTasks,
        totalTasks,
        coveredTasksCount,
        missingStaffingCount,
        staffing,
      };
    });
  }, [gatherings, tasks, assignments, getGroupById]);

  const adminTasks = useMemo(() => {
    return tasks.map((task) => {
      const gathering = getGatheringById(task.gatheringId);
      const group = getGroupById(task.groupId);
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const primaryAssignment = getAssignmentForTask(task.id);
      const assignedPerson = primaryAssignment ? getPersonById(primaryAssignment.personId) : null;
      
      const assignedPersonsList = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const confirmedCount = taskAssignments.filter((a) => a.response === "confirmed").length;
      const isFullyCovered =
        task.neededCount !== undefined
          ? confirmedCount >= task.neededCount
          : task.status === "confirmed";

      const missingCount =
        task.neededCount !== undefined
          ? Math.max(0, task.neededCount - confirmedCount)
          : task.status === "confirmed"
          ? 0
          : 1;

      return {
        task,
        gathering,
        group,
        assignment: primaryAssignment,
        assignedPerson,
        assignedPersonsList,
        confirmedCount,
        isFullyCovered,
        missingCount,
      };
    });
  }, [tasks, assignments, getGatheringById, getGroupById, getAssignmentForTask, getPersonById]);

  return {
    isAdmin,
    currentUser,
    allPersons,
    adminPersons,
    adminGroups,
    adminGatherings,
    adminTasks,
    updateGroupName,
    updateGroup,
    addPerson,
    updatePerson,
  };
}

// 10. Hook: useAdminGatheringDetail
export function useAdminGatheringDetail(gatheringId: string) {
  const {
    currentUser,
    gatherings,
    groups,
    tasks,
    assignments,
    allPersons,
    getGatheringById,
    getGroupById,
    getPersonById,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const gathering = useMemo(() => {
    if (!gatheringId) return null;
    return getGatheringById(gatheringId) || null;
  }, [gatheringId, getGatheringById, gatherings]);

  const group = useMemo(() => {
    if (!gathering) return null;
    return getGroupById(gathering.groupId) || null;
  }, [gathering, getGroupById, groups]);

  const tasksWithDetails = useMemo(() => {
    if (!gathering) return [];
    const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);

    return gatheringTasks.map((task) => {
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const assignedPersons = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const confirmedPersonsCount = taskAssignments.filter((a) => a.response === "confirmed").length;
      const neededCount = task.neededCount;
      const isFullyCovered =
        neededCount !== undefined ? confirmedPersonsCount >= neededCount : task.status === "confirmed";
      const missingCount =
        neededCount !== undefined
          ? Math.max(0, neededCount - confirmedPersonsCount)
          : task.status === "confirmed"
          ? 0
          : 1;

      let staffingStatusLabel = "Behov ikke satt";
      if (neededCount !== undefined) {
        if (isFullyCovered) {
          staffingStatusLabel = "Fullt dekket";
        } else {
          staffingStatusLabel = `Mangler: ${missingCount}`;
        }
      } else {
        staffingStatusLabel = task.status === "confirmed" ? "Fullt dekket" : "Mangler bemanning";
      }

      return {
        task,
        neededCount,
        assignedPersons,
        confirmedPersonsCount,
        isFullyCovered,
        missingCount,
        staffingStatusLabel,
      };
    });
  }, [gathering, tasks, assignments, getPersonById]);

  return {
    isAdmin,
    currentUser,
    gathering,
    group,
    tasksWithDetails,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
  };
}

// 11. Hook: useAdminGroupDetail
export function useAdminGroupDetail(groupId: string) {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    tasks,
    getGroupById,
    updateGroup,
    addGroupMember,
    removeGroupMember,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const group = getGroupById(groupId);

  const leaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.leaderIds.includes(p.id));
  }, [group, allPersons]);

  const deputyLeaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
  }, [group, allPersons]);

  const members = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const availablePersonsToAdd = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => !group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const groupGatherings = useMemo(() => {
    if (!group) return [];
    return gatherings
      .filter((g) => g.groupId === group.id)
      .map((gathering) => {
        const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(gatheringTasks);
        return {
          gathering,
          tasks: gatheringTasks,
          staffing,
        };
      });
  }, [group, gatherings, tasks]);

  return {
    isAdmin,
    currentUser,
    group,
    leaders,
    deputyLeaders,
    members,
    availablePersonsToAdd,
    allPersons,
    groupGatherings,
    updateGroup,
    addGroupMember,
    removeGroupMember,
  };
}

// 12. Hook: useAdminPersonDetail
export function useAdminPersonDetail(personId: string) {
  const {
    currentUser,
    allPersons,
    groups,
    tasks,
    assignments,
    getPersonById,
    updatePerson,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const person = getPersonById(personId);

  const personGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.memberIds.includes(person.id));
  }, [person, groups]);

  const leaderInGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.leaderIds.includes(person.id));
  }, [person, groups]);

  const deputyInGroups = useMemo(() => {
    if (!person) return [];
    return groups.filter((g) => g.deputyLeaderIds?.includes(person.id));
  }, [person, groups]);

  const personAssignments = useMemo(() => {
    if (!person) return [];
    return assignments.filter((a) => a.personId === person.id && a.response !== "withdrawn");
  }, [person, assignments]);

  const personTasks = useMemo(() => {
    if (!person) return [];
    const taskIds = personAssignments.map((a) => a.taskId);
    return tasks.filter((t) => taskIds.includes(t.id));
  }, [person, personAssignments, tasks]);

  return {
    isAdmin,
    currentUser,
    person,
    personGroups,
    leaderInGroups,
    deputyInGroups,
    personTasks,
    allPersons,
    updatePerson,
  };
}

// 13. Hook: useAdminTaskDetail
export function useAdminTaskDetail(taskId: string) {
  const {
    currentUser,
    tasks,
    gatherings,
    groups,
    assignments,
    allPersons,
    getTaskById,
    getGatheringById,
    getGroupById,
    getAssignmentForTask,
    getAllAssignmentsForTask,
    getPersonById,
    updateTask,
    updateTaskInstruction,
    updateTaskNeededCount,
  } = useMockData();

  const isAdmin = currentUser.globalRole === "admin";
  const task = useMemo(() => {
    if (!taskId) return null;
    return getTaskById(taskId) || null;
  }, [taskId, getTaskById, tasks]);

  const gathering = useMemo(() => {
    if (!task) return null;
    return getGatheringById(task.gatheringId) || null;
  }, [task, getGatheringById, gatherings]);

  const group = useMemo(() => {
    if (!task) return null;
    return getGroupById(task.groupId) || null;
  }, [task, getGroupById, groups]);

  const assignment = useMemo(() => {
    if (!task) return null;
    return getAssignmentForTask(task.id) || null;
  }, [task, getAssignmentForTask, assignments]);

  const assignedPerson = useMemo(() => {
    if (!assignment) return null;
    return getPersonById(assignment.personId) || null;
  }, [assignment, getPersonById, allPersons]);

  const allAssignedPersonsWithStatus = useMemo(() => {
    if (!task) return [];
    const taskAssignments = getAllAssignmentsForTask(task.id);
    return taskAssignments.map((a) => {
      const person = getPersonById(a.personId);
      let statusLabel = "Forespurt";
      if (a.response === "confirmed") statusLabel = "Akseptert";
      if (a.response === "withdrawn") statusLabel = "Forfall";
      if (a.response === "declined") statusLabel = "Avslått";

      return {
        assignment: a,
        person,
        statusLabel,
        response: a.response,
      };
    });
  }, [task, getAllAssignmentsForTask, getPersonById]);

  const confirmedCount = useMemo(() => {
    return allAssignedPersonsWithStatus.filter((p) => p.response === "confirmed").length;
  }, [allAssignedPersonsWithStatus]);

  const isFullyCovered = useMemo(() => {
    if (!task) return false;
    if (task.neededCount !== undefined) {
      return confirmedCount >= task.neededCount;
    }
    return task.status === "confirmed";
  }, [task, confirmedCount]);

  const missingCount = useMemo(() => {
    if (!task) return 0;
    if (task.neededCount !== undefined) {
      return Math.max(0, task.neededCount - confirmedCount);
    }
    return task.status === "confirmed" ? 0 : 1;
  }, [task, confirmedCount]);

  const handleUpdateInstruction = useCallback(
    (instruction: string) => {
      if (!task) return { success: false, error: "Ingen oppgave valgt." };
      return updateTaskInstruction(task.id, instruction);
    },
    [task, updateTaskInstruction]
  );

  const handleUpdateNeededCount = useCallback(
    (neededCount: number | undefined) => {
      if (!task) return { success: false, error: "Ingen oppgave valgt." };
      return updateTaskNeededCount(task.id, neededCount);
    },
    [task, updateTaskNeededCount]
  );

  return {
    isAdmin,
    currentUser,
    task,
    gathering,
    group,
    assignment,
    assignedPerson,
    allAssignedPersonsWithStatus,
    confirmedCount,
    isFullyCovered,
    missingCount,
    updateTask,
    updateTaskInstruction: handleUpdateInstruction,
    updateTaskNeededCount: handleUpdateNeededCount,
  };
}

// 14. Hook: useLeaderGroupDetail
export function useLeaderGroupDetail(groupId: string) {
  const {
    currentUser,
    allPersons,
    groups,
    gatherings,
    tasks,
    getGroupById,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    getGroupMessages,
    sendGroupMessage,
  } = useMockData();

  const group = getGroupById(groupId);

  // Access check: User must be in group.leaderIds, group.deputyLeaderIds, or have globalRole === "admin"
  const isLeader = Boolean(group && group.leaderIds.includes(currentUser.id));
  const isDeputy = Boolean(group && group.deputyLeaderIds?.includes(currentUser.id));
  const isAdmin = currentUser.globalRole === "admin";
  const hasAccess = Boolean(group && (isLeader || isDeputy || isAdmin));

  const leaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.leaderIds.includes(p.id));
  }, [group, allPersons]);

  const deputyLeaders = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.deputyLeaderIds?.includes(p.id));
  }, [group, allPersons]);

  const members = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const availablePersonsToAdd = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => !group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const groupGatherings = useMemo(() => {
    if (!group) return [];
    return gatherings
      .filter((g) => g.groupId === group.id)
      .map((gathering) => {
        const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);
        const staffing = getStaffingStatus(gatheringTasks);
        return {
          gathering,
          tasks: gatheringTasks,
          staffing,
        };
      })
      .sort((a, b) => new Date(a.gathering.startsAt).getTime() - new Date(b.gathering.startsAt).getTime());
  }, [group, gatherings, tasks]);

  const messages = useMemo(() => {
    if (!group) return [];
    return getGroupMessages(group.id);
  }, [group, getGroupMessages]);

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!group) return { success: false, error: "Ingen gruppe valgt." };
      return sendGroupMessage(group.id, content);
    },
    [group, sendGroupMessage]
  );

  return {
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
    allPersons,
    groupGatherings,
    messages,
    updateGroup,
    addGroupMember,
    removeGroupMember,
    sendMessage: handleSendMessage,
  };
}

// 15. Hook: useLeaderGatheringDetail
export function useLeaderGatheringDetail(gatheringId: string) {
  const {
    currentUser,
    gatherings,
    groups,
    tasks,
    assignments,
    allPersons,
    getGatheringById,
    getGroupById,
    getPersonById,
    assignTaskToPerson,
    reportAbsence: performReportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
  } = useMockData();

  const gathering = useMemo(() => {
    if (!gatheringId) return null;
    return getGatheringById(gatheringId) || null;
  }, [gatheringId, getGatheringById, gatherings]);

  const group = useMemo(() => {
    if (!gathering) return null;
    return getGroupById(gathering.groupId) || null;
  }, [gathering, getGroupById, groups]);

  const isLeader = Boolean(group && group.leaderIds.includes(currentUser.id));
  const isDeputy = Boolean(group && group.deputyLeaderIds?.includes(currentUser.id));
  const isAdmin = currentUser.globalRole === "admin";
  const hasAccess = Boolean(group && (isLeader || isDeputy || isAdmin));

  const groupMembers = useMemo(() => {
    if (!group) return [];
    return allPersons.filter((p) => group.memberIds.includes(p.id));
  }, [group, allPersons]);

  const tasksWithDetails = useMemo(() => {
    if (!gathering) return [];
    const gatheringTasks = tasks.filter((t) => t.gatheringId === gathering.id);

    return gatheringTasks.map((task) => {
      const taskAssignments = assignments.filter((a) => a.taskId === task.id);
      const assignedPersons = taskAssignments.map((a) => {
        const person = getPersonById(a.personId);
        let statusLabel = "Forespurt";
        if (a.response === "confirmed") statusLabel = "Akseptert";
        if (a.response === "withdrawn") statusLabel = "Forfall";
        if (a.response === "declined") statusLabel = "Avslått";

        return {
          assignment: a,
          person,
          statusLabel,
          response: a.response,
        };
      });

      const confirmedPersonsCount = taskAssignments.filter((a) => a.response === "confirmed").length;
      const neededCount = task.neededCount;
      const isFullyCovered =
        neededCount !== undefined ? confirmedPersonsCount >= neededCount : task.status === "confirmed";
      const missingCount =
        neededCount !== undefined
          ? Math.max(0, neededCount - confirmedPersonsCount)
          : task.status === "confirmed"
          ? 0
          : 1;

      let staffingStatusLabel = "Behov ikke satt";
      if (neededCount !== undefined) {
        if (isFullyCovered) {
          staffingStatusLabel = "Fullt dekket";
        } else {
          staffingStatusLabel = `Mangler: ${missingCount}`;
        }
      } else {
        staffingStatusLabel = task.status === "confirmed" ? "Fullt dekket" : "Mangler bemanning";
      }

      return {
        task,
        neededCount,
        assignedPersons,
        confirmedPersonsCount,
        isFullyCovered,
        missingCount,
        staffingStatusLabel,
      };
    });
  }, [gathering, tasks, assignments, getPersonById]);

  return {
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
    reportAbsence: performReportAbsence,
    updateTaskNeededCount,
    updateTaskInstruction,
    updateTask,
  };
}

