"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Family } from "@/types";
import { useAuth } from "./AuthContext";
import { subscribeFamilyByUid } from "@/lib/firebase/firestore";

interface FamilyContextType {
  family: (Family & { id: string }) | null;
  loading: boolean;
  isInFamily: boolean;
}

const FamilyContext = createContext<FamilyContextType>({
  family: null,
  loading: true,
  isInFamily: false,
});

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [family, setFamily] = useState<(Family & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 인증 로딩 중이면 아무것도 하지 않음 (loading 유지)
    if (authLoading) {
      return;
    }

    // 인증 완료됐지만 유저가 없는 경우
    if (!user) {
      setFamily(null);
      setLoading(false);
      return;
    }

    // 유저가 있으면 구독 시작 (구독 콜백 올 때까지 loading 유지)
    setLoading(true);
    const unsubscribe = subscribeFamilyByUid(user.uid, (familyData) => {
      setFamily(familyData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return (
    <FamilyContext.Provider
      value={{ family, loading: loading || authLoading, isInFamily: !!family }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  return useContext(FamilyContext);
}
