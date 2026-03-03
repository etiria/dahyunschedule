"use client";

import { Schedule } from "@/types";
import { getWeekDates, getDateString, formatDateShort } from "@/lib/utils/date";
import { filterSchedulesByDay } from "@/lib/utils/schedule";
import { isToday } from "date-fns";

const START_HOUR = 8;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR; // 13
const HOUR_HEIGHT = 60; // px per hour
const DAY_LABELS = ["월", "화", "수", "목", "금", "토"];
const DAY_INDICES = [1, 2, 3, 4, 5, 6]; // Mon=1 ~ Sat=6

// 학교: 고정 초록색
const SCHOOL_STYLE = {
  bg: "rgba(220, 252, 231, 0.85)",  // green-100
  border: "#16A34A",                  // green-600
  text: "#14532D",                    // green-900
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

function getBlockStyle(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const originMin = START_HOUR * 60;

  const top = ((startMin - originMin) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 20);

  return { top: `${top}px`, height: `${height}px` };
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

  // 월~토 날짜만 추출 (getWeekDates는 월요일 시작 7일)
  const monToSatDates = weekDates.slice(0, 6);

  const hours = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => START_HOUR + i);

  return (
    <div className="overflow-x-auto -mx-4 px-0">
      <div
        className="min-w-[600px]"
        style={{ paddingLeft: "48px" }}
      >
        {/* 요일 헤더 */}
        <div className="flex border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="w-12 shrink-0" />
          {monToSatDates.map((date, idx) => {
            const today = isToday(date);
            return (
              <div
                key={idx}
                className={`flex-1 text-center py-2 ${
                  today ? "bg-blue-50" : ""
                }`}
              >
                <div
                  className={`text-xs font-medium ${
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
                  className={`text-sm font-bold ${
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
          <div className="w-12 shrink-0 relative" style={{ marginLeft: "-48px" }}>
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute w-full text-right pr-2"
                style={{
                  top: `${(hour - START_HOUR) * HOUR_HEIGHT - 6}px`,
                }}
              >
                <span className="text-[10px] text-gray-400">
                  {hour < 12
                    ? `오전 ${hour}`
                    : hour === 12
                    ? "오후 12"
                    : `오후 ${hour - 12}`}
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
                className={`flex-1 relative border-l border-gray-100 ${
                  today ? "bg-blue-50/30" : ""
                }`}
                style={{ height: `${TOTAL_HOURS * HOUR_HEIGHT}px` }}
              >
                {/* 시간 그리드 라인 */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-gray-100"
                    style={{
                      top: `${(hour - START_HOUR) * HOUR_HEIGHT}px`,
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

                  // 학교: 고정 초록색 / 학원: 지정된 색상 사용
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
                      className={`absolute left-0.5 right-0.5 rounded-md px-1 py-0.5 overflow-hidden cursor-default transition-opacity ${
                        isChecked ? "opacity-50" : ""
                      }`}
                      style={{
                        ...posStyle,
                        backgroundColor: bgColor,
                        borderLeft: `3px solid ${borderColor}`,
                      }}
                    >
                      <p
                        className={`text-[10px] font-semibold leading-tight truncate ${
                          isChecked ? "line-through" : ""
                        }`}
                        style={{ color: textColor }}
                      >
                        {schedule.title}
                      </p>
                      <p className="text-[9px] text-gray-500 truncate">
                        {schedule.startTime}~{schedule.endTime}
                      </p>
                      {schedule.location && (
                        <p className="text-[9px] text-gray-400 truncate">
                          {schedule.location}
                        </p>
                      )}
                      {isChecked && (
                        <div className="absolute top-0.5 right-0.5">
                          <svg
                            className="w-3 h-3 text-green-500"
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
    </div>
  );
}
