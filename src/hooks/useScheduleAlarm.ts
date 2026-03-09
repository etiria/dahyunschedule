"use client";

import { useEffect, useRef, useCallback } from "react";
import { Schedule } from "@/types";
import { getDayOfWeek, getDateString } from "@/lib/utils/date";

const ACADEMY_ALARM_BEFORE = 15; // 학원 수업 시작 15분 전
const PICKUP_ALARM_BEFORE = 5; // 픽업/드랍 5분 전
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
function sendNotification(title: string, body: string, tag: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: "/icons/icon.svg",
    tag,
    requireInteraction: true,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

function fireAlarm(key: string, title: string, body: string, tag: string, firedSet: Set<string>) {
  if (firedSet.has(key)) return;
  firedSet.add(key);
  sendNotification(title, body, tag);
  playAlarmSound();
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
      const fired = firedRef.current;

      // 1) 학원 수업 시작 15분 전 알림
      const classAlarmMin = startMinutes - ACADEMY_ALARM_BEFORE;
      const classDiff = classAlarmMin - nowMinutes;
      if (classDiff >= -1 && classDiff <= 1) {
        const loc = schedule.location ? ` · ${schedule.location}` : "";
        fireAlarm(
          `class_${schedule.id}_${todayStr}`,
          `${schedule.title} ${ACADEMY_ALARM_BEFORE}분 전`,
          `${schedule.startTime} 시작${loc}`,
          `alarm-class-${schedule.id}-${todayStr}`,
          fired
        );
      }

      // 2) 픽업 5분 전 알림
      if (schedule.pickupTime) {
        const [ph, pm] = schedule.pickupTime.split(":").map(Number);
        const pickupMin = ph * 60 + pm;
        const pickupDiff = (pickupMin - PICKUP_ALARM_BEFORE) - nowMinutes;
        if (pickupDiff >= -1 && pickupDiff <= 1) {
          fireAlarm(
            `pickup_${schedule.id}_${todayStr}`,
            `🚗 ${schedule.title} 픽업 ${PICKUP_ALARM_BEFORE}분 전`,
            `${schedule.pickupTime} 픽업 출발`,
            `alarm-pickup-${schedule.id}-${todayStr}`,
            fired
          );
        }
      }

      // 3) 드랍 5분 전 알림
      if (schedule.dropoffTime) {
        const [dh, dm] = schedule.dropoffTime.split(":").map(Number);
        const dropMin = dh * 60 + dm;
        const dropDiff = (dropMin - PICKUP_ALARM_BEFORE) - nowMinutes;
        if (dropDiff >= -1 && dropDiff <= 1) {
          fireAlarm(
            `drop_${schedule.id}_${todayStr}`,
            `🚗 ${schedule.title} 드랍 ${PICKUP_ALARM_BEFORE}분 전`,
            `${schedule.dropoffTime} 드랍 출발`,
            `alarm-drop-${schedule.id}-${todayStr}`,
            fired
          );
        }
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
