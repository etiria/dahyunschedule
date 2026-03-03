"use client";

import { Schedule, Check } from "@/types";
import { filterSchedulesByDay } from "@/lib/utils/schedule";
import { getDayOfWeek } from "@/lib/utils/date";
import ScheduleCard from "./ScheduleCard";

interface DailyTimelineProps {
  schedules: Schedule[];
  checks: Map<string, Check>;
  familyId: string;
  date: Date;
  dateString: string;
  checkerUid: string;
  checkerName: string;
}

export default function DailyTimeline({
  schedules,
  checks,
  familyId,
  date,
  dateString,
  checkerUid,
  checkerName,
}: DailyTimelineProps) {
  const dayOfWeek = getDayOfWeek(date);
  const todaySchedules = filterSchedulesByDay(schedules, dayOfWeek);

  if (todaySchedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <div className="text-5xl mb-4">📅</div>
        <p className="text-lg font-medium">일정이 없어요</p>
        <p className="text-sm mt-1">일정을 추가해보세요</p>
      </div>
    );
  }

  const checkedCount = todaySchedules.filter(
    (s) => checks.get(s.id)?.status === "checked"
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 px-1">
        <p className="text-sm text-gray-500">
          총 {todaySchedules.length}개 일정
        </p>
        <p className="text-sm font-medium text-green-600">
          {checkedCount}/{todaySchedules.length} 완료
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{
            width: `${(checkedCount / todaySchedules.length) * 100}%`,
          }}
        />
      </div>

      <div className="space-y-3">
        {todaySchedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            familyId={familyId}
            date={dateString}
            checkerUid={checkerUid}
            checkerName={checkerName}
            check={checks.get(schedule.id)}
          />
        ))}
      </div>
    </div>
  );
}
