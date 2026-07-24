import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EGGIM 라벨링",
  description: "내시경 위치·Kimura-Takemoto·EGGIM 다중전문가 라벨링",
};

export default function LabelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">{children}</div>
  );
}
