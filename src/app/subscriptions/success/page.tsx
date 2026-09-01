"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "done" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("구독을 등록하고 있습니다...");

  useEffect(() => {
    (async () => {
      const authKey = searchParams.get("authKey");
      const customerKey = searchParams.get("customerKey");

      if (!authKey || !customerKey) {
        setStatus("error");
        setMessage("구독 등록 정보가 올바르지 않습니다.");
        return;
      }

      try {
        const res = await fetch("/api/subscriptions/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authKey, customerKey }),
        });
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "구독 등록에 실패했습니다.");
          return;
        }

        setStatus("done");
        setMessage(
          `정기구독이 시작됐어요! 남은 크레딧: ${data.creditsLeft}회`
        );
      } catch {
        setStatus("error");
        setMessage("네트워크 오류로 구독 등록에 실패했습니다.");
      }
    })();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        {status === "loading" && (
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-indigo-400" />
        )}
        {status === "done" && (
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
        )}
        {status === "error" && (
          <XCircle className="w-10 h-10 mx-auto text-rose-400" />
        )}
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

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
