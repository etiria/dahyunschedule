"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFamily } from "@/context/FamilyContext";
import { useAuth } from "@/context/AuthContext";
import { createHomework } from "@/lib/firebase/firestore";
import { getDateString } from "@/lib/utils/date";

export default function NewHomeworkPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <NewHomeworkContent />
    </Suspense>
  );
}

function NewHomeworkContent() {
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

  // 사진 관련 state
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!family || !user) return null;

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 미리보기
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // base64 변환
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Full = reader.result as string;
      // "data:image/jpeg;base64,..." 에서 base64 부분만 추출
      const base64 = base64Full.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      setExtracting(true);
      setExtractError("");

      try {
        const res = await fetch("/api/extract-homework", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64, mimeType }),
        });

        const data = await res.json();

        if (!res.ok) {
          setExtractError(data.error || "추출에 실패했습니다.");
          return;
        }

        // 추출된 데이터로 폼 채우기
        if (data.academyName && !academyName) {
          setAcademyName(data.academyName);
        }
        if (data.date && !date) {
          setDate(data.date);
        }
        if (data.note) {
          setNote(data.note);
        }
        if (data.items && Array.isArray(data.items)) {
          const newItems = data.items.join("\n");
          setItemsText((prev) => (prev ? prev + "\n" + newItems : newItems));
        }
      } catch {
        setExtractError("네트워크 오류가 발생했습니다.");
      } finally {
        setExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

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

        {/* 사진으로 추출 섹션 */}
        <div className="mb-6 bg-gradient-to-br from-violet-50 to-blue-50 rounded-2xl p-4 border border-violet-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📸</span>
            <p className="text-sm font-semibold text-violet-800">
              사진으로 숙제 입력
            </p>
          </div>
          <p className="text-xs text-violet-600 mb-3">
            숙제 사진을 찍거나 선택하면 AI가 내용을 자동으로 읽어옵니다
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.setAttribute("capture", "environment");
                  fileInputRef.current.click();
                }
              }}
              disabled={extracting}
              className="flex-1 py-2.5 bg-violet-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:bg-violet-600 flex items-center justify-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              카메라
            </button>
            <button
              type="button"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute("capture");
                  fileInputRef.current.click();
                }
              }}
              disabled={extracting}
              className="flex-1 py-2.5 bg-white text-violet-600 border border-violet-200 rounded-xl text-sm font-medium disabled:opacity-50 active:bg-violet-50 flex items-center justify-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              앨범
            </button>
          </div>

          {/* 추출 중 로딩 */}
          {extracting && (
            <div className="mt-3 flex items-center gap-2 justify-center py-3">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-violet-600 font-medium">
                AI가 숙제를 읽고 있어요...
              </span>
            </div>
          )}

          {/* 에러 */}
          {extractError && (
            <p className="mt-2 text-xs text-red-500 text-center">
              {extractError}
            </p>
          )}

          {/* 미리보기 */}
          {previewUrl && (
            <div className="mt-3 relative rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="숙제 사진"
                className="w-full h-40 object-cover rounded-xl"
              />
              {!extracting && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          )}
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
              숙제 내용{" "}
              <span className="text-gray-400">(줄바꿈으로 구분)</span>
            </label>
            <textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder={
                "Daily Homework: p. 1~2\n10 Vocabulary: Define & Study\nReview Grammar Lesson"
              }
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
