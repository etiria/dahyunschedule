"use client";

import { Homework } from "@/types";
import { toggleHomeworkItem } from "@/lib/firebase/firestore";

interface HomeworkCardProps {
  homework: Homework;
  checkerUid: string;
  checkerName: string;
}

export default function HomeworkCard({
  homework,
  checkerUid,
  checkerName,
}: HomeworkCardProps) {
  const completedCount = homework.items.filter((i) => i.checked).length;
  const totalCount = homework.items.length;
  const allDone = completedCount === totalCount;

  const handleToggle = async (index: number) => {
    await toggleHomeworkItem(
      homework.id,
      homework.items,
      index,
      checkerUid,
      checkerName
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold text-gray-800">
            {homework.academyName}
          </span>
          {homework.note && (
            <span className="text-[11px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
              {homework.note}
            </span>
          )}
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            allDone
              ? "bg-green-50 text-green-600"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* 숙제 항목 */}
      <div className="divide-y divide-gray-50">
        {homework.items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 px-4 py-3 cursor-pointer active:bg-gray-50"
            onClick={() => handleToggle(index)}
          >
            {/* 체크박스 */}
            <div
              className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                item.checked
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300"
              }`}
            >
              {item.checked && (
                <svg
                  className="w-3 h-3 text-white"
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
              )}
            </div>

            {/* 내용 */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm leading-snug ${
                  item.checked
                    ? "text-gray-400 line-through"
                    : "text-gray-700"
                }`}
              >
                {item.content}
              </p>
              {item.checked && item.checkedByName && (
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {item.checkedByName} 완료
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
