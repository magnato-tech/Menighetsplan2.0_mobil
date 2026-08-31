// Exact Domain Models requested for Menighetsplan

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  globalRole: "member" | "admin";
}

export type GroupCategory = "tjenestegruppe" | "husgruppe" | "strategigruppe" | "ledergruppe";

export interface MeetingSchedule {
  weekday: string;
  time: string;
  frequency: "hver uke" | "annenhver uke" | "hver måned";
}

export interface Group {
  id: string;
  name: string;
  category?: GroupCategory;
  memberIds: string[];
  leaderIds: string[];
  deputyLeaderIds?: string[];
  meetingSchedule?: MeetingSchedule;
}

export interface ProgramItem {
  id?: string;
  time: string;
  title: string;
  description?: string;
  taskId?: string;
  groupId?: string;
}

export interface Gathering {
  id: string;
  groupId: string;
  title: string;
  startsAt: string; // ISO date
  location?: string;
  type?: "arrangement" | "gruppesamling";
  programSchedule?: ProgramItem[];
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderPersonId: string;
  senderName: string;
  content: string;
  createdAt: string; // ISO date
}

export interface Task {
  id: string;
  gatheringId: string;
  groupId: string;
  title: string;
  description?: string;
  instruction?: string;
  status: "open" | "assigned" | "confirmed" | "vacant" | "cancelled";
  neededCount?: number;
}

export interface Assignment {
  id: string;
  taskId: string;
  personId: string;
  response: "pending" | "confirmed" | "declined" | "withdrawn";
}

// Presentation Model for reusable ActionCard component
export type BadgeVariant = "neutral" | "success" | "warning" | "urgent" | "info";

export interface ActionCardModel {
  id: string;
  taskId: string;
  title: string;
  gatheringTitle: string;
  dateTimeFormatted: string;
  groupName: string;
  location?: string;
  status: Task["status"];
  statusLabel: string;
  badgeVariant: BadgeVariant;
  primaryActionLabel?: string;
  primaryActionType?: "claim" | "absence" | "view";
  detailUrl: string;
  isAssignedToMe: boolean;
  assignedPersonName?: string;
}

export interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  permissionDenied?: boolean;
}
