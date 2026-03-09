"use client";

import { useState } from "react";
import { ScheduleType } from "@/types";
import { SCHEDULE_COLORS, PRESET_COLORS } from "@/lib/constants";
import DayOfWeekPicker from "./DayOfWeekPicker";

export interface ScheduleFormData {
  type: ScheduleType;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  color: string;
  pickupTime: string;
  dropoffTime: string;
  notes: string;
}

interface ScheduleFormProps {
  initialData?: Partial<ScheduleFormData>;
  onSubmit: (data: ScheduleFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export default function ScheduleForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "저장",
}: ScheduleFormProps) {
  const [type, setType] = useState<ScheduleType>(
    initialData?.type || "school"
  );
  const [title, setTitle] = useState(initialData?.title || "");
  const [location, setLocation] = useState(initialData?.location || "");
  const [startTime, setStartTime] = useState(initialData?.startTime || "09:00");
  const [endTime, setEndTime] = useState(initialData?.endTime || "15:00");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialData?.daysOfWeek || [1, 2, 3, 4, 5]
  );
  const [color, setColor] = useState(
    initialData?.color || PRESET_COLORS[0]
  );
  const [pickupTime, setPickupTime] = useState(initialData?.pickupTime || "");
  const [dropoffTime, setDropoffTime] = useState(initialData?.dropoffTime || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("일정 이름을 입력해주세요.");
      return;
    }
    if (daysOfWeek.length === 0) {
      setError("요일을 하나 이상 선택해주세요.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await onSubmit({
        type,
        title: title.trim(),
        location: location.trim(),
        startTime,
        endTime,
        daysOfWeek,
        color,
        pickupTime,
        dropoffTime,
        notes: notes.trim(),
      });
    } catch {
      setError("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          일정 종류
        </label>
        <div className="flex gap-3">
          {(["school", "academy"] as ScheduleType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${
                type === t
                  ? `${SCHEDULE_COLORS[t].bg} ${SCHEDULE_COLORS[t].text} border-2 ${SCHEDULE_COLORS[t].border}`
                  : "bg-gray-100 text-gray-500 border-2 border-transparent"
              }`}
            >
              {SCHEDULE_COLORS[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          일정 이름
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "school" ? "예: 등교" : "예: 영어학원"}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          장소 (선택)
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="예: 다현초등학교, YBM어학원"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
        />
      </div>

      {/* Time */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            시작 시간
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            끝 시간
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Pickup / Dropoff time (학원만) */}
      {type === "academy" && (
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              픽업 시간 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              드랍 시간 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="time"
              value={dropoffTime}
              onChange={(e) => setDropoffTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      )}

      {/* Days of week */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          요일
        </label>
        <DayOfWeekPicker selected={daysOfWeek} onChange={setDaysOfWeek} />
      </div>

      {/* Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          색상
        </label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full transition-transform ${
                color === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          메모 (선택)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="추가 메모..."
          rows={2}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {loading ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
