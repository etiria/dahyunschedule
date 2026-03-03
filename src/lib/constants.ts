export const SCHEDULE_COLORS: Record<
  string,
  { bg: string; border: string; text: string; label: string }
> = {
  school: {
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-800",
    label: "학교",
  },
  academy: {
    bg: "bg-green-50",
    border: "border-green-500",
    text: "text-green-800",
    label: "학원",
  },
};

export const DAY_LABELS_KO = ["일", "월", "화", "수", "목", "금", "토"];

export const PRESET_COLORS = [
  "#3B82F6", // blue
  "#22C55E", // green
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
];

export const APP_NAME = "다현이 일정표";
