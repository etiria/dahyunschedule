"use client";

import Link from "next/link";
import { useFamily } from "@/context/FamilyContext";
import { useSchedules } from "@/hooks/useSchedules";
import { SCHEDULE_COLORS, DAY_LABELS_KO } from "@/lib/constants";
import { formatTime } from "@/lib/utils/date";
import Header from "@/components/layout/Header";

export default function SchedulesPage() {
  const { family } = useFamily();
  const { schedules, loading } = useSchedules(family?.id);

  if (!family) return null;

  return (
    <div>
      <Header childName={family.childName} />

      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">일정 관리</h2>
          <Link
            href="/schedules/new"
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            + 일정 추가
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-medium">일정이 없어요</p>
            <p className="text-sm mt-1">첫 번째 일정을 추가해보세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => {
              const colors =
                SCHEDULE_COLORS[schedule.type] || SCHEDULE_COLORS.school;
              return (
                <Link
                  key={schedule.id}
                  href={`/schedules/${schedule.id}`}
                  className={`block p-4 rounded-2xl border-l-4 ${colors.border} ${colors.bg} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.text}`}
                    >
                      {colors.label}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatTime(schedule.startTime)} -{" "}
                      {formatTime(schedule.endTime)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800">
                    {schedule.title}
                  </h3>
                  {schedule.location && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {schedule.location}
                    </p>
                  )}
                  <div className="flex gap-1 mt-2">
                    {schedule.daysOfWeek.map((day) => (
                      <span
                        key={day}
                        className="text-xs bg-white/60 px-1.5 py-0.5 rounded"
                      >
                        {DAY_LABELS_KO[day]}
                      </span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
