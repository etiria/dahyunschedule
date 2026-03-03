"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { findFamilyByInviteCode, joinFamily } from "@/lib/firebase/firestore";
import Link from "next/link";

export default function JoinFamilyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [inviteCode, setInviteCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!inviteCode.trim() || !displayName.trim()) {
      setError("초대코드와 이름을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const family = await findFamilyByInviteCode(inviteCode.trim());
      if (!family) {
        setError("올바르지 않은 초대코드입니다.");
        setLoading(false);
        return;
      }

      if (family.memberUids.includes(user.uid)) {
        router.push("/daily");
        return;
      }

      await joinFamily(family.id, user.uid, displayName.trim());
      router.push("/daily");
    } catch {
      setError("참여하는데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">가족 참여하기</h1>
          <p className="text-gray-500 mt-2">
            초대코드를 입력해서 가족에 참여하세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              초대코드
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="6자리 코드 입력"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-2xl tracking-[0.5em] font-mono uppercase"
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
            {loading ? "참여하는 중..." : "가족 참여하기"}
          </button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/create"
            className="text-blue-500 text-sm hover:underline"
          >
            새로 가족 만들기
          </Link>
        </div>
      </div>
    </div>
  );
}
