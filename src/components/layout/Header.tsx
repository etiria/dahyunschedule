"use client";

interface HeaderProps {
  childName: string;
  familyName?: string;
}

export default function Header({ childName }: HeaderProps) {
  return (
    <div className="bg-white border-b border-gray-100 px-4 py-3">
      <h1 className="text-lg font-bold text-gray-900">
        {childName}이 일정표
      </h1>
    </div>
  );
}
