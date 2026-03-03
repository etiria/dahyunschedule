"use client";

import { useState, useEffect } from "react";
import { Schedule } from "@/types";
import { getWeekDates, getDateString, formatDateShort } from "@/lib/utils/date";
import { filterSchedulesByDay } from "@/lib/utils/schedule";
import { isToday } from "date-fns";

const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 13
const DAY_LABELS = ["월", "화", "수", "목", "금", "토"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6]; // Mon=1 ~ Sat=6

// 학교: 고정 초록색
const SCHOOL_STYLE = {
  bg: "rgba(220, 252, 231, 0.85)",
  border: "#16A34A",
  text: "#14532D",
};

// hex → 연한 배경색
function hexToLightBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.15)`;
}

// hex → 어두운 텍스트색
function hexToDark(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 80);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 80);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 80);
  return `rgb(${r}, ${g}, ${b})`;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// 반응형 레이아웃 값
function useResponsiveGrid() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return isDesktop
    ? { hourHeight: 70, timeColWidth: 52 }
    : { hourHeight: 50, timeColWidth: 32 };
}

interface WeeklyGridProps {
  schedules: Schedule[];
  weekChecks: Map<string, Map<string, boolean>>;
  currentDate: Date;
  onDayClick: (date: Date) => void;
}

export default function WeeklyGrid({
  schedules,
  weekChecks,
  currentDate,
}: WeeklyGridProps) {
  const weekDates = getWeekDates(currentDate);
  const monToSatDates = weekDates.slice(0, 6);
  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);
  const { hourHeight, timeColWidth } = useResponsiveGrid();

  function getBlockStyle(startTime: string, endTime: string) {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const originMin = START_HOUR * 60;
    const top = ((startMin - originMin) / 60) * hourHeight;
    const height = Math.max(((endMin - startMin) / 60) * hourHeight, 24);
    return { top: `${top}px`, height: `${height}px` };
  }

  return (
    <div className="w-full">
      {/* 요일 헤더 */}
      <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="shrink-0" style={{ width: `${timeColWidth}px` }} />
        {monToSatDates.map((date, idx) => {
          const today = isToday(date);
          return (
            <div
              key={idx}
              className={`flex-1 text-center py-1.5 sm:py-2.5 min-w-0 ${
                today ? "bg-blue-50" : ""
              }`}
            >
              <div
                className={`text-[11px] sm:text-sm font-medium ${
                  idx === 5
                    ? "text-blue-500"
                    : today
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {DAY_LABELS[idx]}
              </div>
              <div
                className={`text-xs sm:text-base font-bold ${
                  today ? "text-blue-600" : "text-gray-800"
                }`}
              >
                {formatDateShort(date)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 시간표 본체 */}
      <div className="relative flex">
        {/* 시간 라벨 컬럼 */}
        <div
          className="shrink-0 relative"
          style={{ width: `${timeColWidth}px` }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full text-right pr-1 sm:pr-2"
              style={{
                top: `${(hour - START_HOUR) * hourHeight - 5}px`,
              }}
            >
              <span className="text-[9px] sm:text-xs text-gray-400">
                {hour < 12
                  ? `${hour}AM`
                  : hour === 12
                  ? "12PM"
                  : `${hour - 12}PM`}
              </span>
            </div>
          ))}
        </div>

        {/* 6개 요일 컬럼 */}
        {monToSatDates.map((date, dayIdx) => {
          const dayOfWeek = DAY_INDICES[dayIdx];
          const daySchedules = filterSchedulesByDay(schedules, dayOfWeek);
          const dateStr = getDateString(date);
          const dayChecks = weekChecks.get(dateStr) || new Map();
          const today = isToday(date);

          return (
            <div
              key={dayIdx}
              className={`flex-1 relative border-l border-gray-100 min-w-0 ${
                today ? "bg-blue-50/30" : ""
              }`}
              style={{ height: `${TOTAL_HOURS * hourHeight}px` }}
            >
              {/* 시간 그리드 라인 */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute w-full border-t border-gray-100"
                  style={{
                    top: `${(hour - START_HOUR) * hourHeight}px`,
                  }}
                />
              ))}

              {/* 스케줄 블록 */}
              {daySchedules.map((schedule) => {
                const posStyle = getBlockStyle(
                  schedule.startTime,
                  schedule.endTime
                );
                const isChecked = dayChecks.get(schedule.id);
                const isSchool = schedule.type === "school";

                const bgColor = isSchool
                  ? SCHOOL_STYLE.bg
                  : hexToLightBg(schedule.color || "#3B82F6");
                const borderColor = isSchool
                  ? SCHOOL_STYLE.border
                  : schedule.color || "#3B82F6";
                const textColor = isSchool
                  ? SCHOOL_STYLE.text
                  : hexToDark(schedule.color || "#3B82F6");

                return (
                  <div
                    key={schedule.id}
                    className={`absolute left-px right-px rounded-sm sm:rounded-md px-0.5 sm:px-1.5 py-0.5 sm:py-1 overflow-hidden cursor-default transition-opacity ${
                      isChecked ? "opacity-50" : ""
                    }`}
                    style={{
                      ...posStyle,
                      backgroundColor: bgColor,
                      borderLeft: `2px solid ${borderColor}`,
                    }}
                  >
                    <p
                      className={`text-xs sm:text-base font-bold leading-tight truncate ${
                        isChecked ? "line-through" : ""
                      }`}
                      style={{ color: textColor }}
                    >
                      {schedule.title}
                    </p>
                    <p className="text-[9px] sm:text-sm text-gray-500 truncate">
                      {schedule.startTime}~{schedule.endTime}
                    </p>
                    {isChecked && (
                      <div className="absolute top-0 right-0 sm:top-1 sm:right-1">
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
