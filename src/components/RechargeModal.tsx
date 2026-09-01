"use client";

import { useEffect, useRef, useState } from "react";
import { User } from "@supabase/supabase-js";
import { TossPaymentsWidgets } from "@tosspayments/tosspayments-sdk";
import { Zap, X, Loader2, RefreshCw, ChevronLeft } from "lucide-react";
import { CREDIT_PACKAGES } from "@/lib/creditPackages";
import { SUBSCRIPTION_PLAN } from "@/lib/subscriptionPlan";
import { getTossPayment, getTossWidgets } from "@/lib/toss";
import { createClient } from "@/lib/supabase/client";

type RechargeModalProps = {
  open: boolean;
  user: User;
  onClose: () => void;
};

type SubscriptionStatus = "active" | "none" | "loading";

type OrderInfo = {
  orderId: string;
  amount: number;
  orderName: string;
  customerEmail?: string;
};

export default function RechargeModal({
  open,
  user,
  onClose,
}: RechargeModalProps) {
  const [loadingPackageId, setLoadingPackageId] = useState<string | null>(
    null
  );
  const [subscribing, setSubscribing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<SubscriptionStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const widgetsRef = useRef<TossPaymentsWidgets | null>(null);

  useEffect(() => {
    (async () => {
      if (!open) return;

      setSubscriptionStatus("loading");
      const supabase = createClient();
      const { data } = await supabase
        .from("subscriptions")
        .select("status")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      setSubscriptionStatus(data ? "active" : "none");
    })();
  }, [open, user.id]);

  useEffect(() => {
    (async () => {
      if (!order) return;
      try {
        const widgets = await getTossWidgets(user.id);
        widgetsRef.current = widgets;
        await widgets.setAmount({ currency: "KRW", value: order.amount });
        await widgets.renderPaymentMethods({
          selector: "#toss-payment-methods",
        });
        await widgets.renderAgreement({ selector: "#toss-agreement" });
        setCheckoutReady(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "결제 UI 초기화에 실패했습니다."
        );
        setOrder(null);
      }
    })();
  }, [order, user.id]);

  if (!open) return null;

  const handleSelectPackage = async (packageId: string) => {
    setError(null);
    setLoadingPackageId(packageId);
    try {
      const orderRes = await fetch("/api/payments/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(data.error || "주문 생성에 실패했습니다.");
      }

      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 요청에 실패했습니다.");
    } finally {
      setLoadingPackageId(null);
    }
  };

  const handlePay = async () => {
    if (!order || !widgetsRef.current) return;
    setError(null);
    setPaying(true);
    try {
      await widgetsRef.current.requestPayment({
        orderId: order.orderId,
        orderName: order.orderName,
        customerEmail: order.customerEmail,
        successUrl: `${window.location.origin}/payments/success`,
        failUrl: `${window.location.origin}/payments/fail`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제에 실패했습니다.");
      setPaying(false);
    }
  };

  const handleBackToPackages = () => {
    setOrder(null);
    setCheckoutReady(false);
    setError(null);
  };

  const handleSubscribe = async () => {
    setError(null);
    setSubscribing(true);
    try {
      const payment = await getTossPayment(user.id);
      await payment.requestBillingAuth({
        method: "CARD",
        customerEmail: user.email ?? undefined,
        successUrl: `${window.location.origin}/subscriptions/success`,
        failUrl: `${window.location.origin}/subscriptions/fail`,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "구독 등록 요청에 실패했습니다."
      );
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    setError(null);
    setCanceling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "구독 해지에 실패했습니다.");
      }
      setSubscriptionStatus("none");
    } catch (err) {
      setError(err instanceof Error ? err.message : "구독 해지에 실패했습니다.");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={order ? handleBackToPackages : onClose}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 p-1"
          aria-label={order ? "패키지 선택으로 돌아가기" : "충전 창 닫기"}
        >
          {order ? (
            <ChevronLeft className="w-5 h-5" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
          aria-label="충전 창 닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {!order && (
          <>
            <h2 className="text-lg font-bold text-center mb-1">크레딧 충전</h2>
            <p className="text-xs text-slate-400 text-center mb-6">
              충전한 크레딧은 대본 생성 1회당 1개씩 차감됩니다.
            </p>

            <div className="flex flex-col gap-2.5">
              {CREDIT_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  type="button"
                  disabled={loadingPackageId !== null}
                  onClick={() => handleSelectPackage(pkg.id)}
                  className="w-full flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800 text-slate-100 px-4 py-3 rounded-xl text-sm transition disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium">{pkg.credits}회</span>
                    {pkg.badge && (
                      <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-semibold">
                        {pkg.badge}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 text-slate-300">
                    {loadingPackageId === pkg.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      `${pkg.amount.toLocaleString()}원`
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="my-5 flex items-center gap-3 text-[10px] text-slate-600">
              <div className="h-px flex-1 bg-slate-800" />
              <span>또는</span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            {subscriptionStatus === "loading" && (
              <div className="flex justify-center py-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              </div>
            )}

            {subscriptionStatus === "none" && (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={subscribing}
                className="w-full flex items-center justify-between gap-2 bg-indigo-950/40 border border-indigo-700/50 hover:border-indigo-500 hover:bg-indigo-950/70 text-slate-100 px-4 py-3 rounded-xl text-sm transition disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-indigo-400" />
                  <span className="font-medium">
                    매달 {SUBSCRIPTION_PLAN.credits}회 자동 충전
                  </span>
                </span>
                <span className="flex items-center gap-2 text-indigo-300">
                  {subscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    `${SUBSCRIPTION_PLAN.amount.toLocaleString()}원/월`
                  )}
                </span>
              </button>
            )}

            {subscriptionStatus === "active" && (
              <div className="bg-indigo-950/40 border border-indigo-700/50 rounded-xl px-4 py-3 text-sm space-y-2">
                <p className="text-indigo-300 font-medium flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" />
                  정기구독 이용 중 (매달 {SUBSCRIPTION_PLAN.credits}회)
                </p>
                <button
                  type="button"
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="text-xs text-slate-400 hover:text-rose-400 underline disabled:opacity-50"
                >
                  {canceling ? "해지 처리 중..." : "구독 해지하기"}
                </button>
              </div>
            )}
          </>
        )}

        {order && (
          <>
            <h2 className="text-lg font-bold text-center mb-1 mt-2">
              {order.orderName}
            </h2>
            <p className="text-xs text-slate-400 text-center mb-4">
              {order.amount.toLocaleString()}원
            </p>

            {!checkoutReady && (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              </div>
            )}

            <div id="toss-payment-methods" />
            <div id="toss-agreement" className="mt-2" />

            <button
              type="button"
              onClick={handlePay}
              disabled={!checkoutReady || paying}
              className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-pink-500 text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {paying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `${order.amount.toLocaleString()}원 결제하기`
              )}
            </button>
          </>
        )}

        {error && (
          <p className="text-xs text-rose-400 text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
