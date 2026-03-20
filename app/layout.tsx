import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "수강신청 시스템 테스트 대시보드",
  description: "대학교 수강신청 시스템 관리자 테스트 UI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="bg-gray-950 text-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
