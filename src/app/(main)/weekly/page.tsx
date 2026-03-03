"use client";

import { useEffect, useState, useCallback } from "react";
import { useFamily } from "@/context/FamilyContext";
import { useSchedules } from "@/hooks/useSchedules";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { getWeekDates, getDateString } from "@/lib/utils/date";
import { subscribeChecks } from "@/lib/firebase/firestore";
import { Check } from "@/types";
import Header from "@/components/layout/Header";
import DateSelector from "@/components/layout/DateSelector";
import WeeklyGrid from "@/components/schedule/WeeklyGrid";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";

export default function WeeklyPage() {
  const { family } = useFamily();
  const { currentDate, goToToday, setDate } = useDateNavigation();
  const { schedules } = useSchedules(family?.id);
  const router = useRouter();
  const [weekChecks, setWeekChecks] = useState<
    Map<string, Map<string, boolean>>
  >(new Map());

  const goToPrevWeek = useCallback(() => {
    setDate((prev) => addDays(prev, -7));
  }, [setDate]);

  const goToNextWeek = useCallback(() => {
    setDate((prev) => addDays(prev, 7));
  }, [setDate]);

  useEffect(() => {
    if (!family?.id) return;

    const weekDates = getWeekDates(currentDate);
    const unsubscribes: (() => void)[] = [];

    weekDates.forEach((date) => {
      const dateStr = getDateString(date);
      const unsub = subscribeChecks(
        family.id,
        dateStr,
        (checksMap: Map<string, Check>) => {
          setWeekChecks((prev) => {
            const next = new Map(prev);
            const dayMap = new Map<string, boolean>();
            checksMap.forEach((check, scheduleId) => {
              dayMap.set(scheduleId, check.status === "checked");
            });
            next.set(dateStr, dayMap);
            return next;
          });
        }
      );
      unsubscribes.push(unsub);
    });

    return () => unsubscribes.forEach((u) => u());
  }, [family?.id, currentDate]);

  if (!family) return null;

  function handleDayClick(date: Date) {
    void date;
    router.push("/daily");
  }

  return (
    <div>
      <Header childName={family.childName} />
      <DateSelector
        date={currentDate}
        onPrev={goToPrevWeek}
        onNext={goToNextWeek}
        onToday={goToToday}
      />
      <WeeklyGrid
        schedules={schedules}
        weekChecks={weekChecks}
        currentDate={currentDate}
        onDayClick={handleDayClick}
      />
    </div>
  );
}
