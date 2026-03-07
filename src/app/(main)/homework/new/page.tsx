"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFamily } from "@/context/FamilyContext";
import { useAuth } from "@/context/AuthContext";
import { createHomework } from "@/lib/firebase/firestore";
import { getDateString } from "@/lib/utils/date";

export default function NewHomeworkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { family } = useFamily();
  const { user } = useAuth();

  const today = getDateString(new Date());
  const [date, setDate] = useState(searchParams.get("date") || today);
  const [academyName, setAcademyName] = useState("");
  const [note, setNote] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [saving, setSaving] = useState(false);

  if (!family || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName.trim() || !itemsText.trim()) return;

    setSaving(true);
    const items = itemsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((content) => ({ content, checked: false }));

    await createHomework({
      familyId: family.id,
      academyName: academyName.trim(),
      date,
      items,
      note: note.trim() || undefined,
      createdBy: user.uid,
    });

    router.back();
  };

  return (
    <div>
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500"
          >
            취소
          </button>
          <h1 className="text-lg font-bold text-gray-800">숙제 추가</h1>
          <div className="w-8" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 날짜 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              날짜
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 학원 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학원 이름
            </label>
            <input
              type="text"
              value={academyName}
              onChange={(e) => setAcademyName(e.target.value)}
              placeholder="예: 잉글리시 부띠끄"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 메모 (시험 등) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모 <span className="text-gray-400">(선택)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="예: Vocab Test"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 숙제 항목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              숙제 내용 <span className="text-gray-400">(줄바꿈으로 구분)</span>
            </label>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder={"Daily Homework: p. 1~2\n10 Vocabulary: Define & Study\nReview Grammar Lesson"}
              rows={6}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !academyName.trim() || !itemsText.trim()}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium text-sm disabled:opacity-50 active:bg-blue-600"
          >
            {saving ? "저장 중..." : "숙제 추가"}
          </button>
        </form>
      </div>
    </div>
  );
}
