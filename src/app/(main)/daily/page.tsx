"use client";

import { useFamily } from "@/context/FamilyContext";
import { useAuth } from "@/context/AuthContext";
import { useSchedules } from "@/hooks/useSchedules";
import { useChecks } from "@/hooks/useChecks";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { getDateString } from "@/lib/utils/date";
import Header from "@/components/layout/Header";
import DateSelector from "@/components/layout/DateSelector";
import DailyTimeline from "@/components/schedule/DailyTimeline";

export default function DailyPage() {
  const { user } = useAuth();
  const { family } = useFamily();
  const { currentDate, goToNext, goToPrev, goToToday } = useDateNavigation();
  const dateString = getDateString(currentDate);

  const { schedules } = useSchedules(family?.id);
  const { checks } = useChecks(family?.id, dateString);

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
      </div>
    </div>
  );
}
