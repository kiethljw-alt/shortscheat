'use client';

import { useEffect, useState } from 'react';
import { Flame, TrendingUp, Eye } from 'lucide-react';

type NaverCategoryItem = {
  name: string;
  change: number;
};

type YoutubeCategoryItem = {
  name: string;
  viewCount: number;
  sampleTitle: string;
};

type TrendsResponse = {
  naver: NaverCategoryItem[];
  youtube: YoutubeCategoryItem[];
};

type RankedRow = {
  name: string;
  metricLabel: string;
  sampleTitle?: string;
};

type TrendingTopicsProps = {
  onSelectTopic: (topic: string) => void;
};

const buildCategoryTopic = (name: string) =>
  `${name} 카테고리에서 사람들이 실제로 도움될 만한 구체적인 꿀팁이나 노하우 하나를 숫자와 함께 소개하는 숏폼`;

function formatViewCount(n: number): string {
  if (n >= 100_000_000) return `조회수 ${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `조회수 ${Math.round(n / 10_000).toLocaleString('ko-KR')}만`;
  return `조회수 ${n.toLocaleString('ko-KR')}`;
}

export default function TrendingTopics({ onSelectTopic }: TrendingTopicsProps) {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [tab, setTab] = useState<'naver' | 'youtube'>('naver');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/trends');
        if (!res.ok) return;
        const json: TrendsResponse = await res.json();
        if (cancelled) return;
        setData(json);
        // 네이버 쪽에 상승 카테고리가 없으면 데이터가 있는 유튜브 탭을 기본으로 보여준다.
        if (!json.naver.some((c) => c.change > 0) && json.youtube.length > 0) {
          setTab('youtube');
        }
      } catch {
        // 트렌드 로딩 실패는 핵심 기능이 아니므로 조용히 무시한다.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const naverRows: RankedRow[] = (data?.naver ?? [])
    .filter((c) => c.change > 0)
    .slice(0, 5)
    .map((c) => ({ name: c.name, metricLabel: `+${c.change}` }));

  const youtubeRows: RankedRow[] = (data?.youtube ?? [])
    .slice(0, 5)
    .map((c) => ({ name: c.name, metricLabel: formatViewCount(c.viewCount), sampleTitle: c.sampleTitle }));

  if (naverRows.length === 0 && youtubeRows.length === 0) return null;

  const rows = tab === 'naver' ? naverRows : youtubeRows;

  return (
    <div className="mb-5 p-3.5 bg-rose-950/20 border border-rose-800/40 rounded-xl text-xs space-y-2.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
          <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>지금 뜨는 주제 순위</span>
        </div>
        <div className="flex rounded-lg border border-rose-800/40 overflow-hidden text-[11px]">
          <button
            type="button"
            onClick={() => setTab('naver')}
            disabled={naverRows.length === 0}
            className={`px-2.5 py-1 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === 'naver'
                ? 'bg-rose-800/60 text-rose-100'
                : 'text-rose-400/70 hover:text-rose-300'
            }`}
          >
            네이버 순위
          </button>
          <button
            type="button"
            onClick={() => setTab('youtube')}
            disabled={youtubeRows.length === 0}
            className={`px-2.5 py-1 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed ${
              tab === 'youtube'
                ? 'bg-rose-800/60 text-rose-100'
                : 'text-rose-400/70 hover:text-rose-300'
            }`}
          >
            유튜브 순위
          </button>
        </div>
      </div>

      <ol className="space-y-1.5">
        {rows.map((row, i) => (
          <li key={row.name}>
            <button
              type="button"
              onClick={() => onSelectTopic(buildCategoryTopic(row.name))}
              className="w-full flex items-center gap-2.5 rounded-lg border border-rose-700/50 bg-rose-950/40 px-2.5 py-2 text-left transition hover:border-rose-500 hover:bg-rose-900/40"
            >
              <span className="flex items-center justify-center w-5 h-5 shrink-0 rounded-full bg-rose-800/60 text-rose-200 font-bold text-[11px]">
                {i + 1}
              </span>
              <span className="flex-1 min-w-0">
                <span className="text-rose-200 font-medium">{row.name}</span>
                {row.sampleTitle && (
                  <span className="block truncate text-rose-400/60 text-[11px]">
                    인기 영상: {row.sampleTitle}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-1 text-rose-400/80 shrink-0">
                {tab === 'youtube' ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <TrendingUp className="w-3 h-3" />
                )}
                {row.metricLabel}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
