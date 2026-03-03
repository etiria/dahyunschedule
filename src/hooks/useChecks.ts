"use client";

import { useEffect, useState } from "react";
import { Check } from "@/types";
import { subscribeChecks } from "@/lib/firebase/firestore";

export function useChecks(familyId: string | undefined, date: string) {
  const [checks, setChecks] = useState<Map<string, Check>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setChecks(new Map());
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeChecks(familyId, date, (data) => {
      setChecks(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId, date]);

  return { checks, loading };
}
