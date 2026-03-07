import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  Timestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import { Family, FamilyMember, Schedule, Check, Homework, HomeworkItem } from "@/types";

// ==================== Families ====================

export async function createFamily(
  familyName: string,
  childName: string,
  inviteCode: string,
  creatorUid: string,
  creatorName: string
): Promise<string> {
  const familyRef = doc(collection(db, "families"));
  const member: FamilyMember = {
    uid: creatorUid,
    displayName: creatorName,
    role: "admin",
    joinedAt: Timestamp.now(),
  };

  await setDoc(familyRef, {
    familyName,
    childName,
    inviteCode,
    members: [member],
    memberUids: [creatorUid],
    createdAt: serverTimestamp(),
    createdBy: creatorUid,
  });

  return familyRef.id;
}

export async function findFamilyByInviteCode(
  code: string
): Promise<(Family & { id: string }) | null> {
  const q = query(
    collection(db, "families"),
    where("inviteCode", "==", code.toUpperCase())
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Family & { id: string };
}

export async function joinFamily(
  familyId: string,
  uid: string,
  displayName: string
): Promise<void> {
  const familyRef = doc(db, "families", familyId);
  const member: FamilyMember = {
    uid,
    displayName,
    role: "member",
    joinedAt: Timestamp.now(),
  };

  await updateDoc(familyRef, {
    members: arrayUnion(member),
    memberUids: arrayUnion(uid),
  });
}

export async function getFamilyByUid(
  uid: string
): Promise<(Family & { id: string }) | null> {
  const q = query(
    collection(db, "families"),
    where("memberUids", "array-contains", uid)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Family & { id: string };
}

export function subscribeFamilyByUid(
  uid: string,
  callback: (family: (Family & { id: string }) | null) => void
): Unsubscribe {
  const q = query(
    collection(db, "families"),
    where("memberUids", "array-contains", uid)
  );
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }
    const docSnap = snapshot.docs[0];
    callback({ id: docSnap.id, ...docSnap.data() } as Family & { id: string });
  });
}

// ==================== Schedules ====================

export async function createSchedule(
  data: Omit<Schedule, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const scheduleRef = doc(collection(db, "schedules"));
  await setDoc(scheduleRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return scheduleRef.id;
}

export async function updateSchedule(
  scheduleId: string,
  data: Partial<Omit<Schedule, "id" | "createdAt">>
): Promise<void> {
  const scheduleRef = doc(db, "schedules", scheduleId);
  await updateDoc(scheduleRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSchedule(scheduleId: string): Promise<void> {
  await deleteDoc(doc(db, "schedules", scheduleId));
}

export async function getSchedule(scheduleId: string): Promise<Schedule | null> {
  const docSnap = await getDoc(doc(db, "schedules", scheduleId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Schedule;
}

export function subscribeSchedules(
  familyId: string,
  callback: (schedules: Schedule[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "schedules"),
    where("familyId", "==", familyId)
  );
  return onSnapshot(q, (snapshot) => {
    const schedules = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Schedule)
    );
    schedules.sort((a, b) => a.startTime.localeCompare(b.startTime));
    callback(schedules);
  });
}

// ==================== Checks ====================

export async function toggleCheck(
  scheduleId: string,
  familyId: string,
  date: string,
  checkerUid: string,
  checkerName: string,
  currentlyChecked: boolean
): Promise<void> {
  const checkId = `${scheduleId}_${date}`;
  const checkRef = doc(db, "checks", checkId);

  if (currentlyChecked) {
    await deleteDoc(checkRef);
  } else {
    await setDoc(checkRef, {
      scheduleId,
      familyId,
      date,
      status: "checked",
      checkedBy: checkerUid,
      checkedByName: checkerName,
      checkedAt: serverTimestamp(),
    });
  }
}

export function subscribeChecks(
  familyId: string,
  date: string,
  callback: (checks: Map<string, Check>) => void
): Unsubscribe {
  const q = query(
    collection(db, "checks"),
    where("familyId", "==", familyId),
    where("date", "==", date)
  );
  return onSnapshot(q, (snapshot) => {
    const checksMap = new Map<string, Check>();
    snapshot.docs.forEach((d) => {
      const check = { id: d.id, ...d.data() } as Check;
      checksMap.set(check.scheduleId, check);
    });
    callback(checksMap);
  });
}

// ==================== Homework ====================

export async function createHomework(
  data: Omit<Homework, "id" | "createdAt">
): Promise<string> {
  const ref = doc(collection(db, "homework"));
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateHomework(
  homeworkId: string,
  data: Partial<Omit<Homework, "id" | "createdAt">>
): Promise<void> {
  await updateDoc(doc(db, "homework", homeworkId), data);
}

export async function deleteHomework(homeworkId: string): Promise<void> {
  await deleteDoc(doc(db, "homework", homeworkId));
}

export async function toggleHomeworkItem(
  homeworkId: string,
  items: HomeworkItem[],
  itemIndex: number,
  checkerUid: string,
  checkerName: string
): Promise<void> {
  const updated = items.map((item, i) => {
    if (i !== itemIndex) return item;
    return item.checked
      ? { content: item.content, checked: false }
      : { content: item.content, checked: true, checkedBy: checkerUid, checkedByName: checkerName };
  });
  await updateDoc(doc(db, "homework", homeworkId), { items: updated });
}

export function subscribeHomeworkByDate(
  familyId: string,
  date: string,
  callback: (homework: Homework[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "homework"),
    where("familyId", "==", familyId),
    where("date", "==", date)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Homework)
    );
    callback(list);
  });
}

export function subscribeAllHomework(
  familyId: string,
  callback: (homework: Homework[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "homework"),
    where("familyId", "==", familyId)
  );
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(
      (d) => ({ id: d.id, ...d.data() } as Homework)
    );
    list.sort((a, b) => a.date.localeCompare(b.date));
    callback(list);
  });
}
