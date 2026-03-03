"use client";

import { DAY_LABELS_KO } from "@/lib/constants";

interface DayOfWeekPickerProps {
  selected: number[];
  onChange: (days: number[]) => void;
}

export default function DayOfWeekPicker({
  selected,
  onChange,
}: DayOfWeekPickerProps) {
  function toggleDay(day: number) {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day].sort());
    }
  }

  return (
    <div className="flex gap-2">
      {DAY_LABELS_KO.map((label, index) => {
        const isSelected = selected.includes(index);
        return (
          <button
            key={index}
            type="button"
            onClick={() => toggleDay(index)}
            className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
              isSelected
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            } ${index === 0 ? "text-red-500" : ""} ${
              index === 6 ? "text-blue-500" : ""
            } ${isSelected ? "!text-white" : ""}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
