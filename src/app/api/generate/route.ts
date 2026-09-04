import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import * as Sentry from '@sentry/nextjs';
import { scriptDataSchema } from '@/lib/schemas';
import { createClient } from '@/lib/supabase/server';

// 모델이 구체성/톤 기준을 맞추도록 붙이는 few-shot 예시.
// 서로 다른 카테고리로 두 개를 둬서 특정 주제에 과적합되지 않게 한다.
const FEW_SHOT_EXAMPLES: Array<{ user: string; assistant: object }> = [
  {
    user: `- 주제/아이디어: 재고 없이 스마트스토어 위탁판매로 첫 달 30만원 번 후기
- 타깃 시청자: 2030 직장인, 부업 희망자
- 플랫폼: YouTube Shorts
- 톤앤매너: 재미있고 흥미진진한`,
    assistant: {
      title: '스마트스토어, 재고 없이 한 달 30만원',
      hookingVariants: [
        '이 캡처, 제 스마트스토어 정산 내역입니다. 재고는 단 하나도 안 샀어요.',
        '위탁판매 첫 달 순수익 30만원 나온 계산법, 마진율까지 공개합니다.',
        '"그거 다 과장 광고 아니야?" 라고 생각하셨다면 지금 정산표부터 보여드릴게요.',
      ],
      scriptLines: [
        {
          time: '0:00 - 0:03',
          visual:
            "[화면 중앙에 실제 스마트스토어 정산 내역 캡처, 굵은 노란색 자막: '순수익 30만원']",
          audio: '이 캡처, 제 스마트스토어 정산 내역이에요. 재고는 단 하나도 안 샀습니다.',
        },
        {
          time: '0:03 - 0:20',
          visual:
            "[네이버 스마트스토어 위탁판매 등록 화면 녹화, 자막: '사입 0원 · 마진율 15%']",
          audio:
            '방법은 위탁판매예요. 주방용품 카테고리에서 마진율 15% 이상 나오는 상품만 골라서 스토어에 등록만 했어요.',
        },
        {
          time: '0:20 - 0:40',
          visual: '[상품 소싱 사이트 화면, 화살표로 마진 계산 부분 강조]',
          audio:
            '하루에 30분씩, 상품 5개만 꾸준히 올렸더니 3주차부터 주문이 들어오기 시작했어요.',
        },
        {
          time: '0:40 - 0:55',
          visual: "[주문·발주 화면, 자막: '발주도 3분이면 끝']",
          audio: '주문 들어오면 발주처에 그대로 넘기기만 하면 끝이라 재고 부담이 전혀 없어요.',
        },
        {
          time: '0:55 - 1:00',
          visual: "[정산 내역 다시 클로즈업, 댓글 유도 자막: '카테고리 궁금하면 댓글로!']",
          audio: '구체적인 카테고리 고르는 기준, 댓글 남겨주시면 다음 영상에서 풀어드릴게요.',
        },
      ],
      hashtags: ['#스마트스토어', '#위탁판매', '#부업', '#직장인부업', '#사입없이시작'],
    },
  },
  {
    user: `- 주제/아이디어: 직장인 점심시간 계단 오르기로 뱃살 뺀 3주 루틴
- 타깃 시청자: 30대 직장인
- 플랫폼: YouTube Shorts
- 톤앤매너: 친근하고 공감 가는`,
    assistant: {
      title: '계단 10분으로 뱃살 뺀 3주 기록',
      hookingVariants: [
        '헬스장 한 번도 안 갔는데, 3주 만에 바지가 헐렁해졌어요.',
        '점심시간 딱 10분, 계단 오르기만으로 뱃살 뺀 루틴 공개합니다.',
        '"그거 효과 없어"라는 말 듣고 시작한 계단 오르기, 3주 후 결과는 이랬습니다.',
      ],
      scriptLines: [
        {
          time: '0:00 - 0:03',
          visual: "[전후 옆구리 비교 사진, 굵은 흰색 자막: '3주, 계단만 올랐다']",
          audio: '헬스장 한 번도 안 갔는데, 3주 만에 바지가 헐렁해졌어요.',
        },
        {
          time: '0:03 - 0:20',
          visual: "[사무실 계단 오르는 모습 녹화, 자막: '점심시간 10분 · 10층 반복']",
          audio: '방법은 간단해요. 점심 먹고 10분, 사무실 10층까지 계단으로 왕복했어요.',
        },
        {
          time: '0:20 - 0:40',
          visual: "[스마트워치 심박수 화면 클로즈업, 자막: '평균 심박수 130대']",
          audio: '숨은 좀 차지만 대화는 가능한 정도, 심박수 130대를 유지하는 게 핵심이었어요.',
        },
        {
          time: '0:40 - 0:55',
          visual: "[캘린더에 체크 표시하는 모습, 자막: '주 5회, 딱 3주만']",
          audio: '주 5회, 딱 3주만 지켰더니 허리둘레가 눈에 띄게 줄었어요.',
        },
        {
          time: '0:55 - 1:00',
          visual: "[웃으며 계단 내려오는 모습, 댓글 유도 자막: '오늘부터 같이 해요']",
          audio: '오늘 점심시간부터 같이 시작해보실 분, 댓글로 인증해주세요.',
        },
      ],
      hashtags: ['#계단오르기', '#직장인다이어트', '#점심시간운동', '#뱃살빼기', '#3주루틴'],
    },
  },
  {
    // 이 예시는 주제에 결과 수치가 전혀 주어지지 않은 경우(트렌드 카테고리 칩을 눌렀을 때 등)를
    // 다룬다. 앞의 두 예시는 모두 topic 자체에 실제 결과 수치가 있어서, 모델이 "구체성 = 아무
    // 수치나 지어내기"로 오해하고 없는 연구/통계를 인용하는 경향이 실제로 관찰됐다. 이 예시로
    // "수치가 없으면 방법(단계 수·설정값·도구명)으로 구체화하라"는 걸 직접 시범 보인다.
    user: `- 주제/아이디어: 육아 카테고리에서 사람들이 실제로 도움될 만한 구체적인 꿀팁이나 노하우 하나를 숫자와 함께 소개하는 숏폼
- 타깃 시청자: 0~3세 자녀를 둔 초보 부모
- 플랫폼: YouTube Shorts
- 톤앤매너: 친근하고 공감 가는`,
    assistant: {
      title: '아이 낮잠, 이 3단계면 끝',
      hookingVariants: [
        '아이 낮잠 재우다 지친 분? 이 3단계만 지키면 달라져요.',
        '낮잠 루틴, 순서만 바꿔도 훨씬 쉬워집니다. 그 3단계 알려드릴게요.',
        '"우리 애는 낮잠을 안 자요"라고요? 순서가 틀렸을 수도 있어요.',
      ],
      scriptLines: [
        {
          time: '0:00 - 0:03',
          visual: "[아이 재우려다 지친 부모 모습, 굵은 노란색 자막: '낮잠, 순서만 바꿔도 다르다']",
          audio: '아이 낮잠 재우다 지친 분? 이 3단계만 지키면 달라져요.',
        },
        {
          time: '0:03 - 0:20',
          visual: "[커튼을 치는 손 클로즈업, 자막: '1단계: 조명 어둡게']",
          audio: '1단계는 커튼으로 방을 어둡게 만드는 거예요. 뇌가 지금은 잘 시간이라고 인식하게 해줘요.',
        },
        {
          time: '0:20 - 0:40',
          visual: "[백색소음 앱 재생 화면, 자막: '2단계: 백색소음 30분 타이머']",
          audio: '2단계는 백색소음 앱을 30분 타이머로 틀어주는 거예요. 갑자기 나는 소리에 깨는 걸 막아줘요.',
        },
        {
          time: '0:40 - 0:55',
          visual: "[매번 같은 자리에 눕히는 모습, 자막: '3단계: 매번 같은 자세·같은 자리']",
          audio: '3단계는 매번 똑같은 자세, 똑같은 자리에 눕히는 거예요. 몸이 그 패턴을 잘 시간으로 기억해요.',
        },
        {
          time: '0:55 - 1:00',
          visual: "[웃으며 방을 나오는 부모, 댓글 유도 자막: '며칠 만에 달라졌는지 댓글로!']",
          audio: '이 순서 그대로 3일만 해보시고, 며칠 만에 달라졌는지 댓글로 알려주세요.',
        },
      ],
      hashtags: ['#육아꿀팁', '#낮잠루틴', '#신생아육아', '#초보부모', '#육아노하우'],
    },
  },
];

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
1. **Title**: Max 22 Korean characters (count spaces and punctuation). Exactly one idea — never stitch two phrases together with "!" or "," into a combined title. It must read as a short punchy label a viewer can scan in under a second on a vertical feed, not a recap sentence. Cut any parenthetical asides or secondary clauses.
2. **Hook (0-3s)**: Must start with a shocking premise, counter-intuitive fact, or relatable pain point. Avoid generic greetings.
3. **Body (3-45s)**: Break down the content into fast-paced, punchy sentences. Every line must contain at least one concrete, checkable detail — a real app/service/product name, a standard ratio or percentage, a specific step count, or a well-known reference point. Never fall back on vague generic advice like "트렌드 상품을 찾아보세요" or "꾸준히 하세요" with nothing to anchor it. **Never invent a fake fact and present it as real** — this includes fabricating a specific personal result number as if it really happened (e.g., "3주 만에 30만원 벌었다" out of nothing), AND fabricating a statistic or citing a made-up authority to sound credible (e.g., "국제 심리학 연구에 따르면 스트레스가 50% 감소한다", "전문가들에 따르면"). Only state a specific outcome number or cite a study/expert if it was already given in the topic input. When the topic doesn't supply a real outcome number or source, ground concreteness in the METHOD instead: exact app/tool names, step-by-step actions, real ratios or settings, a realistic timeframe to try it, or a widely-known general fact that needs no citation — never an invented result or a fabricated authority.
4. **Visual Guide**: Be extremely specific. Mention camera angles, text overlay positions, sound effects (SFX), and stock footage ideas (e.g., "[화면 중앙에 굵은 빨간색 자막: '월 100만 원']", "[효과음: 띵-]").
5. **Audio/Narration**: Write complete, spoken-style Korean sentences ready for TTS or recording.
6. **Call To Action (45-60s)**: Provide a natural transition to drive comments, saves, or follows without sounding like a forced ad.
7. **Hooking variants must differ in psychological angle, not just phrasing** — one shock/counter-intuitive fact, one number-led proof/conclusion-first, one skeptic-baiting social-proof or provocation. See the example responses below for the concreteness and tonal separation expected.

Structure your response strictly in JSON format:
{
  "title": "클릭유도형 제목 (최대 22자, 아이디어 하나만)",
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
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...FEW_SHOT_EXAMPLES.flatMap(
          (example): OpenAI.Chat.ChatCompletionMessageParam[] => [
            { role: 'user', content: example.user },
            { role: 'assistant', content: JSON.stringify(example.assistant) },
          ]
        ),
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
