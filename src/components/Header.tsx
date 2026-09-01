'use client';

import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Zap, LogIn, LogOut, X } from 'lucide-react';

type HeaderProps = {
  user: User | null;
  creditsLeft: number | null;
  loginModalOpen: boolean;
  onLoginModalOpenChange: (open: boolean) => void;
  onLogout: () => void;
};

export default function Header({
  user,
  creditsLeft,
  loginModalOpen,
  onLoginModalOpenChange,
  onLogout,
}: HeaderProps) {
  const supabase = createClient();

  const handleSocialLogin = async (provider: 'google' | 'kakao') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <>
    <header className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ShortsCheat
          </span>
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-semibold">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />
                <span>
                  크레딧: <strong className="text-amber-300">{creditsLeft ?? 0}</strong>회
                </span>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">{user.email}</span>
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>로그아웃</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onLoginModalOpenChange(true)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3.5 py-1.5 rounded-xl text-xs transition shadow-md shadow-indigo-600/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>로그인 / 회원가입</span>
            </button>
          )}
        </div>
      </div>
    </header>

    {loginModalOpen && (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-slate-100">
          <button
            type="button"
            onClick={() => onLoginModalOpenChange(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
            aria-label="로그인 창 닫기"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 className="text-lg font-bold text-center mb-1">ShortsCheat 시작하기</h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            가입 시 5회 무료 대본 생성 크레딧을 드립니다!
          </p>

          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 text-slate-200 py-2.5 rounded-xl text-xs font-medium hover:bg-slate-800 transition"
            >
              구글로 시작하기
            </button>
            <button
              type="button"
              onClick={() => handleSocialLogin('kakao')}
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-[#191919] py-2.5 rounded-xl text-xs font-semibold hover:bg-[#FDD800] transition"
            >
              카카오로 시작하기
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
