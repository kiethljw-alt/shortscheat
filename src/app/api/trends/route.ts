import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { TREND_CATEGORIES } from '@/lib/trendCategories';

// search.list는 유튜브 카테고리 조회를 매 사이클 8회(카테고리당 1회, 100유닛/회) 태우므로
// 1시간 캐시로는 일일 쿼터(10,000유닛)를 초과한다. 3시간 캐시로 여유를 둔다.
export const revalidate = 10800;

type CategoryTrendItem = {
  name: string;
  change: number;
};

type YoutubeCategoryTrendItem = {
  name: string;
  viewCount: number;
  sampleTitle: string;
};

type NaverDataLabResponse = {
  results?: {
    title: string;
    data?: { period: string; ratio: number }[];
  }[];
};

type YoutubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string };
};

// 유튜브 "인기 급상승"(mostPopular) 차트는 뮤직비디오/게임 트레일러/영화 예고편 위주라
// 이 앱이 만드는 정보성 숏폼 소재와 성격이 맞지 않는다(실제 생성 결과가 원본과 무관한
// 지어낸 경험담이 되는 문제로 확인됨). 대신 네이버와 같은 8개 카테고리 키워드로
// 최근 7일 조회수 상위 영상을 찾아 카테고리별 인기도로 환산한다.
async function fetchYoutubeCategoryTrends(): Promise<YoutubeCategoryTrendItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  const publishedAfter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // order=viewCount만 쓰면 검색어가 언급만 된 무관한 인기 영상이 섞인다
  // (예: "재테크" 검색 시 정치 뉴스, "강아지" 검색 시 무관한 밈 영상).
  // 대신 관련도순(relevance, 기본값)으로 후보 5개를 받아온 뒤, 그중 조회수가
  // 가장 높은 것을 그 카테고리의 대표 영상으로 고른다.
  const perCategory = await Promise.all(
    TREND_CATEGORIES.map(async (category) => {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      // 키워드 단독 검색은 뉴스/시사성 콘텐츠가 섞인다(예: "재테크" 단독 검색 시
      // 정치인 재산 관련 뉴스가 상위에 뜸). "꿀팁"을 붙여 정보성 콘텐츠 쪽으로 편향시킨다.
      url.searchParams.set('q', `${category.keywords[0]} 꿀팁`);
      url.searchParams.set('type', 'video');
      url.searchParams.set('regionCode', 'KR');
      url.searchParams.set('relevanceLanguage', 'ko');
      url.searchParams.set('publishedAfter', publishedAfter);
      url.searchParams.set('maxResults', '5');
      url.searchParams.set('key', apiKey);

      try {
        const res = await fetch(url.toString(), { next: { revalidate: 10800 } });
        if (!res.ok) {
          Sentry.captureMessage('YouTube category search failed', {
            level: 'warning',
            extra: { status: res.status, category: category.name },
          });
          return null;
        }
        const data: { items?: YoutubeSearchItem[] } = await res.json();
        const candidates = (data.items ?? [])
          .map((item) => ({ videoId: item.id?.videoId, title: item.snippet?.title }))
          .filter((c): c is { videoId: string; title: string } => Boolean(c.videoId && c.title));
        if (candidates.length === 0) return null;
        return { name: category.name, candidates };
      } catch (err) {
        Sentry.captureException(err);
        return null;
      }
    })
  );

  const found = perCategory.filter(
    (v): v is { name: string; candidates: { videoId: string; title: string }[] } => v !== null
  );
  if (found.length === 0) return [];

  // search.list 응답에는 조회수가 없으므로, 후보 영상 id를 한 번에 묶어 조회한다(1유닛).
  const allVideoIds = Array.from(new Set(found.flatMap((f) => f.candidates.map((c) => c.videoId))));
  const statsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  statsUrl.searchParams.set('part', 'statistics');
  statsUrl.searchParams.set('id', allVideoIds.join(','));
  statsUrl.searchParams.set('key', apiKey);

  let viewCounts: Record<string, number> = {};
  try {
    const res = await fetch(statsUrl.toString(), { next: { revalidate: 10800 } });
    if (res.ok) {
      const data: { items?: { id: string; statistics?: { viewCount?: string } }[] } =
        await res.json();
      viewCounts = Object.fromEntries(
        (data.items ?? []).map((item) => [item.id, Number(item.statistics?.viewCount ?? 0)])
      );
    }
  } catch (err) {
    Sentry.captureException(err);
  }

  return found
    .map((f) => {
      const best = f.candidates.reduce((top, cand) =>
        (viewCounts[cand.videoId] ?? 0) > (viewCounts[top.videoId] ?? 0) ? cand : top
      );
      return { name: f.name, viewCount: viewCounts[best.videoId] ?? 0, sampleTitle: best.title };
    })
    .sort((a, b) => b.viewCount - a.viewCount);
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
        next: { revalidate: 10800 },
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
  const [naver, youtube] = await Promise.all([
    fetchNaverCategoryTrends(),
    fetchYoutubeCategoryTrends(),
  ]);

  return NextResponse.json({ naver, youtube });
}
