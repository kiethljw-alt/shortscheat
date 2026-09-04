import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // 이 앱은 자체 iframe 임베드가 필요 없으므로 클릭재킹을 막는다.
          { key: "X-Frame-Options", value: "DENY" },
          // 브라우저가 응답 Content-Type을 임의로 재해석(MIME 스니핑)하지 못하게 한다.
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // SENTRY_AUTH_TOKEN이 없으면(로컬 개발 등) 소스맵 업로드만 건너뛰고 빌드는 정상 진행됨.
});
