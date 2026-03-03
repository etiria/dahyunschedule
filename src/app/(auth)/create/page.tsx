"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createFamily } from "@/lib/firebase/firestore";
import { createInviteCode } from "@/lib/utils/inviteCode";
import Link from "next/link";

export default function CreateFamilyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [familyName, setFamilyName] = useState("");
  const [childName, setChildName] = useState("다현");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!familyName.trim() || !childName.trim() || !displayName.trim()) {
      setError("모든 항목을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const inviteCode = createInviteCode();
      await createFamily(
        familyName.trim(),
        childName.trim(),
        inviteCode,
        user.uid,
        displayName.trim()
      );
      router.push("/daily");
    } catch {
      setError("가족 그룹을 만드는데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">가족 만들기</h1>
          <p className="text-gray-500 mt-2">
            가족 그룹을 만들고 초대코드를 공유하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              가족 이름
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="예: 다현이네 가족"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              아이 이름
            </label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="예: 다현"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              내 이름 (호칭)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="예: 엄마, 아빠, 할머니"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {loading ? "만드는 중..." : "가족 만들기"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/join"
            className="text-blue-500 text-sm hover:underline"
          >
            초대코드가 있나요? 가족 참여하기
          </Link>
        </div>
      </div>
    </div>
  );
}
