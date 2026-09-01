import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // SENTRY_AUTH_TOKEN이 없으면(로컬 개발 등) 소스맵 업로드만 건너뛰고 빌드는 정상 진행됨.
});
