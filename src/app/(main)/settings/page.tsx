"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFamily } from "@/context/FamilyContext";
import InviteCodeDisplay from "@/components/family/InviteCodeDisplay";
import MemberList from "@/components/family/MemberList";
import Header from "@/components/layout/Header";
import { requestNotificationPermission } from "@/hooks/useScheduleAlarm";
import {
  getAllFamiliesByUid,
  deleteFamily,
  updateInviteCode,
} from "@/lib/firebase/firestore";
import { Family } from "@/types";

export default function SettingsPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [notifStatus, setNotifStatus] = useState<
    "granted" | "denied" | "default" | "unsupported"
  >("default");

  // 가족 관리
  const [allFamilies, setAllFamilies] = useState<(Family & { id: string })[]>(
    []
  );
  const [loadingFamilies, setLoadingFamilies] = useState(false);
  const [showFamilyManager, setShowFamilyManager] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 초대코드 변경
  const [editingCode, setEditingCode] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [savingCode, setSavingCode] = useState(false);

  // 현재 알림 권한 상태 확인
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
    } else {
      setNotifStatus(
        Notification.permission as "granted" | "denied" | "default"
      );
    }
  }, []);

  const handleEnableNotification = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? "granted" : "denied");
  }, []);

  const loadAllFamilies = useCallback(async () => {
    if (!user) return;
    setLoadingFamilies(true);
    const families = await getAllFamiliesByUid(user.uid);
    setAllFamilies(families);
    setLoadingFamilies(false);
  }, [user]);

  const handleDeleteFamily = useCallback(
    async (familyId: string, familyName: string) => {
      if (family && familyId === family.id) {
        alert("현재 사용 중인 가족은 삭제할 수 없습니다.");
        return;
      }
      if (!confirm(`"${familyName}" 가족을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`))
        return;

      setDeleting(familyId);
      try {
        await deleteFamily(familyId);
        setAllFamilies((prev) => prev.filter((f) => f.id !== familyId));
      } catch {
        alert("삭제에 실패했습니다.");
      } finally {
        setDeleting(null);
      }
    },
    [family]
  );

  const handleUpdateCode = useCallback(async () => {
    if (!family || !newCode.trim()) return;
    setSavingCode(true);
    try {
      await updateInviteCode(family.id, newCode.trim());
      setEditingCode(false);
      setNewCode("");
      // 페이지 새로고침으로 반영
      window.location.reload();
    } catch {
      alert("코드 변경에 실패했습니다.");
    } finally {
      setSavingCode(false);
    }
  }, [family, newCode]);

  if (!family || !user) return null;

  return (
    <div>
      <Header childName={family.childName} />

      <div className="px-4 py-4 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">가족 설정</h2>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">가족 이름</span>
                <span className="text-sm font-medium text-gray-800">
                  {family.familyName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">아이 이름</span>
                <span className="text-sm font-medium text-gray-800">
                  {family.childName}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 알림 설정 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">알림 설정</h2>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">학원 알림</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  학원 시작 15분 전에 알림을 보냅니다
                </p>
              </div>
              {notifStatus === "unsupported" ? (
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                  미지원
                </span>
              ) : notifStatus === "granted" ? (
                <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full font-medium">
                  ✓ 켜짐
                </span>
              ) : notifStatus === "denied" ? (
                <div className="text-right">
                  <span className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full">
                    차단됨
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    브라우저 설정에서 허용해주세요
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleEnableNotification}
                  className="text-xs text-white bg-blue-500 px-4 py-1.5 rounded-full font-medium active:bg-blue-600"
                >
                  허용하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 초대코드 + 변경 */}
        <div>
          <InviteCodeDisplay code={family.inviteCode} />

          {!editingCode ? (
            <button
              onClick={() => {
                setEditingCode(true);
                setNewCode(family.inviteCode);
              }}
              className="mt-2 w-full text-sm text-blue-500 font-medium py-2 active:text-blue-600"
            >
              초대코드 변경하기
            </button>
          ) : (
            <div className="mt-3 bg-white rounded-2xl p-4 border border-blue-100">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                새 초대코드
              </label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="예: DAHYUN2026"
                maxLength={20}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-wider font-mono"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setEditingCode(false);
                    setNewCode("");
                  }}
                  className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:bg-gray-200"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdateCode}
                  disabled={
                    savingCode ||
                    !newCode.trim() ||
                    newCode.trim() === family.inviteCode
                  }
                  className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:bg-blue-600"
                >
                  {savingCode ? "변경 중..." : "변경"}
                </button>
              </div>
            </div>
          )}
        </div>

        <MemberList members={family.members} currentUid={user.uid} />

        {/* 가족 정리 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">가족 정리</h2>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 mb-3">
              중복이나 테스트로 만들어진 가족 그룹을 삭제할 수 있습니다.
            </p>

            {!showFamilyManager ? (
              <button
                onClick={() => {
                  setShowFamilyManager(true);
                  loadAllFamilies();
                }}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium active:bg-gray-200"
              >
                내 가족 목록 보기
              </button>
            ) : loadingFamilies ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {allFamilies.map((f) => {
                  const isCurrent = family && f.id === family.id;
                  return (
                    <div
                      key={f.id}
                      className={`flex items-center justify-between p-3 rounded-xl border ${
                        isCurrent
                          ? "border-blue-200 bg-blue-50"
                          : "border-gray-100 bg-gray-50"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {f.familyName || "(이름 없음)"}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                              현재
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {f.childName} · 멤버 {f.members?.length || 0}명 ·
                          코드: {f.inviteCode}
                        </p>
                      </div>
                      {!isCurrent && (
                        <button
                          onClick={() =>
                            handleDeleteFamily(f.id, f.familyName)
                          }
                          disabled={deleting === f.id}
                          className="ml-2 text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-full font-medium active:bg-red-100 disabled:opacity-50 shrink-0"
                        >
                          {deleting === f.id ? "삭제 중..." : "삭제"}
                        </button>
                      )}
                    </div>
                  );
                })}
                {allFamilies.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    등록된 가족이 없습니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <p className="text-xs text-gray-400 text-center">
            다현이 일정표 v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
