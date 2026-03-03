import { format, isToday, addDays, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";

export function formatDateKorean(date: Date): string {
  if (isToday(date)) {
    return format(date, "M월 d일 EEEE (오늘)", { locale: ko });
  }
  return format(date, "M월 d일 EEEE", { locale: ko });
}

export function formatDateShort(date: Date): string {
  return format(date, "M/d", { locale: ko });
}

export function getDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDayOfWeek(date: Date): number {
  return date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

export function getWeekDates(date: Date): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday start
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  if (hour < 12) return `오전 ${hour}:${m}`;
  if (hour === 12) return `오후 12:${m}`;
  return `오후 ${hour - 12}:${m}`;
}
