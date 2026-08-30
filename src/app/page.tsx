'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Copy, Check, Video, Zap } from 'lucide-react';

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

export default function Home() {
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [platform, setPlatform] = useState('YouTube Shorts');
  const [tone, setTone] = useState('재미있고 흥미진진한');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScriptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const resultRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const applyExample = (example: (typeof EXAMPLE_TOPICS)[number]) => {
    setTopic(example.topic);
    setTargetAudience(example.audience);
    setError(null);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('주제를 입력해 주세요.');
      return;
    }

    setLoading(true);
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
        throw new Error(data.error || '대본 생성 실패');
      }

      setResult(data.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
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
      '## 후킹 (택1)',
      ...result.hookingVariants.map((h, i) => `${i + 1}. ${h}`),
      '',
      '## 타임라인 대본',
      ...result.scriptLines.map(
        (line) => `[${line.time}]\nVisual: ${line.visual}\nAudio: ${line.audio}`
      ),
      '',
      '## 해시태그',
      result.hashtags.join(' '),
    ].join('\n');

    try {
      await navigator.clipboard.writeText(full);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다.');
    }
  };

  const copyHashtags = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result.hashtags.join(' '));
      setCopiedHashtags(true);
      setTimeout(() => setCopiedHashtags(false), 2000);
    } catch {
      setError('클립보드 복사에 실패했습니다.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-3 pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
            <Zap className="w-4 h-4" />
            <span>AI 기반 숏폼 치트키</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            ShortsCheat
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto">
            알고리즘을 타는 3초 후킹 문구와 타임라인별 숏폼 대본을 몇 초 만에 자동으로 제작하세요.
          </p>
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

              <div className="grid grid-cols-2 gap-3">
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
                    <span>3초 후킹 대본 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>대본 생성하기</span>
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

            {loading && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">
                  알고리즘을 타는 후킹 문구를 구성하고 있습니다...
                </p>
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
                  <div className="space-y-2">
                    {result.hookingVariants.map((hook, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-sm text-slate-200 group hover:border-pink-500/40 transition-colors"
                      >
                        <span className="pr-2">
                          {idx + 1}. {hook}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(hook, idx)}
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
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                  <h3 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                    🎬 타임라인별 연출 및 나레이션
                  </h3>
                  <div className="space-y-3">
                    {result.scriptLines.map((line, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-sm space-y-2"
                      >
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-indigo-300">
                            {line.time}
                          </span>
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
      </div>
    </main>
  );
}
