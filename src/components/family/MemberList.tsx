"use client";

import { FamilyMember } from "@/types";

interface MemberListProps {
  members: FamilyMember[];
  currentUid: string;
}

export default function MemberList({ members, currentUid }: MemberListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500 mb-3">
        가족 구성원 ({members.length}명)
      </h3>
      {members.map((member) => (
        <div
          key={member.uid}
          className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {member.displayName[0]}
            </div>
            <div>
              <p className="font-medium text-gray-800">
                {member.displayName}
                {member.uid === currentUid && (
                  <span className="text-xs text-blue-500 ml-2">나</span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                {member.role === "admin" ? "관리자" : "멤버"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
