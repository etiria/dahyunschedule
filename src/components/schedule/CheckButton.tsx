"use client";

import { Check } from "@/types";
import { toggleCheck } from "@/lib/firebase/firestore";
import { format } from "date-fns";

interface CheckButtonProps {
  scheduleId: string;
  familyId: string;
  date: string;
  checkerUid: string;
  checkerName: string;
  check: Check | undefined;
}

export default function CheckButton({
  scheduleId,
  familyId,
  date,
  checkerUid,
  checkerName,
  check,
}: CheckButtonProps) {
  const isChecked = check?.status === "checked";

  async function handleToggle() {
    try {
      await toggleCheck(
        scheduleId,
        familyId,
        date,
        checkerUid,
        checkerName,
        isChecked
      );
    } catch (err) {
      console.error("Check toggle failed:", err);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={handleToggle}
        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
          isChecked
            ? "bg-green-500 border-green-500 text-white scale-110"
            : "border-gray-300 text-gray-300 hover:border-green-400"
        }`}
      >
        {isChecked && (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      {isChecked && check && (
        <div className="text-center">
          <p className="text-xs text-green-600 font-medium">
            {check.checkedByName}
          </p>
          {check.checkedAt && (
            <p className="text-[10px] text-gray-400">
              {format(check.checkedAt.toDate(), "HH:mm")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
