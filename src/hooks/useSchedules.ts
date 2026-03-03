"use client";

import { useEffect, useState } from "react";
import { Schedule } from "@/types";
import { subscribeSchedules } from "@/lib/firebase/firestore";

export function useSchedules(familyId: string | undefined) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeSchedules(familyId, (data) => {
      setSchedules(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId]);

  return { schedules, loading };
}
