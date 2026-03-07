"use client";

import { useFamily } from "@/context/FamilyContext";
import { useAuth } from "@/context/AuthContext";
import { useSchedules } from "@/hooks/useSchedules";
import { useChecks } from "@/hooks/useChecks";
import { useHomework } from "@/hooks/useHomework";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { getDateString } from "@/lib/utils/date";
import Header from "@/components/layout/Header";
import DateSelector from "@/components/layout/DateSelector";
import DailyTimeline from "@/components/schedule/DailyTimeline";
import HomeworkCard from "@/components/schedule/HomeworkCard";

export default function DailyPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { currentDate, goToNext, goToPrev, goToToday } = useDateNavigation();
  const dateString = getDateString(currentDate);

  const { schedules } = useSchedules(family?.id);
  const { checks } = useChecks(family?.id, dateString);
  const { homework } = useHomework(family?.id, dateString);

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
      <div className="px-4">
        <DailyTimeline
          schedules={schedules}
          checks={checks}
          familyId={family.id}
          date={currentDate}
          dateString={dateString}
          checkerUid={user.uid}
          checkerName={displayName}
        />

        {/* 숙제 섹션 */}
        {homework.length > 0 && (
          <div className="mt-6 mb-4">
            <h3 className="text-sm font-bold text-gray-600 mb-3">📚 오늘의 숙제</h3>
            <div className="space-y-3">
              {homework.map((hw) => (
                <HomeworkCard
                  key={hw.id}
                  homework={hw}
                  checkerUid={user.uid}
                  checkerName={displayName}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
