"use client";

import { useState, useCallback } from "react";
import { useFamily } from "@/context/FamilyContext";
import { useAuth } from "@/context/AuthContext";
import { useHomework } from "@/hooks/useHomework";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { getDateString } from "@/lib/utils/date";
import { createHomework } from "@/lib/firebase/firestore";
import { ENGLISH_BOUTIQUE_DATA } from "@/lib/data/englishBoutiqueHomework";
import { ENGLISH_BOUTIQUE_APRIL_DATA } from "@/lib/data/englishBoutiqueHomeworkApril";
import Header from "@/components/layout/Header";
import DateSelector from "@/components/layout/DateSelector";
import HomeworkCard from "@/components/schedule/HomeworkCard";
import Link from "next/link";

export default function HomeworkPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { currentDate, goToNext, goToPrev, goToToday } = useDateNavigation();
  const dateString = getDateString(currentDate);
  const { homework, loading } = useHomework(family?.id, dateString);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [seedingApril, setSeedingApril] = useState(false);
  const [seededApril, setSeededApril] = useState(false);

  const seedEnglishBoutique = useCallback(async () => {
    if (!family || !user) return;
    setSeeding(true);
    for (const entry of ENGLISH_BOUTIQUE_DATA) {
      await createHomework({
        familyId: family.id,
        academyName: "잉글리시 부띠끄",
        date: entry.date,
        items: entry.items.map((content) => ({ content, checked: false })),
        note: entry.note,
        createdBy: user.uid,
      });
    }
    setSeeding(false);
    setSeeded(true);
  }, [family, user]);

  const seedEnglishBoutiqueApril = useCallback(async () => {
    if (!family || !user) return;
    setSeedingApril(true);
    for (const entry of ENGLISH_BOUTIQUE_APRIL_DATA) {
      await createHomework({
        familyId: family.id,
        academyName: "잉글리시 부띠끄",
        date: entry.date,
        items: entry.items.map((content) => ({ content, checked: false })),
        note: entry.note,
        createdBy: user.uid,
      });
    }
    setSeedingApril(false);
    setSeededApril(true);
  }, [family, user]);

  if (!family || !user) return null;

  const currentMember = family.members.find((m) => m.uid === user.uid);
  const displayName = currentMember?.displayName || "나";

  return (
    <div>
      <Header childName={family.childName} />
      <DateSelector
        date={currentDate}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
      />

      <div className="px-4 space-y-4 pb-4">
        {/* 헤더 + 추가 버튼 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">숙제</h2>
          <Link
            href={`/homework/new?date=${dateString}`}
            className="text-sm text-blue-500 font-medium active:text-blue-600"
          >
            + 추가
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : homework.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-gray-400 text-sm">이 날은 숙제가 없어요</p>
            <Link
              href={`/homework/new?date=${dateString}`}
              className="inline-block mt-3 text-sm text-blue-500 font-medium"
            >
              숙제 추가하기
            </Link>
          </div>
        ) : (
          homework.map((hw) => (
            <HomeworkCard
              key={hw.id}
              homework={hw}
              checkerUid={user.uid}
              checkerName={displayName}
            />
          ))
        )}

        {/* 잉글리시 부띠끄 데이터 일괄 입력 */}
        {!seeded && (
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
            <p className="text-sm font-medium text-orange-800 mb-2">
              잉글리시 부띠끄 3월 숙제
            </p>
            <p className="text-xs text-orange-600 mb-3">
              3월 전체 숙제 데이터를 한번에 입력합니다 (12회차)
            </p>
            <button
              onClick={seedEnglishBoutique}
              disabled={seeding}
              className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:bg-orange-600"
            >
              {seeding ? "입력 중..." : "일괄 입력하기"}
            </button>
          </div>
        )}
        {seeded && (
          <p className="text-center text-sm text-green-600 font-medium">
            잉글리시 부띠끄 3월 숙제가 입력되었습니다!
          </p>
        )}

        {/* 잉글리시 부띠끄 4월 데이터 일괄 입력 */}
        {!seededApril && (
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <p className="text-sm font-medium text-blue-800 mb-2">
              잉글리시 부띠끄 4월 숙제
            </p>
            <p className="text-xs text-blue-600 mb-3">
              4월 전체 숙제 데이터를 한번에 입력합니다 (12회차)
            </p>
            <button
              onClick={seedEnglishBoutiqueApril}
              disabled={seedingApril}
              className="w-full py-2 bg-blue-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 active:bg-blue-600"
            >
              {seedingApril ? "입력 중..." : "일괄 입력하기"}
            </button>
          </div>
        )}
        {seededApril && (
          <p className="text-center text-sm text-green-600 font-medium">
            잉글리시 부띠끄 4월 숙제가 입력되었습니다!
          </p>
        )}
      </div>
    </div>
  );
}
