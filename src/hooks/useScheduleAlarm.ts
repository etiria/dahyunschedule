"use client";

import { useEffect, useRef, useCallback } from "react";
import { Schedule } from "@/types";
import { getDayOfWeek, getDateString } from "@/lib/utils/date";

const ALARM_BEFORE_MINUTES = 15;
const CHECK_INTERVAL_MS = 30 * 1000; // 30초마다 체크

// 알림 소리 재생
function playAlarmSound() {
  try {
    const ctx = new AudioContext();
    // 알림음: 두 번 띵띵
    [0, 300].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = "sine";
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + delay / 1000);
      osc.stop(ctx.currentTime + delay / 1000 + 0.15);
    });
  } catch {
    // AudioContext 지원 안 되는 환경 무시
  }
}

// 브라우저 알림 권한 요청
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

// 브라우저 알림 보내기
function sendNotification(schedule: Schedule, minutesBefore: number) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const title = `${schedule.title} ${minutesBefore}분 전`;
  const body = schedule.location
    ? `${schedule.startTime} 시작 · ${schedule.location}`
    : `${schedule.startTime} 시작`;

  const notification = new Notification(title, {
    body,
    icon: "/icons/icon.svg",
    tag: `alarm-${schedule.id}-${getDateString(new Date())}`,
    requireInteraction: true,
  });

  // 알림 클릭 시 앱으로 이동
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

export function useScheduleAlarm(schedules: Schedule[]) {
  // 오늘 이미 울린 알림 추적 (scheduleId_date)
  const firedRef = useRef<Set<string>>(new Set());

  const checkAlarms = useCallback(() => {
    const now = new Date();
    const todayDow = getDayOfWeek(now);
    const todayStr = getDateString(now);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // 학원 일정만 필터
    const academySchedules = schedules.filter(
      (s) => s.type === "academy" && s.daysOfWeek.includes(todayDow)
    );

    academySchedules.forEach((schedule) => {
      const [h, m] = schedule.startTime.split(":").map(Number);
      const startMinutes = h * 60 + m;
      const alarmMinutes = startMinutes - ALARM_BEFORE_MINUTES;
      const diff = alarmMinutes - nowMinutes;

      // 알람 시간이 지금부터 0~1분 이내이고, 아직 안 울렸으면
      const alarmKey = `${schedule.id}_${todayStr}`;
      if (diff >= -1 && diff <= 1 && !firedRef.current.has(alarmKey)) {
        firedRef.current.add(alarmKey);
        sendNotification(schedule, ALARM_BEFORE_MINUTES);
        playAlarmSound();
      }
    });
  }, [schedules]);

  useEffect(() => {
    // 날짜가 바뀌면 fired 목록 초기화
    const todayStr = getDateString(new Date());
    const currentFired = firedRef.current;
    currentFired.forEach((key) => {
      if (!key.endsWith(todayStr)) {
        currentFired.delete(key);
      }
    });

    // 주기적 체크 시작
    checkAlarms(); // 즉시 한 번 체크
    const interval = setInterval(checkAlarms, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [checkAlarms]);
}
