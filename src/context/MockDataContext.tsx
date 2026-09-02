import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { Person, Group, Gathering, Task, Assignment, GroupMessage, GatheringAttendance } from "../types";
import {
  initialPersons,
  initialGroups,
  initialGatherings,
  initialTasks,
  initialAssignments,
  initialGroupMessages,
  initialGatheringAttendances,
} from "../data/mockData";

export interface ModuleConfig {
  kalender: "on" | "off";
  meldinger: "on" | "off";
}

export interface MockDataContextType {
  // State
  currentUser: Person;
  allPersons: Person[];
  currentUserId: string;
  setCurrentUserId: (id: string) => void;
  groups: Group[];
  gatherings: Gathering[];
  tasks: Task[];
  assignments: Assignment[];
  groupMessages: GroupMessage[];
  attendances: GatheringAttendance[];

  // Module configuration
  moduleConfig: ModuleConfig;
  setModuleStatus: (moduleName: keyof ModuleConfig, status: "on" | "off") => void;
  toggleKalender: () => void;
  toggleMeldinger: () => void;

  // Data Adapter functions
  getTasksForPerson: (personId: string) => Task[];
  getOpenTasksForGroups: (groupIds: string[]) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getGatheringById: (gatheringId: string) => Gathering | undefined;
  getGroupById: (groupId: string) => Group | undefined;
  getPersonById: (personId: string) => Person | undefined;
  getAssignmentForTask: (taskId: string) => Assignment | undefined;
  getAllAssignmentsForTask: (taskId: string) => Assignment[];
  getUserGroups: (personId: string) => Group[];
  isPersonInGroup: (personId: string, groupId: string) => boolean;
  getGroupMessages: (groupId: string, personId?: string) => GroupMessage[];
  getGatheringAttendances: (gatheringId: string) => GatheringAttendance[];
  getPersonAttendance: (gatheringId: string, personId: string) => GatheringAttendance | undefined;
  getUpcomingGatheringForGroup: (groupId: string) => Gathering | undefined;
  getGatheringsForGroup: (groupId: string) => Gathering[];
  getGroupNotificationsEnabled: (groupId: string, personId?: string) => boolean;

  // Actions
  createGathering: (data: {
    groupId: string;
    title: string;
    startsAt: string;
    location?: string;
    type?: "arrangement" | "gruppesamling";
    theme?: string;
    bibleText?: string;
    hostPersonId?: string;
    sendInvitationImmediately?: boolean;
  }) => { success: boolean; gathering?: Gathering; error?: string };
  updateGathering: (gatheringId: string, updates: Partial<Gathering>) => { success: boolean; gathering?: Gathering; error?: string };
  deleteGathering: (gatheringId: string) => { success: boolean; error?: string };
  sendGatheringInvitation: (gatheringId: string) => { success: boolean; error?: string };
  assignTaskToPerson: (taskId: string, personId: string, responseStatus?: "confirmed" | "pending") => Promise<{ success: boolean; error?: string }>;
  reportAbsence: (taskId: string, personId: string, reason?: string) => Promise<{ success: boolean; error?: string }>;
  updateAssignmentStatus: (assignmentId: string, response: "confirmed" | "pending" | "declined" | "withdrawn") => { success: boolean; error?: string };
  removeAssignment: (assignmentId: string) => { success: boolean; error?: string };
  updateTaskStatus: (taskId: string, status: Task["status"]) => { success: boolean; error?: string };
  updateGroupName: (groupId: string, newName: string) => { success: boolean; error?: string };
  updateGroup: (groupId: string, updates: Partial<Group>) => { success: boolean; error?: string };
  addPerson: (data: { name: string; phone?: string; email?: string }) => { success: boolean; person?: Person; error?: string };
  updatePerson: (personId: string, updates: Partial<Person>) => { success: boolean; error?: string };
  addGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  removeGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  createTask: (data: { gatheringId: string; groupId: string; title: string; description?: string; instruction?: string; neededCount?: number }) => { success: boolean; task?: Task; error?: string };
  deleteTask: (taskId: string) => { success: boolean; error?: string };
  updateTask: (taskId: string, updates: Partial<Task>) => { success: boolean; error?: string };
  updateTaskInstruction: (taskId: string, instruction: string) => { success: boolean; error?: string };
  updateTaskNeededCount: (taskId: string, neededCount: number | undefined) => { success: boolean; error?: string };
  sendGroupMessage: (groupId: string, content: string, imageUrl?: string) => { success: boolean; message?: GroupMessage; error?: string };
  deleteGroupMessage: (messageId: string, personId?: string) => { success: boolean; error?: string };
  toggleGroupNotifications: (groupId: string, personId?: string, forceState?: boolean) => { success: boolean; enabled: boolean };
  respondToGathering: (gatheringId: string, personId: string, status: "attending" | "declined") => Promise<{ success: boolean; error?: string }>;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [gatherings, setGatherings] = useState<Gathering[]>(initialGatherings);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>(initialGroupMessages);
  const [attendances, setAttendances] = useState<GatheringAttendance[]>(initialGatheringAttendances);

  // Module configuration state - default is both 'off'
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig>({
    kalender: "off",
    meldinger: "off",
  });

  const setModuleStatus = useCallback((moduleName: keyof ModuleConfig, status: "on" | "off") => {
    setModuleConfig((prev) => ({ ...prev, [moduleName]: status }));
  }, []);

  const toggleKalender = useCallback(() => {
    setModuleConfig((prev) => ({
      ...prev,
      kalender: prev.kalender === "on" ? "off" : "on",
    }));
  }, []);

  const toggleMeldinger = useCallback(() => {
    setModuleConfig((prev) => ({
      ...prev,
      meldinger: prev.meldinger === "on" ? "off" : "on",
    }));
  }, []);
  
  // Default to Kari Nordmann ("person-1") who is admin
  const [currentUserId, setCurrentUserId] = useState<string>("person-1");

  const currentUser = useMemo(() => {
    return persons.find((p) => p.id === currentUserId) || persons[0];
  }, [persons, currentUserId]);

  const getUserGroups = useCallback(
    (personId: string): Group[] => {
      return groups.filter((g) => g.memberIds.includes(personId));
    },
    [groups]
  );

  const isPersonInGroup = useCallback(
    (personId: string, groupId: string): boolean => {
      const group = groups.find((g) => g.id === groupId);
      return group ? group.memberIds.includes(personId) : false;
    },
    [groups]
  );

  const getGatheringById = useCallback(
    (gatheringId: string): Gathering | undefined => {
      return gatherings.find((g) => g.id === gatheringId);
    },
    [gatherings]
  );

  const getGroupById = useCallback(
    (groupId: string): Group | undefined => {
      return groups.find((g) => g.id === groupId);
    },
    [groups]
  );

  const getPersonById = useCallback(
    (personId: string): Person | undefined => {
      return persons.find((p) => p.id === personId);
    },
    [persons]
  );

  const getTaskById = useCallback(
    (taskId: string): Task | undefined => {
      return tasks.find((t) => t.id === taskId);
    },
    [tasks]
  );

  const getAssignmentForTask = useCallback(
    (taskId: string): Assignment | undefined => {
      return assignments.find(
        (a) => a.taskId === taskId && (a.response === "confirmed" || a.response === "pending")
      );
    },
    [assignments]
  );

  const getAllAssignmentsForTask = useCallback(
    (taskId: string): Assignment[] => {
      return assignments.filter((a) => a.taskId === taskId);
    },
    [assignments]
  );

  // Return tasks where person has an active (confirmed or pending) assignment
  const getTasksForPerson = useCallback(
    (personId: string): Task[] => {
      const activeAssignments = assignments.filter(
        (a) => a.personId === personId && (a.response === "confirmed" || a.response === "pending")
      );
      const activeTaskIds = new Set(activeAssignments.map((a) => a.taskId));
      return tasks.filter((t) => activeTaskIds.has(t.id));
    },
    [assignments, tasks]
  );

  // Return open or vacant tasks in the specified groups
  const getOpenTasksForGroups = useCallback(
    (groupIds: string[]): Task[] => {
      const groupSet = new Set(groupIds);
      return tasks.filter(
        (t) => groupSet.has(t.groupId) && (t.status === "open" || t.status === "vacant")
      );
    },
    [tasks]
  );

  // Action: Take / Assign task to person
  const assignTaskToPerson = useCallback(
    async (taskId: string, personId: string, responseStatus: "confirmed" | "pending" = "confirmed"): Promise<{ success: boolean; error?: string }> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        return { success: false, error: "Oppgaven ble ikke funnet." };
      }

      if (!isPersonInGroup(personId, task.groupId)) {
        // Auto-add person to the group membership so assignment succeeds smoothly
        setGroups((prev) =>
          prev.map((g) =>
            g.id === task.groupId && !g.memberIds.includes(personId)
              ? { ...g, memberIds: [...g.memberIds, personId] }
              : g
          )
        );
      }

      // Upsert assignment for this (taskId, personId)
      let newAssignments: Assignment[] = [];
      setAssignments((prev) => {
        const existingIdx = prev.findIndex((a) => a.taskId === taskId && a.personId === personId);
        const newAssignment: Assignment = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `assign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          taskId,
          personId,
          response: responseStatus,
        };

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newAssignment;
          newAssignments = updated;
          return updated;
        } else {
          const updated = [...prev, newAssignment];
          newAssignments = updated;
          return updated;
        }
      });

      // Update task status based on confirmed assignments vs neededCount
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const taskAssignments = newAssignments.filter((a) => a.taskId === taskId);
            const confirmedCount = taskAssignments.filter((a) => a.response === "confirmed").length;
            const needed = t.neededCount || 1;
            const hasWithdrawn = taskAssignments.some((a) => a.response === "withdrawn");

            if (confirmedCount >= needed) {
              return { ...t, status: "confirmed" };
            } else if (hasWithdrawn && confirmedCount === 0) {
              return { ...t, status: "vacant" };
            } else if (confirmedCount > 0) {
              return { ...t, status: "assigned" };
            } else {
              return { ...t, status: responseStatus === "pending" ? "open" : "confirmed" };
            }
          }
          return t;
        })
      );

      return { success: true };
    },
    [tasks, isPersonInGroup]
  );

  // Action: Update single assignment status (e.g. from Leader: Aksepter, Forfall, Avslå, Forespurt)
  const updateAssignmentStatus = useCallback(
    (assignmentId: string, response: "confirmed" | "pending" | "declined" | "withdrawn"): { success: boolean; error?: string } => {
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) {
        return { success: false, error: "Tildelingen ble ikke funnet." };
      }

      let updatedAssignments: Assignment[] = [];
      setAssignments((prev) => {
        const next = prev.map((a) => (a.id === assignmentId ? { ...a, response } : a));
        updatedAssignments = next;
        return next;
      });

      // Recalculate parent task status
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === assignment.taskId) {
            const taskAssigns = updatedAssignments.filter((a) => a.taskId === t.id);
            const confirmedCount = taskAssigns.filter((a) => a.response === "confirmed").length;
            const needed = t.neededCount || 1;
            const hasWithdrawn = taskAssigns.some((a) => a.response === "withdrawn");

            if (confirmedCount >= needed) {
              return { ...t, status: "confirmed" };
            } else if (response === "withdrawn" || (hasWithdrawn && confirmedCount === 0)) {
              return { ...t, status: "vacant" };
            } else if (confirmedCount > 0) {
              return { ...t, status: "assigned" };
            } else {
              return { ...t, status: "open" };
            }
          }
          return t;
        })
      );

      return { success: true };
    },
    [assignments]
  );

  // Action: Remove assignment (e.g. unassign / fjern person)
  const removeAssignment = useCallback(
    (assignmentId: string): { success: boolean; error?: string } => {
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (!assignment) {
        return { success: false, error: "Tildelingen ble ikke funnet." };
      }

      const taskId = assignment.taskId;
      let remainingAssignments: Assignment[] = [];
      setAssignments((prev) => {
        const next = prev.filter((a) => a.id !== assignmentId);
        remainingAssignments = next;
        return next;
      });

      // Recalculate parent task status
      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const taskAssigns = remainingAssignments.filter((a) => a.taskId === t.id);
            const confirmedCount = taskAssigns.filter((a) => a.response === "confirmed").length;
            const needed = t.neededCount || 1;

            if (confirmedCount >= needed) {
              return { ...t, status: "confirmed" };
            } else if (confirmedCount > 0) {
              return { ...t, status: "assigned" };
            } else {
              return { ...t, status: "open" };
            }
          }
          return t;
        })
      );

      return { success: true };
    },
    [assignments]
  );

  // Action: Update Task Status directly
  const updateTaskStatus = useCallback(
    (taskId: string, status: Task["status"]): { success: boolean; error?: string } => {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
      return { success: true };
    },
    []
  );

  // Action: Report absence / meld forfall
  const reportAbsence = useCallback(
    async (taskId: string, personId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        return { success: false, error: "Oppgaven ble ikke funnet." };
      }

      const person = persons.find((p) => p.id === personId);
      const personName = person ? person.name : "Et medlem";

      const gathering = gatherings.find((g) => g.id === task.gatheringId);
      const gatheringTitle = gathering ? gathering.title : "samling";

      let gatheringTime = "";
      if (gathering?.startsAt) {
        try {
          const d = new Date(gathering.startsAt);
          const days = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
          const months = ["jan.", "feb.", "mars", "apr.", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];
          const dayName = days[d.getDay()];
          const dayNum = d.getDate();
          const monthName = months[d.getMonth()];
          const hours = d.getHours().toString().padStart(2, "0");
          const minutes = d.getMinutes().toString().padStart(2, "0");
          gatheringTime = `${dayName} ${dayNum}. ${monthName} kl. ${hours}:${minutes}`;
        } catch {
          gatheringTime = gathering.startsAt;
        }
      }

      // Update task status to 'vacant'
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "vacant" } : t))
      );

      // Mark assignment response as 'withdrawn'
      setAssignments((prev) =>
        prev.map((a) =>
          a.taskId === taskId && a.personId === personId
            ? { ...a, response: "withdrawn" }
            : a
        )
      );

      // Post system message to the relevant group chat
      if (task.groupId) {
        const datePart = gatheringTime ? ` (${gatheringTime})` : "";
        const reasonPart = reason && reason.trim() ? `\nBegrunnelse: ${reason.trim()}` : "";
        const content = `⚠️ Forfall meldt: ${personName} har meldt forfall på oppgaven «${task.title}» til ${gatheringTitle}${datePart}.${reasonPart}\n\nOppgaven er nå ledig og trenger dekning.`;

        const newSystemMessage: GroupMessage = {
          id: `msg-forfall-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          groupId: task.groupId,
          senderPersonId: personId,
          senderName: `${personName} (Forfall)`,
          content,
          createdAt: new Date().toISOString(),
        };

        setGroupMessages((prev) => [...prev, newSystemMessage]);
      }

      return { success: true };
    },
    [tasks, persons, gatherings]
  );

  // Admin Action: Update group (name, category, leaderIds, deputyLeaderIds, meetingSchedule)
  const updateGroup = useCallback(
    (groupId: string, updates: Partial<Group>): { success: boolean; error?: string } => {
      if (updates.name !== undefined && !updates.name.trim()) {
        return { success: false, error: "Gruppenavn kan ikke være tomt." };
      }

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            return {
              ...g,
              ...updates,
              name: updates.name !== undefined ? updates.name.trim() : g.name,
            };
          }
          return g;
        })
      );
      return { success: true };
    },
    []
  );

  // Admin Action: Update group name (reused helper)
  const updateGroupName = useCallback(
    (groupId: string, newName: string): { success: boolean; error?: string } => {
      return updateGroup(groupId, { name: newName });
    },
    [updateGroup]
  );

  // Admin Action: Add Person
  const addPerson = useCallback(
    (data: { name: string; phone?: string; email?: string }): { success: boolean; person?: Person; error?: string } => {
      const trimmedName = data.name.trim();
      if (!trimmedName) {
        return { success: false, error: "Navn kan ikke være tomt." };
      }

      const newId = `person-${Date.now()}`;
      const newPerson: Person = {
        id: newId,
        name: trimmedName,
        phone: data.phone?.trim() || undefined,
        email: data.email?.trim() || undefined,
        globalRole: "member", // Default to member
      };

      setPersons((prev) => [...prev, newPerson]);
      return { success: true, person: newPerson };
    },
    []
  );

  // Admin Action: Update Person
  const updatePerson = useCallback(
    (personId: string, updates: Partial<Person>): { success: boolean; error?: string } => {
      if (updates.name !== undefined && !updates.name.trim()) {
        return { success: false, error: "Navn kan ikke være tomt." };
      }

      setPersons((prev) =>
        prev.map((p) => {
          if (p.id === personId) {
            return {
              ...p,
              ...updates,
              name: updates.name !== undefined ? updates.name.trim() : p.name,
              phone: updates.phone !== undefined ? updates.phone.trim() : p.phone,
              email: updates.email !== undefined ? updates.email.trim() : p.email,
            };
          }
          return p;
        })
      );
      return { success: true };
    },
    []
  );

  // Admin Action: Add Group Member
  const addGroupMember = useCallback(
    (groupId: string, personId: string): { success: boolean; error?: string } => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            if (g.memberIds.includes(personId)) return g;
            return {
              ...g,
              memberIds: [...g.memberIds, personId],
              memberJoinedAt: {
                ...(g.memberJoinedAt || {}),
                [personId]: new Date().toISOString(),
              },
              notificationPreferences: {
                ...(g.notificationPreferences || {}),
                [personId]: true,
              },
            };
          }
          return g;
        })
      );
      return { success: true };
    },
    []
  );

  // Admin Action: Remove Group Member
  const removeGroupMember = useCallback(
    (groupId: string, personId: string): { success: boolean; error?: string } => {
      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            return {
              ...g,
              memberIds: g.memberIds.filter((id) => id !== personId),
              leaderIds: g.leaderIds.filter((id) => id !== personId),
              deputyLeaderIds: g.deputyLeaderIds?.filter((id) => id !== personId),
            };
          }
          return g;
        })
      );
      return { success: true };
    },
    []
  );

  // Admin Action: Update Task
  const updateTask = useCallback(
    (taskId: string, updates: Partial<Task>): { success: boolean; error?: string } => {
      if (updates.title !== undefined && !updates.title.trim()) {
        return { success: false, error: "Oppgavetittel kan ikke være tom." };
      }

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            return {
              ...t,
              ...updates,
              title: updates.title !== undefined ? updates.title.trim() : t.title,
              description: updates.description !== undefined ? updates.description.trim() : t.description,
              instruction: updates.instruction !== undefined ? updates.instruction.trim() : t.instruction,
              groupId: updates.groupId !== undefined ? updates.groupId : t.groupId,
              neededCount: updates.neededCount !== undefined ? updates.neededCount : t.neededCount,
            };
          }
          return t;
        })
      );
      return { success: true };
    },
    []
  );

  // Admin Action: Create Task
  const createTask = useCallback(
    (data: {
      gatheringId: string;
      groupId: string;
      title: string;
      description?: string;
      instruction?: string;
      neededCount?: number;
    }): { success: boolean; task?: Task; error?: string } => {
      if (!data.title.trim()) {
        return { success: false, error: "Tittel kan ikke være tom." };
      }
      if (!data.gatheringId) {
        return { success: false, error: "Samling må spesifiseres." };
      }
      if (!data.groupId) {
        return { success: false, error: "Gruppe må spesifiseres." };
      }

      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        gatheringId: data.gatheringId,
        groupId: data.groupId,
        title: data.title.trim(),
        description: data.description?.trim() || undefined,
        instruction: data.instruction?.trim() || undefined,
        status: "open",
        neededCount: data.neededCount || 1,
      };

      setTasks((prev) => [...prev, newTask]);
      return { success: true, task: newTask };
    },
    []
  );

  // Admin Action: Delete Task
  const deleteTask = useCallback(
    (taskId: string): { success: boolean; error?: string } => {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setAssignments((prev) => prev.filter((a) => a.taskId !== taskId));
      return { success: true };
    },
    []
  );

  // Admin Action: Update Task Instruction
  const updateTaskInstruction = useCallback(
    (taskId: string, instruction: string): { success: boolean; error?: string } => {
      return updateTask(taskId, { instruction });
    },
    [updateTask]
  );

  // Admin Action: Update Task Needed Count
  const updateTaskNeededCount = useCallback(
    (taskId: string, neededCount: number | undefined): { success: boolean; error?: string } => {
      return updateTask(taskId, { neededCount });
    },
    [updateTask]
  );

  // Group Messages
  const getGroupMessages = useCallback(
    (groupId: string, personId?: string): GroupMessage[] => {
      const targetPersonId = personId || currentUser.id;
      const targetGroup = groups.find((g) => g.id === groupId);
      if (!targetGroup) return [];

      // Access control check: user must be member, leader, or deputy leader of this specific group
      const isMember =
        targetGroup.memberIds.includes(targetPersonId) ||
        targetGroup.leaderIds.includes(targetPersonId) ||
        (targetGroup.deputyLeaderIds ? targetGroup.deputyLeaderIds.includes(targetPersonId) : false);

      if (!isMember) {
        // Not a member: strictly no access to the group's chat
        return [];
      }

      // History constraint: New members can only see messages sent after their join date
      const joinedAtStr = targetGroup.memberJoinedAt?.[targetPersonId];
      const joinedAtTime = joinedAtStr ? new Date(joinedAtStr).getTime() : 0;

      const groupMsgs = groupMessages.filter((m) => {
        if (m.groupId !== groupId) return false;
        const msgTime = new Date(m.createdAt).getTime();
        return msgTime >= joinedAtTime;
      });

      // Sort chronologically (oldest first)
      return [...groupMsgs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    },
    [groupMessages, groups, currentUser.id]
  );

  const sendGroupMessage = useCallback(
    (
      groupId: string,
      content: string,
      imageUrl?: string
    ): { success: boolean; message?: GroupMessage; error?: string } => {
      const trimmed = content.trim();
      if (!trimmed && !imageUrl) {
        return { success: false, error: "Meldingsteksten kan ikke være tom." };
      }

      const targetGroup = groups.find((g) => g.id === groupId);
      if (!targetGroup) {
        return { success: false, error: "Gruppen ble ikke funnet." };
      }

      const isMember =
        targetGroup.memberIds.includes(currentUser.id) ||
        targetGroup.leaderIds.includes(currentUser.id) ||
        (targetGroup.deputyLeaderIds ? targetGroup.deputyLeaderIds.includes(currentUser.id) : false);

      if (!isMember) {
        return { success: false, error: "Du må være medlem av gruppen for å skrive i chatten." };
      }

      const newMessage: GroupMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        groupId,
        senderPersonId: currentUser.id,
        senderName: currentUser.name,
        content: trimmed,
        imageUrl: imageUrl || undefined,
        createdAt: new Date().toISOString(),
      };

      setGroupMessages((prev) => [...prev, newMessage]);
      return { success: true, message: newMessage };
    },
    [currentUser, groups]
  );

  const deleteGroupMessage = useCallback(
    (messageId: string, personId?: string): { success: boolean; error?: string } => {
      const targetPersonId = personId || currentUser.id;
      const targetMsg = groupMessages.find((m) => m.id === messageId);
      if (!targetMsg) {
        return { success: false, error: "Meldingen ble ikke funnet." };
      }

      // STRICT PERMISSION: only author can delete own message (NO moderator overrides)
      if (targetMsg.senderPersonId !== targetPersonId) {
        return { success: false, error: "Du kan kun slette dine egne meldinger." };
      }

      setGroupMessages((prev) => prev.filter((m) => m.id !== messageId));
      return { success: true };
    },
    [groupMessages, currentUser.id]
  );

  const toggleGroupNotifications = useCallback(
    (groupId: string, personId?: string, forceState?: boolean): { success: boolean; enabled: boolean } => {
      const targetPersonId = personId || currentUser.id;
      let newEnabled = true;

      setGroups((prev) =>
        prev.map((g) => {
          if (g.id === groupId) {
            const currentPrefs = g.notificationPreferences || {};
            const currentVal = currentPrefs[targetPersonId] ?? true;
            newEnabled = forceState !== undefined ? forceState : !currentVal;
            return {
              ...g,
              notificationPreferences: {
                ...currentPrefs,
                [targetPersonId]: newEnabled,
              },
            };
          }
          return g;
        })
      );

      return { success: true, enabled: newEnabled };
    },
    [currentUser.id]
  );

  const getGroupNotificationsEnabled = useCallback(
    (groupId: string, personId?: string): boolean => {
      const targetPersonId = personId || currentUser.id;
      const targetGroup = groups.find((g) => g.id === groupId);
      if (!targetGroup) return true;
      return targetGroup.notificationPreferences?.[targetPersonId] ?? true;
    },
    [groups, currentUser.id]
  );

  const getGatheringAttendances = useCallback(
    (gatheringId: string): GatheringAttendance[] => {
      return attendances.filter((a) => a.gatheringId === gatheringId);
    },
    [attendances]
  );

  const getPersonAttendance = useCallback(
    (gatheringId: string, personId: string): GatheringAttendance | undefined => {
      return attendances.find((a) => a.gatheringId === gatheringId && a.personId === personId);
    },
    [attendances]
  );

  const getUpcomingGatheringForGroup = useCallback(
    (groupId: string): Gathering | undefined => {
      const groupGatherings = gatherings.filter((g) => g.groupId === groupId);
      const sorted = [...groupGatherings].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      );
      return sorted[0];
    },
    [gatherings]
  );

  const getGatheringsForGroup = useCallback(
    (groupId: string): Gathering[] => {
      return gatherings
        .filter((g) => g.groupId === groupId)
        .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    },
    [gatherings]
  );

  const createGathering = useCallback(
    (data: {
      groupId: string;
      title: string;
      startsAt: string;
      location?: string;
      type?: "arrangement" | "gruppesamling";
      theme?: string;
      bibleText?: string;
      hostPersonId?: string;
      sendInvitationImmediately?: boolean;
    }): { success: boolean; gathering?: Gathering; error?: string } => {
      if (!data.groupId || !data.title || !data.startsAt) {
        return { success: false, error: "Mangler obligatoriske felt (gruppe, tittel, dato)" };
      }
      const newGathering: Gathering = {
        id: `gathering-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        groupId: data.groupId,
        title: data.title,
        startsAt: data.startsAt,
        location: data.location,
        type: data.type || "gruppesamling",
        theme: data.theme,
        bibleText: data.bibleText,
        hostPersonId: data.hostPersonId,
        invitationSent: !!data.sendInvitationImmediately,
        invitationSentAt: data.sendInvitationImmediately ? new Date().toISOString() : undefined,
      };
      setGatherings((prev) => [...prev, newGathering]);
      return { success: true, gathering: newGathering };
    },
    []
  );

  const updateGathering = useCallback(
    (
      gatheringId: string,
      updates: Partial<Gathering>
    ): { success: boolean; gathering?: Gathering; error?: string } => {
      let updatedGathering: Gathering | undefined;
      setGatherings((prev) =>
        prev.map((g) => {
          if (g.id === gatheringId) {
            updatedGathering = { ...g, ...updates };
            return updatedGathering;
          }
          return g;
        })
      );
      if (!updatedGathering) {
        return { success: false, error: "Samling ikke funnet" };
      }
      return { success: true, gathering: updatedGathering };
    },
    []
  );

  const deleteGathering = useCallback((gatheringId: string): { success: boolean; error?: string } => {
    setGatherings((prev) => prev.filter((g) => g.id !== gatheringId));
    setAttendances((prev) => prev.filter((a) => a.gatheringId !== gatheringId));
    return { success: true };
  }, []);

  const sendGatheringInvitation = useCallback(
    (gatheringId: string): { success: boolean; error?: string } => {
      setGatherings((prev) =>
        prev.map((g) => {
          if (g.id === gatheringId) {
            return {
              ...g,
              invitationSent: true,
              invitationSentAt: new Date().toISOString(),
            };
          }
          return g;
        })
      );
      return { success: true };
    },
    []
  );

  const respondToGathering = useCallback(
    async (
      gatheringId: string,
      personId: string,
      status: "attending" | "declined"
    ): Promise<{ success: boolean; error?: string }> => {
      setAttendances((prev) => {
        const existingIndex = prev.findIndex(
          (a) => a.gatheringId === gatheringId && a.personId === personId
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status,
            updatedAt: new Date().toISOString(),
          };
          return updated;
        } else {
          const newAtt: GatheringAttendance = {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            gatheringId,
            personId,
            status,
            updatedAt: new Date().toISOString(),
          };
          return [...prev, newAtt];
        }
      });
      return { success: true };
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      currentUser,
      allPersons: persons,
      currentUserId,
      setCurrentUserId,
      groups,
      gatherings,
      tasks,
      assignments,
      groupMessages,
      attendances,
      moduleConfig,
      setModuleStatus,
      toggleKalender,
      toggleMeldinger,
      getTasksForPerson,
      getOpenTasksForGroups,
      getTaskById,
      getGatheringById,
      getGroupById,
      getPersonById,
      getAssignmentForTask,
      getAllAssignmentsForTask,
      getUserGroups,
      isPersonInGroup,
      getGroupMessages,
      getGatheringAttendances,
      getPersonAttendance,
      getUpcomingGatheringForGroup,
      getGatheringsForGroup,
      createGathering,
      updateGathering,
      deleteGathering,
      sendGatheringInvitation,
      assignTaskToPerson,
      reportAbsence,
      updateAssignmentStatus,
      removeAssignment,
      updateTaskStatus,
      updateGroupName,
      updateGroup,
      addPerson,
      updatePerson,
      addGroupMember,
      removeGroupMember,
      updateTask,
      createTask,
      deleteTask,
      updateTaskInstruction,
      updateTaskNeededCount,
      sendGroupMessage,
      deleteGroupMessage,
      toggleGroupNotifications,
      getGroupNotificationsEnabled,
      respondToGathering,
    }),
    [
      currentUser,
      persons,
      currentUserId,
      groups,
      gatherings,
      tasks,
      assignments,
      groupMessages,
      attendances,
      moduleConfig,
      setModuleStatus,
      toggleKalender,
      toggleMeldinger,
      getTasksForPerson,
      getOpenTasksForGroups,
      getTaskById,
      getGatheringById,
      getGroupById,
      getPersonById,
      getAssignmentForTask,
      getAllAssignmentsForTask,
      getUserGroups,
      isPersonInGroup,
      getGroupMessages,
      getGatheringAttendances,
      getPersonAttendance,
      getUpcomingGatheringForGroup,
      getGatheringsForGroup,
      createGathering,
      updateGathering,
      deleteGathering,
      sendGatheringInvitation,
      assignTaskToPerson,
      reportAbsence,
      updateAssignmentStatus,
      removeAssignment,
      updateTaskStatus,
      updateGroupName,
      updateGroup,
      addPerson,
      updatePerson,
      addGroupMember,
      removeGroupMember,
      updateTask,
      createTask,
      deleteTask,
      updateTaskInstruction,
      updateTaskNeededCount,
      sendGroupMessage,
      deleteGroupMessage,
      toggleGroupNotifications,
      getGroupNotificationsEnabled,
      respondToGathering,
    ]
  );

  return <MockDataContext.Provider value={contextValue}>{children}</MockDataContext.Provider>;
};

export const useMockData = (): MockDataContextType => {
  const context = useContext(MockDataContext);
  if (!context) {
    throw new Error("useMockData must be used within a MockDataProvider");
  }
  return context;
};
