"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";

function FailContent() {
  const searchParams = useSearchParams();
  const message =
    searchParams.get("message") || "결제가 취소되었거나 실패했습니다.";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <XCircle className="w-10 h-10 mx-auto text-rose-400" />
        <p className="text-sm text-slate-200">{message}</p>
        <Link
          href="/"
          className="inline-block mt-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={null}>
      <FailContent />
    </Suspense>
  );
}
