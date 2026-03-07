"use client";

import { useEffect, useState, useMemo } from "react";
import { subscribeAllHomework } from "@/lib/firebase/firestore";
import { Homework } from "@/types";

/**
 * 해당 날짜에 활성화된 숙제를 반환합니다.
 * 각 학원별로 가장 최근에 부여된 숙제가 다음 숙제 전날까지 계속 표시됩니다.
 *
 * 예: 3/4 숙제, 3/6 숙제가 있으면
 *   - 3/4 → 3/4 숙제 표시
 *   - 3/5 → 3/4 숙제 표시
 *   - 3/6 → 3/6 숙제 표시
 */
export function useHomework(familyId: string | undefined, date: string) {
  const [allHomework, setAllHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setAllHomework([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeAllHomework(familyId, (list) => {
      setAllHomework(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [familyId]);

  const homework = useMemo(() => {
    if (!allHomework.length) return [];

    // 학원별로 그룹화
    const byAcademy = new Map<string, Homework[]>();
    for (const hw of allHomework) {
      const list = byAcademy.get(hw.academyName) || [];
      list.push(hw);
      byAcademy.set(hw.academyName, list);
    }

    const result: Homework[] = [];

    // 각 학원별로: 현재 날짜 이전(당일 포함) 중 가장 최근 숙제를 찾되,
    // 다음 숙제가 아직 안 온 경우에만 표시
    byAcademy.forEach((entries) => {
      // 날짜순 정렬
      const sorted = entries.sort((a, b) => a.date.localeCompare(b.date));

      // date 이하인 것 중 가장 마지막 것을 찾기
      let active: Homework | null = null;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].date <= date) {
          active = sorted[i];
        } else {
          break;
        }
      }

      if (active) {
        result.push(active);
      }
    });

    return result;
  }, [allHomework, date]);

  return { homework, loading };
}
