"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useFamily } from "@/context/FamilyContext";
import { createSchedule } from "@/lib/firebase/firestore";
import ScheduleForm, {
  ScheduleFormData,
} from "@/components/schedule/ScheduleForm";

export default function NewSchedulePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { family } = useFamily();

  if (!family || !user) return null;

  async function handleSubmit(data: ScheduleFormData) {
    await createSchedule({
      ...data,
      familyId: family!.id,
      createdBy: user!.uid,
    });
    router.push("/schedules");
  }

  return (
    <div>
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-lg font-bold text-gray-900">일정 추가</h1>
      </div>
      <div className="px-4 py-4">
        <ScheduleForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="추가"
        />
      </div>
    </div>
  );
}
