import { useState } from "react";

const AUDIENCE_OPTIONS = [
  { value: "", label: "타겟 시청자를 선택하세요" },
  { value: "20s-women", label: "20대 여성" },
  { value: "30s-office", label: "30대 직장인" },
  { value: "40s-parents", label: "40대 부모" },
  { value: "startup", label: "1인 창업가 / 프리랜서" },
  { value: "students", label: "대학생 / 취준생" },
];

const SAMPLE_SCRIPTS = {
  default: {
    hashtags: [
      "#숏폼대본",
      "#릴스팁",
      "#쇼츠만들기",
      "#콘텐츠크리에이터",
      "#바이럴전략",
      "#30초스크립트",
      "#크리에이터라이프",
      "#알고리즘",
    ],
    hook: "이거 모르면 30초짜리 영상도 절대 안 터집니다. 지금 바로 저장하세요.",
    body: "첫 3초에 결론을 말하고, 한 문장엔 하나의 정보만 넣으세요. 자막은 화면 중앙, 2줄 이하. B-roll은 1.5초마다 컷 전환 — 시청 유지율이 확 올라갑니다. 마지막 5초는 '다음 영상 예고'로 끊지 말고, 행동 하나로 마무리하세요.",
    cta: "팔로우하면 매주 바이럴 대본 템플릿을 무료로 드립니다. 댓글에 '대본' 남겨주세요.",
  },
  "20s-women": {
    hashtags: [
      "#뷰티릴스",
      "#20대루틴",
      "#셀프케어",
      "#데일리템",
      "#인스타릴스",
      "#쇼츠추천",
      "#공감콘텐츠",
      "#자기관리",
    ],
    hook: "20대가 진짜로 저장하는 루틴, 딱 3가지만 알려드릴게요.",
    body: "아침엔 5분 스트레칭, 점심엔 10분 산책, 밤엔 스크린 OFF 30분. 거창한 목표 말고, 매일 반복 가능한 루틴부터. 화면엔 '전 / 후' 한 컷씩만 보여줘도 공감 폭발합니다.",
    cta: "내 루틴 더 보고 싶으면 팔로우! 댓글에 '루틴' 남기면 체크리스트 보내드려요.",
  },
  "30s-office": {
    hashtags: [
      "#직장인릴스",
      "#워라밸",
      "#생산성",
      "#30대직장인",
      "#퇴근후루틴",
      "#쇼츠팁",
      "#커리어",
      "#시간관리",
    ],
    hook: "퇴근 후 1시간으로 하루가 바뀌는 직장인 루틴, 솔직히 말해드릴게요.",
    body: "출근 전 15분 — 오늘 할 일 3개만 적기. 점심 10분 — 스크롤 대신 걷기. 퇴근 후 30분 — 내일 옷·가방 미리 준비. 작은 습관 3개가 '바쁜 핑계'를 없애줍니다.",
    cta: "직장인 생존 팁 매주 업로드 중. 저장해두고 월요일 아침에 꺼내보세요.",
  },
  startup: {
    hashtags: [
      "#1인창업",
      "#마이크로SaaS",
      "#솔로프레너",
      "#부업추천",
      "#창업팁",
      "#릴스마케팅",
      "#디지털노마드",
      "#수익화",
    ],
    hook: "1인 창업, 제품 만들기 전에 이것부터 하세요. 시간 낭비 그만.",
    body: "아이디어 → 랜딩페이지 → 결제 버튼. 코드 3만 줄보다 '결제 의사' 10명이 먼저입니다. 주 1회, 고객 인터뷰 30분. 숏폼은 '문제 공감 → 해결책 힌트 → 댓글 유도' 3단 구조가 전환율 최고.",
    cta: "1인 창업 로드맵 PDF 원하면 댓글에 'SaaS' 적어주세요. 팔로우하면 다음 편 바로 뜹니다.",
  },
};

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function ScriptStep({ step, label, accent, badge, children }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-5 backdrop-blur-sm">
      <div
        className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${accent}`}
        aria-hidden="true"
      />
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex h-6 items-center rounded-md bg-gradient-to-r px-2 text-xs font-bold uppercase tracking-wider text-white ${badge}`}
        >
          {step}
        </span>
        <span className="text-sm font-medium text-zinc-400">{label}</span>
      </div>
      <p className="pl-1 text-[15px] leading-relaxed text-zinc-100">{children}</p>
    </div>
  );
}

export default function App() {
  const [keyword, setKeyword] = useState("");
  const [audience, setAudience] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    if (loading) return;

    setLoading(true);
    setResult(null);
    setCopied(false);

    setTimeout(() => {
      const base = SAMPLE_SCRIPTS[audience] ?? SAMPLE_SCRIPTS.default;
      const topicLine = keyword.trim()
        ? `주제 '${keyword.trim()}'에 맞춘 30초 대본입니다.`
        : "30초 숏폼에 최적화된 대본입니다.";

      setResult({
        ...base,
        topicLine,
        hook: keyword.trim()
          ? `'${keyword.trim()}' — 이 주제, 30초 안에 끝내드릴게요.`
          : base.hook,
      });
      setLoading(false);
    }, 1500);
  };

  const fullScript = result
    ? `[Hook]\n${result.hook}\n\n[Body]\n${result.body}\n\n[CTA]\n${result.cta}`
    : "";

  const handleCopy = async () => {
    if (!fullScript) return;

    try {
      await navigator.clipboard.writeText(fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Header */}
        <header className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs font-medium text-zinc-400 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            Reels · Shorts Creator Tool
          </div>
          <h1 className="bg-gradient-to-br from-white via-zinc-200 to-zinc-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            숏폼 대본 생성기
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base text-zinc-400 sm:text-lg">
            키워드 하나로 30초 릴스·쇼츠 대본과 해시태그를 즉시 생성하세요.
          </p>
        </header>

        {/* Input Form */}
        <section className="mb-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="keyword"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                키워드 / 주제
              </label>
              <input
                id="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="예: 아침 루틴, 1인 창업, 다이어트 꿀팁"
                className="w-full rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="audience"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                타겟 시청자
              </label>
              <select
                id="audience"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full appearance-none rounded-xl border border-zinc-700/80 bg-zinc-950/80 px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20"
              >
                {AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Spinner />
                  대본 생성 중...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  대본 생성하기
                </>
              )}
            </button>
          </div>
        </section>

        {/* Output Area */}
        {(loading || result) && (
          <section
            className={`space-y-6 transition-all duration-500 ${result ? "opacity-100 translate-y-0" : "opacity-60"}`}
            aria-live="polite"
          >
            {/* Hashtags */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xl">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400">
                  #
                </span>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                  추천 해시태그
                </h2>
              </div>
              {loading && !result ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-24 animate-pulse rounded-lg bg-zinc-800"
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {result.hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-1.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-500/40"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 30s Script */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                      30초 스크립트
                    </h2>
                    {result?.topicLine && (
                      <p className="mt-0.5 text-xs text-zinc-500">{result.topicLine}</p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-800/80 px-3 py-1 text-xs text-zinc-400">
                  ~30 sec
                </span>
              </div>

              {loading && !result ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 animate-pulse rounded-xl bg-zinc-800/80"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <ScriptStep
                    step="01"
                    label="Hook — 첫 3초"
                    accent="from-rose-500 to-orange-500"
                    badge="from-rose-500 to-orange-500"
                  >
                    {result.hook}
                  </ScriptStep>
                  <ScriptStep
                    step="02"
                    label="Body — 핵심 내용"
                    accent="from-violet-500 to-indigo-500"
                    badge="from-violet-500 to-indigo-500"
                  >
                    {result.body}
                  </ScriptStep>
                  <ScriptStep
                    step="03"
                    label="CTA — 행동 유도"
                    accent="from-emerald-500 to-cyan-500"
                    badge="from-emerald-500 to-cyan-500"
                  >
                    {result.cta}
                  </ScriptStep>
                </div>
              )}

              {result && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 px-6 py-3 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
                >
                  {copied ? (
                    <>
                      <svg
                        className="h-5 w-5 text-emerald-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      복사 완료!
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      대본 복사하기
                    </>
                  )}
                </button>
              )}
            </div>
          </section>
        )}

        <footer className="mt-12 text-center text-xs text-zinc-600">
          Mock UI · 백엔드 연동 전 데모 버전
        </footer>
      </div>
    </div>
  );
}
