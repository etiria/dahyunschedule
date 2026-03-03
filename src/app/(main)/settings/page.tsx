"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useFamily } from "@/context/FamilyContext";
import InviteCodeDisplay from "@/components/family/InviteCodeDisplay";
import MemberList from "@/components/family/MemberList";
import Header from "@/components/layout/Header";
import { requestNotificationPermission } from "@/hooks/useScheduleAlarm";

export default function SettingsPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const [notifStatus, setNotifStatus] = useState<
    "granted" | "denied" | "default" | "unsupported"
  >("default");

  // 현재 알림 권한 상태 확인
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
    } else {
      setNotifStatus(Notification.permission as "granted" | "denied" | "default");
    }
  }, []);

  const handleEnableNotification = useCallback(async () => {
    const granted = await requestNotificationPermission();
    setNotifStatus(granted ? "granted" : "denied");
  }, []);

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
                <p className="text-sm font-medium text-gray-800">
                  학원 알림
                </p>
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

        <InviteCodeDisplay code={family.inviteCode} />

        <MemberList members={family.members} currentUid={user.uid} />

        <div className="pt-4">
          <p className="text-xs text-gray-400 text-center">
            다현이 일정표 v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
