import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { TREND_CATEGORIES } from '@/lib/trendCategories';

// 트렌드는 초 단위로 바뀌지 않으므로 1시간 캐시로 외부 API 쿼터를 아낀다.
export const revalidate = 3600;

type YoutubeTrendItem = {
  id: string;
  title: string;
  channelTitle: string;
};

type CategoryTrendItem = {
  name: string;
  change: number;
};

type YoutubeApiItem = {
  id: string;
  snippet?: { title?: string; channelTitle?: string };
};

type NaverDataLabResponse = {
  results?: {
    title: string;
    data?: { period: string; ratio: number }[];
  }[];
};

async function fetchYoutubeTrending(): Promise<YoutubeTrendItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.searchParams.set('part', 'snippet');
  url.searchParams.set('chart', 'mostPopular');
  url.searchParams.set('regionCode', 'KR');
  url.searchParams.set('maxResults', '12');
  url.searchParams.set('key', apiKey);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      Sentry.captureMessage('YouTube trending fetch failed', {
        level: 'warning',
        extra: { status: res.status },
      });
      return [];
    }
    const data: { items?: YoutubeApiItem[] } = await res.json();
    return (data.items ?? [])
      .map((item) => ({
        id: item.id,
        title: item.snippet?.title ?? '',
        channelTitle: item.snippet?.channelTitle ?? '',
      }))
      .filter((item) => item.title);
  } catch (err) {
    Sentry.captureException(err);
    return [];
  }
}

// 2026-06 네이버 데이터랩 API가 "네이버 개발자센터"에서 "NAVER API HUB"(네이버클라우드플랫폼)로
// 이관되면서 엔드포인트와 인증 헤더가 바뀌었다.
// 구: POST openapi.naver.com/v1/datalab/search, X-Naver-Client-Id/Secret
// 신: POST naverapihub.apigw.ntruss.com/search-trend/v1/search, X-NCP-APIGW-API-KEY-ID/KEY
async function fetchNaverCategoryTrends(): Promise<CategoryTrendItem[]> {
  const apiKeyId = process.env.NAVER_API_HUB_KEY_ID;
  const apiKey = process.env.NAVER_API_HUB_KEY;
  if (!apiKeyId || !apiKey) return [];

  const end = new Date();
  const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const chunks: (typeof TREND_CATEGORIES)[] = [];
  for (let i = 0; i < TREND_CATEGORIES.length; i += 5) {
    chunks.push(TREND_CATEGORIES.slice(i, i + 5));
  }

  const results: CategoryTrendItem[] = [];

  for (const chunk of chunks) {
    try {
      const res = await fetch('https://naverapihub.apigw.ntruss.com/search-trend/v1/search', {
        method: 'POST',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': apiKeyId,
          'X-NCP-APIGW-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: fmt(start),
          endDate: fmt(end),
          timeUnit: 'date',
          keywordGroups: chunk.map((c) => ({ groupName: c.name, keywords: c.keywords })),
        }),
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        Sentry.captureMessage('Naver DataLab fetch failed', {
          level: 'warning',
          extra: { status: res.status },
        });
        continue;
      }

      const data: NaverDataLabResponse = await res.json();
      for (const group of data.results ?? []) {
        const points = group.data ?? [];
        if (points.length < 2) continue;
        const first = points[0].ratio ?? 0;
        const last = points[points.length - 1].ratio ?? 0;
        results.push({ name: group.title, change: Number((last - first).toFixed(1)) });
      }
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  return results.sort((a, b) => b.change - a.change);
}

export async function GET() {
  const [youtube, categories] = await Promise.all([
    fetchYoutubeTrending(),
    fetchNaverCategoryTrends(),
  ]);

  return NextResponse.json({ youtube, categories });
}
