'use client';

import { useEffect, useState } from 'react';
import { Flame, TrendingUp, Play } from 'lucide-react';

type YoutubeTrendItem = {
  id: string;
  title: string;
  channelTitle: string;
};

type CategoryTrendItem = {
  name: string;
  change: number;
};

type TrendsResponse = {
  youtube: YoutubeTrendItem[];
  categories: CategoryTrendItem[];
};

type TrendingTopicsProps = {
  onSelectTopic: (topic: string) => void;
};

export default function TrendingTopics({ onSelectTopic }: TrendingTopicsProps) {
  const [data, setData] = useState<TrendsResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/trends');
        if (!res.ok) return;
        const json: TrendsResponse = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // 트렌드 로딩 실패는 핵심 기능이 아니므로 조용히 무시한다.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const risingCategories = (data?.categories ?? []).filter((c) => c.change > 0).slice(0, 5);
  const youtube = data?.youtube ?? [];

  if (youtube.length === 0 && risingCategories.length === 0) return null;

  return (
    <div className="mb-5 p-3.5 bg-rose-950/20 border border-rose-800/40 rounded-xl text-xs space-y-2.5">
      <div className="flex items-center gap-1.5 text-rose-300 font-semibold">
        <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span>지금 뜨는 주제로 시작하기</span>
      </div>

      {risingCategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {risingCategories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectTopic(`${cat.name} 관련 요즘 뜨는 숏폼 소재`)}
              className="flex items-center gap-1 rounded-lg border border-rose-700/50 bg-rose-950/40 px-2.5 py-1.5 text-rose-300 transition hover:border-rose-500 hover:bg-rose-900/40"
            >
              <TrendingUp className="w-3 h-3 shrink-0" />
              {cat.name}
              <span className="text-rose-400/80">+{cat.change}</span>
            </button>
          ))}
        </div>
      )}

      {youtube.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {youtube.map((video) => (
            <button
              key={video.id}
              type="button"
              onClick={() => onSelectTopic(video.title)}
              title={video.title}
              className="flex items-center gap-1.5 shrink-0 max-w-[220px] rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-slate-300 transition hover:border-rose-500/50 hover:bg-slate-900"
            >
              <Play className="w-3.5 h-3.5 text-red-400 shrink-0 fill-red-400" />
              <span className="truncate">{video.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
