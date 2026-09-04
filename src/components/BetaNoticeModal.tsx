'use client';

import { useEffect, useState } from 'react';
import { X, Rocket } from 'lucide-react';

const DISMISS_KEY = 'shortscheat_beta_notice_dismissed_v1';

export default function BetaNoticeModal() {
  // 서버/클라이언트 첫 렌더를 일치시키기 위해 false로 시작하고, localStorage 확인은
  // 마운트 이후 effect에서만 한다(하이드레이션 불일치 방지).
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) {
        // localStorage는 클라이언트에만 존재하는 소스라 SSR에서는 읽을 수 없다 —
        // 마운트 후 이 effect에서 읽고 여는 것이 정상적인 처리 방식이다.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(true);
      }
    } catch {
      // localStorage 접근 실패는 무시 — 팝업을 안 띄우는 정도로 조용히 넘어간다.
    }
  }, []);

  const handleClose = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // 저장 실패해도 이번 세션에서 닫히는 것 자체는 정상 동작.
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative text-slate-100">
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 p-1"
          aria-label="안내 창 닫기"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <Rocket className="w-5 h-5 text-indigo-400 shrink-0" />
          <h2 className="text-lg font-bold">베타 테스트 중이에요</h2>
        </div>

        <div className="space-y-2.5 text-sm text-slate-300 leading-relaxed">
          <p>
            ShortsCheat는 아직 정식 출시 전, <strong className="text-slate-100">베타 테스트 단계</strong>예요.
            자유롭게 대본을 생성해보시고, 이상한 점이나 아쉬운 점을 알려주시면 큰 도움이 됩니다!
          </p>
          <p className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-lg px-3 py-2 text-xs">
            ⚠️ 크레딧 충전·정기구독은 아직 <strong>테스트 결제 환경</strong>이에요. 실제로 돈이 빠져나가지
            않으니, 이 버튼들은 눌러보지 않으셔도 괜찮습니다.
          </p>
          <p className="text-xs text-slate-500">
            가입하시면 무료 크레딧 5회로 대본 생성 기능을 바로 체험하실 수 있어요.
          </p>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="w-full mt-5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl text-sm transition"
        >
          확인했어요
        </button>
      </div>
    </div>
  );
}
