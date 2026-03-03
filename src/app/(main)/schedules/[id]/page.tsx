"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFamily } from "@/context/FamilyContext";
import {
  getSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/lib/firebase/firestore";
import { Schedule } from "@/types";
import ScheduleForm, {
  ScheduleFormData,
} from "@/components/schedule/ScheduleForm";

export default function EditSchedulePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { family } = useFamily();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const scheduleId = params.id as string;

  useEffect(() => {
    getSchedule(scheduleId).then((data) => {
      setSchedule(data);
      setLoading(false);
    });
  }, [scheduleId]);

  if (!family || !user) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        일정을 찾을 수 없습니다.
      </div>
    );
  }

  async function handleSubmit(data: ScheduleFormData) {
    await updateSchedule(scheduleId, data);
    router.push("/schedules");
  }

  async function handleDelete() {
    if (!confirm("이 일정을 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      await deleteSchedule(scheduleId);
      router.push("/schedules");
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">일정 수정</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-red-500 text-sm font-medium hover:text-red-600"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
      </div>
      <div className="px-4 py-4">
        <ScheduleForm
          initialData={{
            type: schedule.type,
            title: schedule.title,
            location: schedule.location || "",
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            daysOfWeek: schedule.daysOfWeek,
            color: schedule.color,
            notes: schedule.notes || "",
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="수정"
        />
      </div>
    </div>
  );
}
