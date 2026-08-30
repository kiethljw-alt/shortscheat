import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShortsCheat — AI 기반 숏폼 대본 치트키",
  description:
    "알고리즘을 타는 3초 후킹 문구와 타임라인별 숏폼 대본을 몇 초 만에 자동으로 제작하세요. 유튜브 쇼츠, 인스타그램 릴스, 틱톡 완벽 지원.",
  keywords: [
    "ShortsCheat",
    "숏폼",
    "유튜브 쇼츠",
    "인스타그램 릴스",
    "틱톡",
    "대본 생성기",
    "AI 대본",
    "후킹 문구",
  ],
  authors: [{ name: "ShortsCheat" }],
  openGraph: {
    title: "ShortsCheat — AI 기반 숏폼 대본 치트키",
    description:
      "알고리즘을 타는 3초 후킹 문구와 타임라인별 숏폼 대본을 몇 초 만에 자동으로 제작하세요.",
    url: "https://shortscheat.vercel.app",
    siteName: "ShortsCheat",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShortsCheat — AI 기반 숏폼 대본 치트키",
    description:
      "알고리즘을 타는 3초 후킹 문구와 타임라인별 숏폼 대본을 몇 초 만에 자동으로 제작하세요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}