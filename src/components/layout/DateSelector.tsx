"use client";

import { formatDateKorean } from "@/lib/utils/date";
import { isToday } from "date-fns";

interface DateSelectorProps {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function DateSelector({
  date,
  onPrev,
  onNext,
  onToday,
}: DateSelectorProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <button
        onClick={onPrev}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center gap-2">
        <span className="text-base font-semibold text-gray-800">
          {formatDateKorean(date)}
        </span>
        {!isToday(date) && (
          <button
            onClick={onToday}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
          >
            오늘
          </button>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
