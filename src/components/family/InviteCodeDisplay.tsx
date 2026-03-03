"use client";

import { useState } from "react";

interface InviteCodeDisplayProps {
  code: string;
}

export default function InviteCodeDisplay({ code }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="bg-blue-50 rounded-2xl p-6 text-center">
      <p className="text-sm text-blue-600 font-medium mb-2">초대코드</p>
      <p className="text-3xl font-bold tracking-[0.3em] text-blue-800 font-mono">
        {code}
      </p>
      <button
        onClick={handleCopy}
        className="mt-3 px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
      >
        {copied ? "복사됨!" : "코드 복사"}
      </button>
      <p className="text-xs text-blue-500 mt-3">
        이 코드를 가족에게 공유하세요
      </p>
    </div>
  );
}
