import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';
import { scriptDataSchema } from '@/lib/schemas';
import { createClient } from '@/lib/supabase/server';

async function refundCredit(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { error } = await supabase.rpc('refund_credit');
  if (error) {
    console.error('Credit refund failed:', error);
  }
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI 서비스가 아직 설정되지 않았습니다. 관리자에게 문의해 주세요.' },
      { status: 503 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: '대본을 생성하려면 로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  const { data: withinRateLimit, error: rateLimitError } = await supabase.rpc(
    'check_generate_rate_limit'
  );

  if (rateLimitError) {
    console.error('Rate limit RPC error:', rateLimitError);
  } else if (withinRateLimit === false) {
    return NextResponse.json(
      { error: '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 429 }
    );
  }

  let body: {
    topic?: unknown;
    targetAudience?: unknown;
    platform?: unknown;
    tone?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { topic, targetAudience, platform, tone } = body;

  if (!topic || typeof topic !== 'string' || !topic.trim()) {
    return NextResponse.json({ error: '주제를 입력해 주세요.' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits_left')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: '사용자 프로필 정보를 찾을 수 없습니다.' },
      { status: 404 }
    );
  }

  if (profile.credits_left <= 0) {
    return NextResponse.json(
      { error: '무료 크레딧을 모두 소진하셨습니다. 충전 후 이용해 주세요.' },
      { status: 403 }
    );
  }

  const { data: deductedCredits, error: decrementError } = await supabase.rpc(
    'decrement_credit'
  );

  if (decrementError) {
    console.error('Credit decrement RPC error:', decrementError);
    Sentry.captureException(decrementError);
    return NextResponse.json(
      {
        error:
          '크레딧 차감에 실패했습니다. Supabase에 decrement_credit 함수가 배포됐는지 확인해 주세요.',
      },
      { status: 500 }
    );
  }

  if (deductedCredits === null || typeof deductedCredits !== 'number') {
    return NextResponse.json(
      { error: '무료 크레딧을 모두 소진하셨습니다. 충전 후 이용해 주세요.' },
      { status: 403 }
    );
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30_000,
    maxRetries: 2,
  });

  const systemPrompt = `
You are a top-tier viral short-form content producer and scriptwriter for YouTube Shorts, Instagram Reels, and TikTok.
Your goal is to turn the given topic into an insanely engaging, high-retention Korean script.

Follow these strict scripting rules:
1. **Hook (0-3s)**: Must start with a shocking premise, counter-intuitive fact, or relatable pain point. Avoid generic greetings.
2. **Body (3-45s)**: Break down the content into fast-paced, punchy sentences. Include specific action steps or concrete details instead of vague advice.
3. **Visual Guide**: Be extremely specific. Mention camera angles, text overlay positions, sound effects (SFX), and stock footage ideas (e.g., "[화면 중앙에 굵은 빨간색 자막: '월 100만 원']", "[효과음: 띵-]").
4. **Audio/Narration**: Write complete, spoken-style Korean sentences ready for TTS or recording.
5. **Call To Action (45-60s)**: Provide a natural transition to drive comments, saves, or follows without sounding like a forced ad.

Structure your response strictly in JSON format:
{
  "title": "알고리즘 및 검색 노출 최적화 클릭유도형 제목",
  "hookingVariants": [
    "시청 이탈을 방지하는 3초 후킹 문구 (질문/충격형)",
    "시청 이탈을 방지하는 3초 후킹 문구 (결론 우선 제시형)",
    "시청 이탈을 방지하는 3초 후킹 문구 (강력한 공감/도발형)"
  ],
  "scriptLines": [
    {
      "time": "0:00 - 0:03",
      "visual": "화면 구도, 자막 텍스트 스타일, 효과음(SFX) 등 구체적 연출 지시문",
      "audio": "실제 녹음용 완성형 나레이션 대사"
    },
    {
      "time": "0:03 - 0:15",
      "visual": "화면 구도, 자막 텍스트 스타일, 효과음(SFX) 등 구체적 연출 지시문",
      "audio": "실제 녹음용 완성형 나레이션 대사"
    },
    {
      "time": "0:15 - 0:35",
      "visual": "화면 구도, 자막 텍스트 스타일, 효과음(SFX) 등 구체적 연출 지시문",
      "audio": "실제 녹음용 완성형 나레이션 대사"
    },
    {
      "time": "0:35 - 0:50",
      "visual": "화면 구도, 자막 텍스트 스타일, 효과음(SFX) 등 구체적 연출 지시문",
      "audio": "실제 녹음용 완성형 나레이션 대사"
    },
    {
      "time": "0:50 - 1:00",
      "visual": "CTA(댓글/저장/공유 유도) 화면 및 자막 연출",
      "audio": "자연스러운 행동 유도 나레이션 대사"
    }
  ],
  "hashtags": ["#태그1", "#태그2", "#태그3", "#태그4", "#태그5"]
}
`;

  const userPrompt = `
- 주제/아이디어: ${topic.trim()}
- 타깃 시청자: ${typeof targetAudience === 'string' && targetAudience ? targetAudience : '일반 대중'}
- 플랫폼: ${typeof platform === 'string' && platform ? platform : 'YouTube Shorts'}
- 톤앤매너: ${typeof tone === 'string' && tone ? tone : '재미있고 흥미진진한'}
    `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const resultText = completion.choices[0].message.content;
    let parsed: unknown;
    try {
      parsed = JSON.parse(resultText || '{}');
    } catch (parseError) {
      console.error('OpenAI JSON parse failed:', parseError);
      await refundCredit(supabase);
      return NextResponse.json(
        { error: 'AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    const validated = scriptDataSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Script schema validation failed:', validated.error.flatten());
      await refundCredit(supabase);
      return NextResponse.json(
        { error: 'AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: validated.data,
      creditsLeft: deductedCredits,
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    Sentry.captureException(error);
    await refundCredit(supabase);
    return NextResponse.json(
      { error: '대본 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    );
  }
}
