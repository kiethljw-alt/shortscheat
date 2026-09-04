'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Loader2,
  LogOut,
  RefreshCw,
  AlertTriangle,
  X,
  Receipt,
  History,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_PLAN } from '@/lib/subscriptionPlan';
import { getCreditPackage } from '@/lib/creditPackages';

type SubscriptionStatus = 'active' | 'none' | 'loading';

type OrderRow = {
  order_id: string;
  package_id: string;
  credits: number;
  amount: number;
  paid_at: string | null;
  created_at: string;
};

type LedgerRow = {
  id: number;
  delta: number;
  balance_after: number;
  reason: string;
  created_at: string;
};

const REASON_LABELS: Record<string, string> = {
  signup_bonus: '가입 축하 크레딧',
  generation: '대본 생성',
  generation_refund: '생성 실패 환불',
  topup: '크레딧 충전',
  subscription: '정기구독 크레딧 지급',
};

const PROVIDER_LABELS: Record<string, string> = {
  google: '구글',
  kakao: '카카오',
};

function getOrderLabel(packageId: string): string {
  if (packageId === SUBSCRIPTION_PLAN.id) return SUBSCRIPTION_PLAN.label;
  const pkg = getCreditPackage(packageId);
  return pkg ? `크레딧 충전 · ${pkg.credits}회 (${pkg.label})` : packageId;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');
  const [nextBillingAt, setNextBillingAt] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_left')
        .eq('id', user.id)
        .single();
      if (profile) setCreditsLeft(profile.credits_left);

      const { data: sub } = await supabase
        .from('subscriptions')
        .select('status, next_billing_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      setSubscriptionStatus(sub ? 'active' : 'none');
      setNextBillingAt(sub?.next_billing_at ?? null);

      const { data: orderRows } = await supabase
        .from('orders')
        .select('order_id, package_id, credits, amount, paid_at, created_at')
        .eq('user_id', user.id)
        .eq('status', 'paid')
        .order('paid_at', { ascending: false })
        .limit(20);
      if (orderRows) setOrders(orderRows);

      const { data: ledgerRows } = await supabase
        .from('credit_ledger')
        .select('id, delta, balance_after, reason, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (ledgerRows) setLedger(ledgerRows);

      setLoadingUser(false);
    })();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    setError(null);
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '구독 해지에 실패했습니다.');
      setSubscriptionStatus('none');
    } catch (err) {
      setError(err instanceof Error ? err.message : '구독 해지에 실패했습니다.');
    } finally {
      setCanceling(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '회원 탈퇴에 실패했습니다.');
      await supabase.auth.signOut();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원 탈퇴에 실패했습니다.');
      setDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            홈으로
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            로그아웃
          </button>
        </div>

        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          마이페이지
        </h1>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">계정 정보</h2>
          <p className="text-sm text-slate-200">{user.email}</p>
          <p className="text-xs text-slate-500">
            {formatDate(user.created_at)} 가입
            {user.app_metadata?.provider && (
              <> · {PROVIDER_LABELS[user.app_metadata.provider] ?? user.app_metadata.provider}로 로그인</>
            )}
          </p>
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-1">
          <h2 className="text-sm font-semibold text-slate-300">보유 크레딧</h2>
          <p className="text-2xl font-bold text-amber-300">
            {creditsLeft ?? 0}
            <span className="text-sm text-slate-400 font-normal ml-1">회</span>
          </p>
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">정기구독</h2>
          {subscriptionStatus === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> 확인 중...
            </div>
          )}
          {subscriptionStatus === 'active' && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="space-y-1">
                <p className="text-sm text-indigo-300 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  매달 {SUBSCRIPTION_PLAN.credits}회 자동 충전 이용 중
                </p>
                {nextBillingAt && (
                  <p className="text-xs text-slate-500">
                    다음 결제 예정일: {formatDate(nextBillingAt)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={canceling}
                className="text-xs text-slate-400 hover:text-rose-400 underline disabled:opacity-50"
              >
                {canceling ? '해지 처리 중...' : '구독 해지하기'}
              </button>
            </div>
          )}
          {subscriptionStatus === 'none' && (
            <p className="text-sm text-slate-500">이용 중인 정기구독이 없습니다.</p>
          )}
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 shrink-0" />
            결제내역
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-500">결제 내역이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {orders.map((order) => (
                <li
                  key={order.order_id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm text-slate-200">{getOrderLabel(order.package_id)}</p>
                    <p className="text-xs text-slate-500">
                      {formatDate(order.paid_at ?? order.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-300 shrink-0">
                    {order.amount.toLocaleString('ko-KR')}원
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">
            환불 관련 문의는{' '}
            <a href="mailto:kiethljw@gmail.com" className="underline hover:text-slate-300">
              kiethljw@gmail.com
            </a>
            으로 연락해 주세요.
          </p>
        </section>

        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
            <History className="w-4 h-4 shrink-0" />
            크레딧 변동 이력
          </h2>
          {ledger.length === 0 ? (
            <p className="text-sm text-slate-500">아직 크레딧 변동 내역이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {ledger.map((entry) => (
                <li
                  key={entry.id}
                  className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm text-slate-200">
                      {REASON_LABELS[entry.reason] ?? entry.reason}
                    </p>
                    <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                  </div>
                  <p
                    className={`text-sm font-medium shrink-0 ${
                      entry.delta > 0 ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {entry.delta > 0 ? '+' : ''}
                    {entry.delta}회
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-red-950/20 border border-red-900/40 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-semibold text-red-300">회원 탈퇴</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            탈퇴 시 계정 정보, 보유 크레딧, 구독, 결제 내역이 모두 삭제되며 복구할 수 없습니다.
            {subscriptionStatus === 'active' && ' 이용 중인 정기구독도 함께 해지됩니다.'}
          </p>
          <button
            type="button"
            onClick={() => setDeleteModalOpen(true)}
            className="text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:bg-red-950/40 px-4 py-2 rounded-xl transition"
          >
            회원 탈퇴하기
          </button>
        </section>

        <p className="text-center text-xs text-slate-600">
          <a href="/terms" target="_blank" className="underline hover:text-slate-400">
            이용약관
          </a>
          {' · '}
          <a href="/privacy" target="_blank" className="underline hover:text-slate-400">
            개인정보처리방침
          </a>
        </p>
      </div>

      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-slate-100">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1 disabled:opacity-50"
              aria-label="탈퇴 창 닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center mb-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-center mb-1">정말 탈퇴하시겠어요?</h2>
            <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed">
              크레딧 {creditsLeft ?? 0}회를 포함한 모든 데이터가 즉시 삭제되며
              <br />
              되돌릴 수 없습니다.
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '네, 탈퇴할게요'}
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="w-full text-slate-400 hover:text-slate-200 py-2 text-sm transition disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
