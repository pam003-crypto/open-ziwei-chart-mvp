import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Ziwei Chart MVP",
  description: "A minimal open-source Ziwei chart web app MVP.",
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
