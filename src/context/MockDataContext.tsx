import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import { Person, Group, Gathering, Task, Assignment, GroupMessage } from "../types";
import {
  initialPersons,
  initialGroups,
  initialGatherings,
  initialTasks,
  initialAssignments,
  initialGroupMessages,
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
  getGroupMessages: (groupId: string) => GroupMessage[];

  // Actions
  assignTaskToPerson: (taskId: string, personId: string) => Promise<{ success: boolean; error?: string }>;
  reportAbsence: (taskId: string, personId: string) => Promise<{ success: boolean; error?: string }>;
  updateGroupName: (groupId: string, newName: string) => { success: boolean; error?: string };
  updateGroup: (groupId: string, updates: Partial<Group>) => { success: boolean; error?: string };
  addPerson: (data: { name: string; phone?: string; email?: string }) => { success: boolean; person?: Person; error?: string };
  updatePerson: (personId: string, updates: Partial<Person>) => { success: boolean; error?: string };
  addGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  removeGroupMember: (groupId: string, personId: string) => { success: boolean; error?: string };
  updateTask: (taskId: string, updates: Partial<Task>) => { success: boolean; error?: string };
  updateTaskInstruction: (taskId: string, instruction: string) => { success: boolean; error?: string };
  updateTaskNeededCount: (taskId: string, neededCount: number | undefined) => { success: boolean; error?: string };
  sendGroupMessage: (groupId: string, content: string) => { success: boolean; message?: GroupMessage; error?: string };
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

export const MockDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [persons, setPersons] = useState<Person[]>(initialPersons);
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [gatherings] = useState<Gathering[]>(initialGatherings);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>(initialGroupMessages);

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
    async (taskId: string, personId: string): Promise<{ success: boolean; error?: string }> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        return { success: false, error: "Oppgaven ble ikke funnet." };
      }

      if (!isPersonInGroup(personId, task.groupId)) {
        return {
          success: false,
          error: "Du har ikke tilgang til å ta oppgaver utenfor dine grupper.",
        };
      }

      // Update task status to 'confirmed'
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: "confirmed" } : t))
      );

      // Upsert assignment
      setAssignments((prev) => {
        const existingIdx = prev.findIndex((a) => a.taskId === taskId);
        const newAssignment: Assignment = {
          id: existingIdx >= 0 ? prev[existingIdx].id : `assign-${Date.now()}`,
          taskId,
          personId,
          response: "confirmed",
        };

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = newAssignment;
          return updated;
        } else {
          return [...prev, newAssignment];
        }
      });

      return { success: true };
    },
    [tasks, isPersonInGroup]
  );

  // Action: Report absence / meld forfall
  const reportAbsence = useCallback(
    async (taskId: string, personId: string): Promise<{ success: boolean; error?: string }> => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) {
        return { success: false, error: "Oppgaven ble ikke funnet." };
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

      return { success: true };
    },
    [tasks]
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
              instruction: updates.instruction !== undefined ? updates.instruction.trim() : t.instruction,
            };
          }
          return t;
        })
      );
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
    (groupId: string): GroupMessage[] => {
      return groupMessages.filter((m) => m.groupId === groupId);
    },
    [groupMessages]
  );

  const sendGroupMessage = useCallback(
    (groupId: string, content: string): { success: boolean; message?: GroupMessage; error?: string } => {
      const trimmed = content.trim();
      if (!trimmed) {
        return { success: false, error: "Meldingsteksten kan ikke være tom." };
      }

      const newMessage: GroupMessage = {
        id: `msg-${Date.now()}`,
        groupId,
        senderPersonId: currentUser.id,
        senderName: currentUser.name,
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      setGroupMessages((prev) => [newMessage, ...prev]);
      return { success: true, message: newMessage };
    },
    [currentUser]
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
      assignTaskToPerson,
      reportAbsence,
      updateGroupName,
      updateGroup,
      addPerson,
      updatePerson,
      addGroupMember,
      removeGroupMember,
      updateTask,
      updateTaskInstruction,
      updateTaskNeededCount,
      sendGroupMessage,
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
      assignTaskToPerson,
      reportAbsence,
      updateGroupName,
      updateGroup,
      addPerson,
      updatePerson,
      addGroupMember,
      removeGroupMember,
      updateTask,
      updateTaskInstruction,
      updateTaskNeededCount,
      sendGroupMessage,
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
