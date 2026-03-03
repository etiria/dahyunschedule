"use client";

import { useFamily } from "@/context/FamilyContext";
import { useSchedules } from "@/hooks/useSchedules";
import {
  useScheduleAlarm,
  requestNotificationPermission,
} from "@/hooks/useScheduleAlarm";
import { useEffect } from "react";

/**
 * 앱 전역에서 학원 알람을 관리하는 컴포넌트 (UI 없음).
 * MainLayout에 마운트하면 어떤 페이지에서든 알람이 동작합니다.
 */
export default function ScheduleAlarmManager() {
  const { family } = useFamily();
  const { schedules } = useSchedules(family?.id);

  // 알람 체크 훅 실행
  useScheduleAlarm(schedules);

  // 최초 마운트 시 알림 권한 요청 (이미 granted면 즉시 리턴)
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return null; // UI 없음
}
