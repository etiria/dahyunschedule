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
