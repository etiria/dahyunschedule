import { Timestamp } from "firebase/firestore";

export interface Family {
  id: string;
  familyName: string;
  childName: string;
  inviteCode: string;
  members: FamilyMember[];
  memberUids: string[];
  createdAt: Timestamp;
  createdBy: string;
}

export interface FamilyMember {
  uid: string;
  displayName: string;
  role: "admin" | "member";
  joinedAt: Timestamp;
}

export type ScheduleType = "school" | "academy";

export interface Schedule {
  id: string;
  familyId: string;
  type: ScheduleType;
  title: string;
  location?: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  color: string;
  pickupTime?: string; // "HH:mm" 픽업 시간
  dropoffTime?: string; // "HH:mm" 드랍 시간
  notes?: string;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
}

export interface Check {
  id: string;
  scheduleId: string;
  familyId: string;
  date: string; // "YYYY-MM-DD"
  status: "checked" | "unchecked";
  checkedBy: string;
  checkedByName: string;
  checkedAt: Timestamp | null;
}

// ==================== Homework ====================

export interface HomeworkItem {
  content: string;
  checked: boolean;
  checkedBy?: string;
  checkedByName?: string;
}

export interface Homework {
  id: string;
  familyId: string;
  academyName: string;
  date: string; // "YYYY-MM-DD"
  items: HomeworkItem[];
  note?: string;
  createdAt: Timestamp;
  createdBy: string;
}
