"use client";

import { ReactNode } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { FamilyProvider, useFamily } from "@/context/FamilyContext";
import BottomNav from "@/components/layout/BottomNav";
import ScheduleAlarmManager from "@/components/schedule/ScheduleAlarmManager";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function MainContent({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isInFamily, loading: familyLoading } = useFamily();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || familyLoading) return;
    if (!user) return;
    if (!isInFamily) {
      router.replace("/create");
    }
  }, [user, isInFamily, authLoading, familyLoading, router]);

  if (authLoading || familyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isInFamily) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ScheduleAlarmManager />
      {children}
      <BottomNav />
    </div>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FamilyProvider>
        <MainContent>{children}</MainContent>
      </FamilyProvider>
    </AuthProvider>
  );
}
