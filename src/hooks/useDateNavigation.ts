"use client";

import { useState, useCallback } from "react";
import { addDays } from "date-fns";

export function useDateNavigation() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const goToNext = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, 1));
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentDate((prev) => addDays(prev, -1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  return { currentDate, setDate: setCurrentDate, goToNext, goToPrev, goToToday };
}
