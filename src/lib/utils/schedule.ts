import { Schedule } from "@/types";

export function filterSchedulesByDay(
  schedules: Schedule[],
  dayOfWeek: number
): Schedule[] {
  return schedules
    .filter((s) => s.daysOfWeek.includes(dayOfWeek))
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}
