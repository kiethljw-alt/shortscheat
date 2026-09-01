import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 — ShortsCheat",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link href="/" className="text-xs text-indigo-400 hover:text-indigo-300">
            ← 홈으로
          </Link>
          <h1 className="text-2xl font-bold mt-3">개인정보처리방침</h1>
          <p className="text-xs text-slate-500 mt-1">시행일: 2026년 9월 1일</p>
        </div>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            1. 수집하는 개인정보 항목
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>소셜 로그인(구글, 카카오)을 통해 제공받는 이메일, 프로필 식별자</li>
            <li>대본 생성 시 입력한 주제, 타깃 시청자 등 입력값</li>
            <li>결제 시 토스페이먼츠를 통해 처리되는 결제 승인 정보(카드번호 등 민감정보는 회사가 직접 수집·저장하지 않음)</li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            2. 개인정보의 수집 및 이용 목적
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>회원 식별 및 로그인 유지</li>
            <li>무료/유료 크레딧 잔액 관리 및 대본 생성 서비스 제공</li>
            <li>결제 처리 및 결제 관련 고객 문의 대응</li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            3. 개인정보의 처리 위탁 및 제3자 제공
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <span className="font-medium text-slate-200">Supabase</span> —
              회원 인증 및 데이터베이스 호스팅
            </li>
            <li>
              <span className="font-medium text-slate-200">OpenAI</span> —
              입력한 주제 텍스트를 대본 생성(AI 추론) 목적으로 처리
            </li>
            <li>
              <span className="font-medium text-slate-200">토스페이먼츠</span>{" "}
              — 결제 승인 및 처리
            </li>
          </ul>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            4. 개인정보의 보유 및 이용 기간
          </h2>
          <p>
            회원 탈퇴 시 지체 없이 파기하며, 전자상거래 등에서의
            소비자보호에 관한 법률 등 관계 법령에 따라 보존이 필요한
            결제 기록은 해당 법령이 정한 기간 동안 별도 보관합니다.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            5. 이용자의 권리
          </h2>
          <p>
            이용자는 언제든지 자신의 개인정보 조회, 정정, 삭제, 처리 정지를
            요청할 수 있으며, [고객센터 이메일]로 요청하실 수 있습니다.
          </p>
        </section>

        <section className="space-y-2 text-sm text-slate-300 leading-relaxed">
          <h2 className="text-base font-semibold text-slate-100">
            6. 개인정보 보호책임자
          </h2>
          <p>
            성명: [담당자명] · 이메일: [고객센터 이메일]
          </p>
        </section>
      </div>
    </main>
  );
}
