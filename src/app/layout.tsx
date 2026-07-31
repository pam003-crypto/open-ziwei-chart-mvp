import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "紫微斗数排盘工具 | 东方术数研究平台",
  description: "基于开源排盘与本地规则引擎的紫微斗数研究工作台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
