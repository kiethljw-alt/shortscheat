'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { ArrowLeft, Loader2, LogOut, RefreshCw, AlertTriangle, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SUBSCRIPTION_PLAN } from '@/lib/subscriptionPlan';

type SubscriptionStatus = 'active' | 'none' | 'loading';

export default function MyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>('loading');
  const [canceling, setCanceling] = useState(false);

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
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
      setSubscriptionStatus(sub ? 'active' : 'none');

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
              <p className="text-sm text-indigo-300 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 shrink-0" />
                매달 {SUBSCRIPTION_PLAN.credits}회 자동 충전 이용 중
              </p>
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
