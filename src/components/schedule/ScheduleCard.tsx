"use client";

import { Schedule, Check } from "@/types";
import { SCHEDULE_COLORS } from "@/lib/constants";
import { formatTime } from "@/lib/utils/date";
import CheckButton from "./CheckButton";

interface ScheduleCardProps {
  schedule: Schedule;
  familyId: string;
  date: string;
  checkerUid: string;
  checkerName: string;
  check: Check | undefined;
}

export default function ScheduleCard({
  schedule,
  familyId,
  date,
  checkerUid,
  checkerName,
  check,
}: ScheduleCardProps) {
  const colors = SCHEDULE_COLORS[schedule.type] || SCHEDULE_COLORS.school;
  const isChecked = check?.status === "checked";

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-2xl border-l-4 ${colors.border} ${
        isChecked ? "bg-gray-50 opacity-75" : colors.bg
      } transition-all`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
          >
            {colors.label}
          </span>
          <span className="text-sm text-gray-500">
            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
          </span>
        </div>
        <h3
          className={`font-semibold text-gray-800 ${
            isChecked ? "line-through text-gray-400" : ""
          }`}
        >
          {schedule.title}
        </h3>
        {schedule.location && (
          <p className="text-sm text-gray-500 mt-0.5">{schedule.location}</p>
        )}
      </div>

      <CheckButton
        scheduleId={schedule.id}
        familyId={familyId}
        date={date}
        checkerUid={checkerUid}
        checkerName={checkerName}
        check={check}
      />
    </div>
  );
}
