'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Copy, Check, Video, Zap, History, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { getHistory, saveHistoryItem, deleteHistoryItem, HistoryItem } from '@/lib/storage';
import Header from '@/components/Header';
import TrendingTopics from '@/components/TrendingTopics';
import RechargeModal from '@/components/RechargeModal';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

interface ScriptData {
  title: string;
  hookingVariants: string[];
  scriptLines: {
    time: string;
    visual: string;
    audio: string;
  }[];
  hashtags: string[];
}

const EXAMPLE_TOPICS = [
  {
    label: '부업 · 수익',
    topic:
      '퇴근 후 하루 30분 투자해서 월 50만 원 버는 리셀 부업. 초보자도 바로 따라 할 수 있는 3가지 단계 안내',
    audience: '2030 사회초년생, 부업 희망자',
  },
  {
    label: '다이어트 · 루틴',
    topic:
      '바쁜 직장인을 위한 5분 아침 루틴. 출근 전에 할 수 있는 스트레칭 + 식단 팁 3가지',
    audience: '30대 직장인',
  },
  {
    label: '1인 창업',
    topic:
      '코딩 없이 1인 창업으로 마이크로 SaaS 만드는 4주 로드맵. 아이디어 검증부터 첫 결제까지',
    audience: '1인 창업가, 프리랜서',
  },
];

const LOADING_MESSAGES = [
  '💡 알고리즘 트렌드 분석 중...',
  '🔥 시청 이탈 방지 3초 후킹 문구 생성 중...',
  '🎬 타임라인별 나레이션 및 연출 구성 중...',
  '🏷️ 노출 상승을 위한 최적 해시태그 추출 중...',
];

export default function Home() {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState('YouTube Shorts');
  const [tone, setTone] = useState('재미있고 흥미진진한');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<ScriptData | null>(null);
  const [selectedHookIndex, setSelectedHookIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Auth & Credits 상태
  const [user, setUser] = useState<User | null>(null);
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);

  // Toast 및 복사 상태
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  // 이력(History) 관리 상태 — 서버 렌더링에는 localStorage가 없으므로 빈 배열로 시작하고
  // effect에서 채워야 하이드레이션 불일치(서버 "이력 (0)" vs 클라이언트 실제 값)가 안 생긴다.
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const resultRef = useRef<HTMLElement>(null);

  const supabase = useMemo(() => createClient(), []);

  // 사용자 정보 및 크레딧 불러오기 함수
  const fetchUserAndCredits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // 로그인 성공이 확인된 시점이므로 로그인 모달을 같이 닫는다.
      setLoginModalOpen(false);

      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_left')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCreditsLeft(profile.credits_left);
      }
    } else {
      setCreditsLeft(null);
    }
  }, [supabase]);

  // 초기 로드 시 이력(localStorage) 로드 + 유저 세션 불러오기 + 로그인 상태 변화 리스너 등록
  useEffect(() => {
    // localStorage는 서버에 없는 클라이언트 전용 데이터라 하이드레이션 이후에만 읽어야 한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(getHistory());

    (async () => {
      await fetchUserAndCredits();
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserAndCredits();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchUserAndCredits]);

  // 로딩 인터벌 관리 (loadingStep 초기화는 handleGenerate에서 loading을 켜는 시점에 처리)
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const applyExample = (example: (typeof EXAMPLE_TOPICS)[number]) => {
    setTopic(example.topic);
    setTargetAudience(example.audience);
    setError(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCreditsLeft(null);
    showToast('로그아웃 되었습니다.');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('주제를 입력해 주세요.');
      return;
    }

    if (!user) {
      setLoginModalOpen(true);
      setError('대본을 생성하려면 로그인이 필요합니다.');
      return;
    }

    if (creditsLeft !== null && creditsLeft <= 0) {
      setRechargeModalOpen(true);
      setError('무료 크레딧을 모두 소진하셨습니다. 충전 후 이용해 주세요.');
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    setResult(null);
    setError(null);
    setCopiedAll(false);
    setCopiedHashtags(false);
    setCopiedIndex(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, targetAudience, platform, tone }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setLoginModalOpen(true);
        }
        if (response.status === 403) {
          setRechargeModalOpen(true);
        }
        if (response.status === 401 || response.status === 403) {
          await fetchUserAndCredits();
        }
        throw new Error(data.error || '대본 생성 실패');
      }

      setResult(data.data);
      setSelectedHookIndex(0);

      if (typeof data.creditsLeft === 'number') {
        setCreditsLeft(data.creditsLeft);
      } else {
        await fetchUserAndCredits();
      }

      // 로컬스토리지 이력 저장
      const updatedHistory = saveHistoryItem({
        topic,
        targetAudience,
        platform,
        tone,
        script: data.data,
      });
      setHistory(updatedHistory);
      showToast('✨ 대본이 성공적으로 생성되었습니다!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setTopic(item.topic);
    setTargetAudience(item.targetAudience || '');
    if (item.platform) setPlatform(item.platform);
    if (item.tone) setTone(item.tone);
    setResult(item.script as ScriptData);
    setSelectedHookIndex(0);
    setShowHistory(false);
    showToast('📋 이력에서 대본을 불러왔습니다.');
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteHistoryItem(id);
    setHistory(updated);
    showToast('🗑️ 이력이 삭제되었습니다.');
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      showToast('📋 후킹 문구가 복사되었습니다.');
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다.');
    }
  };

  const copyFullScript = async () => {
    if (!result) return;

    const full = [
      `# ${result.title}`,
      '',
      '## 타임라인 대본',
      ...effectiveScriptLines.map(
        (line) => `[${line.time}]\nVisual: ${line.visual}\nAudio: ${line.audio}`
      ),
      '',
      '## 해시태그',
      result.hashtags.join(' '),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(full);
      setCopiedAll(true);
      showToast('📋 전체 대본이 복사되었습니다.');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다.');
    }
  };

  // 선택된 후킹 문구를 타임라인 0:00 구간의 나레이션에 반영한 대본
  const effectiveScriptLines = (() => {
    if (!result || result.scriptLines.length === 0) return [];
    const hookIndex = Math.min(selectedHookIndex, result.hookingVariants.length - 1);
    const selectedHook = result.hookingVariants[hookIndex];
    return result.scriptLines.map((line, idx) =>
      idx === 0 ? { ...line, audio: selectedHook } : line
    );
  })();

  const copyHashtags = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.hashtags.join(' '));
      setCopiedHashtags(true);
      showToast('🏷️ 해시태그가 복사되었습니다.');
      setTimeout(() => setCopiedHashtags(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 relative">
      {/* 1. 로그인 정보 및 실시간 크레딧 전달 Header */}
      <Header
        user={user}
        creditsLeft={creditsLeft}
        loginModalOpen={loginModalOpen}
        onLoginModalOpenChange={setLoginModalOpen}
        onLogout={handleLogout}
        onRechargeClick={() => setRechargeModalOpen(true)}
      />

      {user && (
        <RechargeModal
          open={rechargeModalOpen}
          user={user}
          onClose={() => setRechargeModalOpen(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-indigo-400/30 flex items-center gap-2 text-sm font-medium animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <header className="relative text-center space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs md:text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>AI 기반 숏폼 치트키</span>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory(!showHistory)}
              className="px-3.5 py-1.5 text-xs md:text-sm rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition flex items-center gap-1.5 shadow-sm"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>이력 ({history.length})</span>
              {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ShortsCheat
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto text-balance">
            알고리즘을 타는 3초 후킹 문구와 타임라인별 숏폼 대본을 몇 초 만에 자동으로 제작하세요.
          </p>

          {showHistory && (
            <div className="text-left bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 animate-fadeIn mt-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                  📋 최근 생성한 대본 목록 (최대 10개)
                </span>
                <span className="text-xs text-slate-500">클릭하면 대본을 불러옵니다</span>
              </div>
              {history.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">저장된 대본 생성 이력이 없습니다.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectHistory(item)}
                      className="flex items-center justify-between p-3 bg-slate-950 hover:bg-slate-800/80 rounded-xl cursor-pointer border border-slate-800/80 transition group"
                    >
                      <div className="overflow-hidden mr-2 space-y-0.5">
                        <p className="text-xs font-semibold text-slate-200 truncate">
                          {item.topic}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {item.platform || 'Shorts'} • {item.tone || '기본'} • {item.createdAt}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteHistory(e, item.id)}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-950/30 transition shrink-0"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-sm h-fit">
            <form onSubmit={handleGenerate} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300"
                >
                  {error}
                </div>
              )}

              <TrendingTopics
                onSelectTopic={(t) => {
                  setTopic(t);
                  setError(null);
                }}
              />

              <div>
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  주제 / 아이디어 <span className="text-indigo-400">*</span>
                </label>
                <textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="예: 직장인이 퇴근 후 1시간으로 월 100만 원 부수입 얻는 방법"
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                  required
                />

                <div className="mt-2.5 p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-xs space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>입력 팁: 디테일을 더하면 대본 퀄리티가 올라갑니다!</span>
                  </div>
                  <div className="text-slate-400 space-y-1 pl-5 leading-relaxed">
                    <p>
                      <span className="text-slate-500 line-through">단순한 입력:</span>{' '}
                      직장인 부업 추천
                    </p>
                    <p>
                      <span className="text-indigo-300 font-medium">추천 입력:</span>{' '}
                      퇴근 후 하루 30분 투자해서 월 50만 원 버는 리셀 부업. 초보자도 바로 따라 할
                      수 있는 3가지 단계 안내
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {EXAMPLE_TOPICS.map((ex) => (
                      <button
                        key={ex.label}
                        type="button"
                        onClick={() => applyExample(ex)}
                        className="rounded-lg border border-indigo-700/50 bg-indigo-950/50 px-3 py-1.5 text-xs text-indigo-300 transition hover:border-indigo-500 hover:bg-indigo-900/50"
                      >
                        {ex.label} 예시 적용
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="targetAudience"
                  className="block text-sm font-medium text-slate-300 mb-1.5"
                >
                  타깃 시청자
                </label>
                <input
                  id="targetAudience"
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="예: 2030 사회초년생, 부업 희망자"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label
                    htmlFor="platform"
                    className="block text-sm font-medium text-slate-300 mb-1.5"
                  >
                    플랫폼
                  </label>
                  <select
                    id="platform"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="YouTube Shorts">YouTube Shorts</option>
                    <option value="Instagram Reels">Instagram Reels</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tone"
                    className="block text-sm font-medium text-slate-300 mb-1.5"
                  >
                    톤앤매너
                  </label>
                  <select
                    id="tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="재미있고 흥미진진한">재미있고 흥미진진한</option>
                    <option value="전문적이고 신뢰감 있는">전문적이고 신뢰감 있는</option>
                    <option value="친근하고 공감 가는">친근하고 공감 가는</option>
                    <option value="충격적이고 후킹한">충격적이고 후킹한</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>생성 처리 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {!user
                        ? '로그인하고 대본 생성하기'
                        : creditsLeft !== null && creditsLeft <= 0
                          ? '충전하고 계속하기'
                          : creditsLeft !== null
                            ? `대본 생성하기 (남은 ${creditsLeft}회)`
                            : '대본 생성하기'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </section>

          <section ref={resultRef} className="lg:col-span-7 space-y-6 scroll-mt-8">
            {!result && !loading && (
              <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center text-slate-500 min-h-[400px] flex flex-col items-center justify-center space-y-3">
                <Video className="w-10 h-10 opacity-40" />
                <p className="text-sm">
                  왼쪽 입력창에 주제를 적거나 예시를 클릭한 뒤 [대본 생성하기]를 눌러보세요.
                </p>
              </div>
            )}

            {/* 단계별 스켈레톤 로딩 UI */}
            {loading && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center space-y-6 animate-pulse">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <div className="text-center space-y-2">
                  <p className="text-indigo-400 font-semibold text-base transition-all duration-300">
                    {LOADING_MESSAGES[loadingStep]}
                  </p>
                  <p className="text-slate-500 text-xs">AI가 최적의 대본을 작성하고 있습니다</p>
                </div>

                {/* Skeleton UI Previews */}
                <div className="w-full space-y-3 pt-4 border-t border-slate-800/80">
                  <div className="h-4 bg-slate-800 rounded-md w-3/4 mx-auto"></div>
                  <div className="h-4 bg-slate-800 rounded-md w-1/2 mx-auto"></div>
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-fadeIn">
                <button
                  type="button"
                  onClick={copyFullScript}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-sm text-slate-200 hover:bg-slate-800 transition"
                >
                  {copiedAll ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copiedAll ? '전체 대본 복사 완료!' : '전체 대본 복사하기'}
                </button>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
                    추천 영상 제목
                  </h3>
                  <p className="text-lg font-bold text-slate-100">{result.title}</p>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                  <h3 className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                    🔥 시청 이탈 방지 3초 후킹 문구 (택 1)
                  </h3>
                  <p className="text-[11px] text-slate-500 -mt-1">
                    하나를 고르면 아래 타임라인 대본의 오프닝 대사에 바로 반영됩니다.
                  </p>
                  <div className="space-y-2">
                    {result.hookingVariants.map((hook, idx) => {
                      const isSelected = idx === selectedHookIndex;
                      return (
                        <div
                          key={idx}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={() => setSelectedHookIndex(idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedHookIndex(idx);
                            }
                          }}
                          className={`flex items-center justify-between gap-2 rounded-xl p-3 text-sm group transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-pink-950/30 border-pink-500/60 text-slate-100'
                              : 'bg-slate-950 border-slate-800/80 text-slate-200 hover:border-pink-500/40'
                          }`}
                        >
                          <span className="flex items-center gap-2.5 pr-2">
                            <span
                              className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-pink-400' : 'border-slate-600'
                              }`}
                            >
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                              )}
                            </span>
                            <span>
                              {idx + 1}. {hook}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(hook, idx);
                            }}
                            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                            aria-label={`후킹 문구 ${idx + 1} 복사`}
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    🎬 타임라인별 연출 및 나레이션
                  </h3>
                  <div className="space-y-3">
                    {effectiveScriptLines.map((line, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-sm space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                            {line.time}
                          </span>
                          {idx === 0 && (
                            <span className="text-pink-400 text-[10px] font-sans font-semibold normal-case">
                              선택한 후킹 문구 {selectedHookIndex + 1}번 반영됨
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-300/90 font-medium">
                          🎥 Visual: {line.visual}
                        </p>
                        <p className="text-slate-200 font-medium pt-1">
                          🗣️ Audio: &ldquo;{line.audio}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      추천 해시태그
                    </h3>
                    <button
                      type="button"
                      onClick={copyHashtags}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                      aria-label="해시태그 복사"
                    >
                      {copiedHashtags ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-green-400" />
                          복사 완료
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          해시태그 복사
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.hashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-800/60 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700/50"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        <footer className="pt-8 pb-4 text-center text-xs text-slate-600 space-x-3">
          <Link href="/terms" className="hover:text-slate-400 transition">
            이용약관
          </Link>
          <span>·</span>
          <Link href="/privacy" className="hover:text-slate-400 transition">
            개인정보처리방침
          </Link>
        </footer>
      </div>
    </main>
  );
}