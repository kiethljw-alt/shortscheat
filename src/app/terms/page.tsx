import Link from "next/link";

export const metadata = {
  title: "이용약관 — ShortsCheat",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold mt-3">ShortsCheat 이용약관</h1>
          <p className="text-xs text-slate-500 mt-1">시행일: 2026년 9월 1일</p>
        </div>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">제1조 (목적)</h2>
          <p>
            이 약관은 ShortsCheat(운영자: 이재웅, 이하 &ldquo;회사&rdquo;)가 제공하는 AI 숏폼
            대본 생성 서비스 &ldquo;ShortsCheat&rdquo;(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여
            회사와 이용자의 권리, 의무 및 책임사항을 정함을 목적으로 합니다.
          </p>
          <p className="text-xs text-slate-500">
            회사는 사업자등록을 마치지 않은 개인 운영자이며, 사업자등록 완료 시 본
            약관에 사업자 정보를 반영합니다.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">제2조 (서비스의 내용)</h2>
          <p>
            회사는 이용자가 입력한 주제를 바탕으로 인공지능(AI)을 활용해
            숏폼 영상용 대본, 후킹 문구, 해시태그 등을 생성하여 제공합니다.
            생성된 결과물은 AI에 의해 자동 생성되며, 정확성·완전성을
            보장하지 않습니다.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            제3조 (회원가입 및 크레딧)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              이용자는 구글, 카카오 등 소셜 로그인을 통해 회원으로 가입할 수
              있습니다.
            </li>
            <li>
              신규 가입 시 무료 크레딧 5회가 지급되며, 대본 생성 1회당
              크레딧 1개가 차감됩니다.
            </li>
            <li>
              무료 크레딧을 모두 소진한 이용자는 유상으로 크레딧을 충전하여
              서비스를 계속 이용할 수 있습니다.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            제4조 (결제 및 환불)
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              크레딧 충전 결제는 토스페이먼츠(Toss Payments)를 통해
              처리되며, 회사는 카드 정보 등 결제 수단 정보를 직접 저장하지
              않습니다.
            </li>
            <li>
              크레딧은 디지털 콘텐츠 이용권으로, 대본 생성에 1회 이상
              사용된 크레딧 묶음(주문)은 전자상거래 등에서의 소비자보호에
              관한 법률에 따라 환불이 제한될 수 있습니다.
            </li>
            <li>
              전혀 사용하지 않은 크레딧에 한해 결제일로부터 7일 이내
              kiethljw@gmail.com로 환불을 요청할 수 있습니다.
            </li>
            <li>
              AI 응답 오류 등 회사의 귀책사유로 대본 생성이 실패한 경우
              차감된 크레딧은 자동으로 환불(복구)됩니다.
            </li>
            <li>
              월 정기구독은 최초 결제일을 기준으로 매 30일마다 9,900원이
              자동으로 청구되며, 결제와 동시에 크레딧 30회가 지급됩니다.
              구독은 마이페이지에서 언제든지 해지할 수 있고, 해지 시
              다음 결제일부터 청구가 중단됩니다. 이미 청구된 당 회차
              이용권은 제3항의 환불 기준을 따릅니다.
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            제5조 (이용자의 의무)
          </h2>
          <p>
            이용자는 생성된 콘텐츠를 관련 법령 및 각 플랫폼(유튜브,
            인스타그램, 틱톡 등)의 정책을 준수하는 범위 내에서 사용해야
            하며, 타인의 권리를 침해하거나 불법적인 목적으로 서비스를
            이용할 수 없습니다.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            제6조 (면책조항)
          </h2>
          <p>
            회사는 AI가 생성한 콘텐츠의 저작권, 사실관계, 특정 목적에의
            적합성을 보장하지 않으며, 이용자가 생성된 콘텐츠를 활용하여
            발생한 손해에 대해 책임을 지지 않습니다.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            제7조 (문의)
          </h2>
          <p>
            서비스 이용 및 결제와 관련한 문의는 kiethljw@gmail.com로
            연락해 주세요.
          </p>
        </section>
      </div>
    </main>
  );
}
